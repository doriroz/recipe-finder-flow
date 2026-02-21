import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

interface RecipeResponse {
  title: string;
  ingredients: { name: string; amount?: string; unit?: string }[];
  instructions: string[];
  substitutions: { original: string; alternative: string; reason: string }[];
  cooking_time: number;
  difficulty: string;
  why_it_works: string;
  reliability_score: "high" | "medium" | "creative";
}

type DifficultyLevel = "low" | "medium" | "high";

// ============ MYMEMORY TRANSLATION ============

async function translateText(text: string, langpair: string): Promise<string> {
  try {
    const truncated = text.length > 490 ? text.substring(0, 490) : text;
    const url = `https://api.mymemory.translated.net/get?q=${encodeURIComponent(truncated)}&langpair=${encodeURIComponent(langpair)}`;
    const res = await fetch(url);
    if (!res.ok) return text;
    const data = await res.json();
    if (data.responseStatus === 200 && data.responseData?.translatedText) {
      return data.responseData.translatedText;
    }
    return text;
  } catch {
    return text;
  }
}

async function translateEach(texts: string[], langpair: string): Promise<string[]> {
  const results: string[] = [];
  for (const text of texts) {
    const translated = await translateText(text, langpair);
    results.push(translated);
  }
  return results;
}

// ============ DB-BASED SUBSTITUTIONS ============

async function findSubstitutionsFromDB(
  supabaseAdmin: any,
  ingredientNames: string[]
): Promise<{ original: string; alternative: string; reason: string }[]> {
  try {
    const { data: allSubs, error } = await supabaseAdmin
      .from("ingredient_substitutions")
      .select("original_ingredient, alternative_ingredient, reason")
      .eq("is_valid", true);

    if (error || !allSubs || allSubs.length === 0) return [];

    const matched: { original: string; alternative: string; reason: string }[] = [];
    for (const ingName of ingredientNames) {
      for (const sub of allSubs) {
        if (
          ingName.includes(sub.original_ingredient) ||
          sub.original_ingredient.includes(ingName)
        ) {
          matched.push({
            original: sub.original_ingredient,
            alternative: sub.alternative_ingredient,
            reason: sub.reason,
          });
        }
      }
    }
    // Deduplicate and limit to 4
    const unique = matched.filter(
      (m, i, arr) => arr.findIndex(x => x.original === m.original && x.alternative === m.alternative) === i
    );
    return unique.slice(0, 4);
  } catch (err) {
    console.error("Substitution lookup error:", err);
    return [];
  }
}

// ============ HYBRID MATCHING LOGIC ============

interface LibraryRecipe {
  id: string;
  title: string;
  ingredients: any;
  ingredient_names: string[];
  instructions: string[];
  substitutions: any;
  cooking_time: number | null;
  difficulty: string;
}

function computeMatchScore(userIngredients: string[], recipeIngredients: string[]): number {
  if (recipeIngredients.length === 0) return 0;
  // Ignore common pantry items for scoring
  const pantryItems = new Set(['מלח', 'פלפל שחור', 'שמן', 'שמן זית', 'מים']);
  const significantRecipeIngs = recipeIngredients.filter(i => !pantryItems.has(i));
  if (significantRecipeIngs.length === 0) return 0;

  const userSet = new Set(userIngredients.map(i => i.trim()));
  let matched = 0;
  for (const ing of significantRecipeIngs) {
    // Check exact or partial match
    if (userSet.has(ing)) {
      matched++;
    } else {
      for (const userIng of userSet) {
        if (userIng.includes(ing) || ing.includes(userIng)) {
          matched++;
          break;
        }
      }
    }
  }
  return (matched / significantRecipeIngs.length) * 100;
}

async function findLocalMatch(
  supabase: any,
  userIngredients: string[],
  difficulty: DifficultyLevel
): Promise<{ recipe: LibraryRecipe; score: number } | null> {
  const { data: library, error } = await supabase
    .from("recipe_library")
    .select("*");

  if (error || !library || library.length === 0) {
    console.log("No recipe library found or error:", error);
    return null;
  }

  let bestMatch: { recipe: LibraryRecipe; score: number } | null = null;

  for (const recipe of library) {
    const score = computeMatchScore(userIngredients, recipe.ingredient_names || []);
    if (score >= 70 && (!bestMatch || score > bestMatch.score)) {
      bestMatch = { recipe, score };
    }
  }

  if (bestMatch) {
    console.log(`Local match found: "${bestMatch.recipe.title}" with score ${bestMatch.score}%`);
  }

  return bestMatch;
}

// ============ CREDIT & RATE LIMITING ============

async function checkAndDeductCredits(
  supabaseAdmin: any,
  userId: string,
  creditsNeeded: number,
  actionType: string
): Promise<{ allowed: boolean; reason?: string }> {
  // Check global daily cap
  const { data: globalCap } = await supabaseAdmin
    .from("app_settings")
    .select("value")
    .eq("key", "ai_daily_global_cap")
    .single();

  const globalLimit = parseInt(String(globalCap?.value || "500"));
  
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const { count: globalToday } = await supabaseAdmin
    .from("ai_usage_logs")
    .select("*", { count: "exact", head: true })
    .gte("created_at", today.toISOString())
    .eq("source", "ai");

  if ((globalToday || 0) >= globalLimit) {
    return { allowed: false, reason: "המערכת עמוסה כרגע, נסו שוב מאוחר יותר" };
  }

  // Check per-user daily cap
  const { data: userCap } = await supabaseAdmin
    .from("app_settings")
    .select("value")
    .eq("key", "ai_daily_user_cap")
    .single();

  const userDailyLimit = parseInt(String(userCap?.value || "20"));

  const { count: userToday } = await supabaseAdmin
    .from("ai_usage_logs")
    .select("*", { count: "exact", head: true })
    .gte("created_at", today.toISOString())
    .eq("user_id", userId)
    .eq("source", "ai");

  if ((userToday || 0) >= userDailyLimit) {
    return { allowed: false, reason: "הגעתם למגבלת השימוש היומית. נסו שוב מחר" };
  }

  // Check user credits
  let { data: userCredits } = await supabaseAdmin
    .from("user_credits")
    .select("*")
    .eq("user_id", userId)
    .single();

  if (!userCredits) {
    // Create credits record for new user
    const { data: newCredits } = await supabaseAdmin
      .from("user_credits")
      .insert({ user_id: userId, credits_remaining: 10 })
      .select()
      .single();
    userCredits = newCredits;
  }

  // Reset daily counter if new day
  if (userCredits) {
    const resetAt = new Date(userCredits.daily_reset_at);
    if (resetAt < today) {
      await supabaseAdmin
        .from("user_credits")
        .update({ daily_ai_calls: 0, daily_reset_at: new Date().toISOString() })
        .eq("user_id", userId);
      userCredits.daily_ai_calls = 0;
    }
  }

  if (userCredits && userCredits.credits_remaining < creditsNeeded) {
    return { allowed: false, reason: `אין מספיק קרדיטים (נדרשים ${creditsNeeded}, נותרו ${userCredits.credits_remaining})` };
  }

  // Deduct credits and increment counters
  if (userCredits) {
    await supabaseAdmin
      .from("user_credits")
      .update({
        credits_remaining: userCredits.credits_remaining - creditsNeeded,
        daily_ai_calls: (userCredits.daily_ai_calls || 0) + 1,
        total_ai_calls: (userCredits.total_ai_calls || 0) + 1,
        updated_at: new Date().toISOString(),
      })
      .eq("user_id", userId);
  }

  return { allowed: true };
}

async function logAiUsage(
  supabaseAdmin: any,
  userId: string,
  actionType: string,
  tokensEstimated: number,
  creditsUsed: number,
  source: string
) {
  await supabaseAdmin.from("ai_usage_logs").insert({
    user_id: userId,
    action_type: actionType,
    tokens_estimated: tokensEstimated,
    credits_used: creditsUsed,
    source,
  });
}

async function incrementLocalMatchCount(supabaseAdmin: any, userId: string) {
  const { data: credits } = await supabaseAdmin
    .from("user_credits")
    .select("total_local_matches")
    .eq("user_id", userId)
    .single();

  await supabaseAdmin
    .from("user_credits")
    .update({ total_local_matches: (credits?.total_local_matches || 0) + 1 })
    .eq("user_id", userId);
}

// ============ IMAGE INGREDIENT EXTRACTION ============

async function extractIngredientsFromImage(imageBase64: string, apiKey: string): Promise<string[]> {
  const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "google/gemini-3-flash-preview",
      messages: [
        {
          role: "system",
          content: `אתה מומחה לזיהוי מצרכים בתמונות. זהה את כל המצרכים הנראים בתמונה והחזר רשימה בפורמט JSON.
החזר רק מערך JSON של שמות מצרכים בעברית, ללא טקסט נוסף.
דוגמה: ["עגבניות", "בצל", "שום", "פלפל"]`,
        },
        {
          role: "user",
          content: [
            { type: "text", text: "זהה את המצרכים בתמונה הזו:" },
            {
              type: "image_url",
              image_url: {
                url: imageBase64.startsWith("data:") ? imageBase64 : `data:image/jpeg;base64,${imageBase64}`,
              },
            },
          ],
        },
      ],
      temperature: 0.3,
      max_tokens: 256,
    }),
  });

  if (!response.ok) throw new Error(`Image analysis error: ${response.status}`);

  const data = await response.json();
  const content = data.choices?.[0]?.message?.content?.trim();
  const jsonMatch = content?.match(/\[[\s\S]*\]/);
  const parsed = JSON.parse(jsonMatch ? jsonMatch[0] : content);
  return Array.isArray(parsed) ? parsed : [];
}

// ============ SPOONACULAR RECIPE FETCHING ============

async function fetchRecipeFromSpoonacular(
  hebrewIngredients: string[]
): Promise<RecipeResponse | null> {
  const SPOONACULAR_API_KEY = Deno.env.get("SPOONACULAR_API_KEY");
  if (!SPOONACULAR_API_KEY) {
    console.error("SPOONACULAR_API_KEY not configured");
    return null;
  }

  try {
    // Translate ingredients to English
    const englishIngredients = await translateEach(hebrewIngredients, "he|en");
    console.log("Translated ingredients for Spoonacular:", englishIngredients);

    // Find recipes by ingredients
    const findUrl = `https://api.spoonacular.com/recipes/findByIngredients?ingredients=${encodeURIComponent(englishIngredients.join(","))}&number=1&ranking=2&apiKey=${SPOONACULAR_API_KEY}`;
    const findRes = await fetch(findUrl);
    if (!findRes.ok) {
      console.error("Spoonacular findByIngredients error:", findRes.status);
      return null;
    }
    const findData = await findRes.json();
    if (!findData || findData.length === 0) return null;

    const recipeId = findData[0].id;

    // Get full recipe info
    const infoUrl = `https://api.spoonacular.com/recipes/${recipeId}/information?apiKey=${SPOONACULAR_API_KEY}`;
    const infoRes = await fetch(infoUrl);
    if (!infoRes.ok) return null;
    const info = await infoRes.json();

    // Extract data
    const title = info.title || "Recipe";
    const cookingTime = info.readyInMinutes || 30;
    const extIngredients: { name: string; amount: number; unit: string }[] = (info.extendedIngredients || []).map((ing: any) => ({
      name: ing.name || ing.original || "",
      amount: ing.amount || 0,
      unit: ing.unit || "",
    }));
    const steps: string[] = (info.analyzedInstructions?.[0]?.steps || []).map((s: any) => s.step || "");

    if (steps.length === 0 && info.instructions) {
      const cleanInstructions = info.instructions.replace(/<[^>]*>/g, "").trim();
      if (cleanInstructions) steps.push(cleanInstructions);
    }

    if (steps.length === 0) return null;

    // Batch translate: title + ingredient names + steps
    const textsToTranslate = [title, ...extIngredients.map(i => i.name), ...steps];
    const translated = await translateEach(textsToTranslate, "en|he");

    const translatedTitle = translated[0];
    const translatedIngNames = translated.slice(1, 1 + extIngredients.length);
    const translatedSteps = translated.slice(1 + extIngredients.length);

    const ingredients = extIngredients.map((ing, idx) => ({
      name: translatedIngNames[idx] || ing.name,
      amount: ing.amount ? String(ing.amount) : undefined,
      unit: ing.unit || undefined,
    }));

    // Estimate difficulty
    const stepCount = translatedSteps.length;
    const ingCount = ingredients.length;
    let difficulty = "medium";
    if (stepCount <= 4 && ingCount <= 6) difficulty = "low";
    else if (stepCount >= 8 || ingCount >= 12) difficulty = "high";

    return {
      title: translatedTitle,
      ingredients,
      instructions: translatedSteps,
      substitutions: [],
      cooking_time: cookingTime,
      difficulty,
      why_it_works: `מתכון מאומת מ-Spoonacular עם ${ingCount} מצרכים ו-${stepCount} שלבי הכנה`,
      reliability_score: "high",
    };
  } catch (err) {
    console.error("Spoonacular fetch error:", err);
    return null;
  }
}

// ============ MAIN HANDLER ============

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    // LOVABLE_API_KEY only needed for image analysis now

    // User-scoped client
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );

    // Service role client for credits/logging (bypasses RLS)
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const token = authHeader.replace("Bearer ", "");
    const { data: claimsData, error: claimsError } = await supabase.auth.getClaims(token);
    if (claimsError || !claimsData?.claims) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const userId = claimsData.claims.sub;

    const { ingredients, imageBase64, difficulty = "medium" } = await req.json();

    if (!ingredients && !imageBase64) {
      return new Response(
        JSON.stringify({ error: "Either ingredients or imageBase64 is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // ---- STEP 1: Handle image → extract ingredients only ----
    let ingredientNames: string[] = [];
    let usedImageAnalysis = false;

    if (imageBase64) {
      // Check credits for image analysis (3 credits)
      const creditCheck = await checkAndDeductCredits(supabaseAdmin, userId, 3, "image_analysis");
      if (!creditCheck.allowed) {
        return new Response(JSON.stringify({ error: creditCheck.reason }), {
          status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is required for image analysis");
      ingredientNames = await extractIngredientsFromImage(imageBase64, LOVABLE_API_KEY);
      usedImageAnalysis = true;

      await logAiUsage(supabaseAdmin, userId, "image_analysis", 256, 3, "ai");

      if (ingredientNames.length === 0) {
        return new Response(
          JSON.stringify({ error: "לא הצלחנו לזהות מצרכים בתמונה. נסו שוב עם תמונה ברורה יותר" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      console.log("Extracted ingredients from image:", ingredientNames);
    } else if (ingredients && Array.isArray(ingredients)) {
      ingredientNames = ingredients.map((i: any) => typeof i === "string" ? i : i.name);
    }

    // ---- STEP 2: Try local recipe matching ----
    const localMatch = await findLocalMatch(supabaseAdmin, ingredientNames, difficulty as DifficultyLevel);

    if (localMatch && localMatch.score >= 70) {
      // Serve from local library — no AI cost!
      console.log(`Serving local recipe: "${localMatch.recipe.title}" (score: ${localMatch.score}%)`);

      const recipe = localMatch.recipe;
      const { data: insertedRecipe, error: insertError } = await supabase
        .from("recipes")
        .insert({
          title: recipe.title,
          ingredients: recipe.ingredients,
          instructions: recipe.instructions,
          substitutions: recipe.substitutions || [],
          cooking_time: recipe.cooking_time || null,
          user_id: userId,
        })
        .select()
        .single();

      if (insertError) throw new Error(`Failed to save recipe: ${insertError.message}`);

      await logAiUsage(supabaseAdmin, userId, "recipe_generation", 0, 0, "local");
      await incrementLocalMatchCount(supabaseAdmin, userId);

      return new Response(
        JSON.stringify({
          success: true,
          recipe: insertedRecipe,
          why_it_works: `מתכון מותאם מהמאגר המקומי עם התאמת מצרכים של ${Math.round(localMatch.score)}%`,
          reliability_score: "high",
          spoonacular_verified: false,
          source: "local",
        }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // ---- STEP 3: Spoonacular recipe (no AI, no credits) ----
    const spoonacularRecipe = await fetchRecipeFromSpoonacular(ingredientNames);

    if (!spoonacularRecipe) {
      return new Response(
        JSON.stringify({ error: "לא מצאנו מתכון מתאים למצרכים שבחרתם. נסו לשנות או להוסיף מצרכים" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Look up substitutions from DB based on translated ingredient names
    const hebrewIngNames = spoonacularRecipe.ingredients.map((i: any) => i.name);
    const dbSubstitutions = await findSubstitutionsFromDB(supabaseAdmin, hebrewIngNames);
    if (dbSubstitutions.length > 0) {
      spoonacularRecipe.substitutions = dbSubstitutions;
      console.log(`Found ${dbSubstitutions.length} substitutions from DB`);
    }

    const { data: insertedRecipe, error: insertError } = await supabase
      .from("recipes")
      .insert({
        title: spoonacularRecipe.title,
        ingredients: spoonacularRecipe.ingredients,
        instructions: spoonacularRecipe.instructions,
        substitutions: spoonacularRecipe.substitutions || [],
        cooking_time: spoonacularRecipe.cooking_time || null,
        user_id: userId,
      })
      .select()
      .single();

    if (insertError) throw new Error(`Failed to save recipe: ${insertError.message}`);

    await logAiUsage(supabaseAdmin, userId, "recipe_generation", 0, 0, "spoonacular");

    return new Response(
      JSON.stringify({
        success: true,
        recipe: insertedRecipe,
        why_it_works: spoonacularRecipe.why_it_works || null,
        reliability_score: spoonacularRecipe.reliability_score || "high",
        spoonacular_verified: true,
        source: "spoonacular",
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Edge function error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
