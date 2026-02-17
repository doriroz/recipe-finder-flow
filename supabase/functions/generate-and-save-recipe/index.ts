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

const getDifficultyPrompt = (difficulty: DifficultyLevel): string => {
  switch (difficulty) {
    case "low":
      return `רמת קושי: קל - מקסימום 5 שלבים פשוטים, הימנע מטכניקות מורכבות, פחות מצרכים (עד 8)`;
    case "high":
      return `רמת קושי: מאתגר - 8-12 שלבים מפורטים, טכניקות מתקדמות, יותר מצרכים ותבלינים`;
    default:
      return `רמת קושי: בינונית - 5-8 שלבים, שילוב טכניקות פשוטות ובינוניות`;
  }
};

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

// ============ SPOONACULAR VERIFICATION ============

async function translateIngredients(hebrewIngredients: string[], apiKey: string): Promise<string[]> {
  try {
    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: "Translate the following Hebrew ingredient names to English. Return ONLY a JSON array of strings." },
          { role: "user", content: JSON.stringify(hebrewIngredients) },
        ],
        temperature: 0,
        max_tokens: 256,
      }),
    });
    if (!response.ok) return hebrewIngredients;
    const data = await response.json();
    const content = data.choices?.[0]?.message?.content?.trim();
    const jsonMatch = content?.match(/\[[\s\S]*\]/);
    const translated = JSON.parse(jsonMatch ? jsonMatch[0] : content);
    return Array.isArray(translated) ? translated : hebrewIngredients;
  } catch {
    return hebrewIngredients;
  }
}

async function verifyWithSpoonacular(ingredients: string[], apiKey: string): Promise<{ verified: boolean; similarRecipe?: string }> {
  const SPOONACULAR_API_KEY = Deno.env.get("SPOONACULAR_API_KEY");
  if (!SPOONACULAR_API_KEY) return { verified: false };

  try {
    const englishIngredients = await translateIngredients(ingredients, apiKey);
    const url = `https://api.spoonacular.com/recipes/findByIngredients?ingredients=${encodeURIComponent(englishIngredients.join(","))}&number=1&ranking=2&apiKey=${SPOONACULAR_API_KEY}`;
    const response = await fetch(url);
    if (!response.ok) return { verified: false };
    const data = await response.json();
    if (data?.length > 0) return { verified: true, similarRecipe: data[0].title };
    return { verified: false };
  } catch {
    return { verified: false };
  }
}

// ============ AI RECIPE GENERATION (FALLBACK) ============

async function generateRecipeWithAI(
  apiKey: string,
  ingredientsList: string,
  difficulty: DifficultyLevel,
  spoonacularHint?: string,
  baseRecipeHint?: string
): Promise<RecipeResponse> {
  const difficultyInstructions = getDifficultyPrompt(difficulty);

  const systemPrompt = `You are a culinary expert. Provide a recipe based on provided ingredients. Only suggest established flavor combinations.

${difficultyInstructions}

${spoonacularHint ? `הערה: נמצא מתכון דומה: "${spoonacularHint}". השתמש כהשראה.` : ""}
${baseRecipeHint ? `בסיס מתכון מהמאגר המקומי: ${baseRecipeHint}. התאם ושפר אותו.` : ""}

הפורמט:
{
  "title": "שם המתכון בעברית",
  "ingredients": [{"name": "שם", "amount": "כמות", "unit": "יחידה"}],
  "instructions": ["שלב 1", "שלב 2"],
  "substitutions": [{"original": "מצרך", "alternative": "תחליף", "reason": "הסבר"}],
  "cooking_time": 30,
  "difficulty": "${difficulty}",
  "why_it_works": "הסבר קצר (2-3 משפטים)",
  "reliability_score": "high | medium | creative"
}

עברית בלבד. JSON בלבד.`;

  const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      model: "google/gemini-3-flash-preview",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: `המצרכים הזמינים: ${ingredientsList}` },
      ],
      temperature: 0.7,
      max_tokens: 1500,
    }),
  });

  if (!response.ok) {
    const status = response.status;
    if (status === 429) throw new Error("RATE_LIMIT");
    if (status === 402) throw new Error("PAYMENT_REQUIRED");
    throw new Error(`AI Gateway error: ${status}`);
  }

  const data = await response.json();
  const content = data.choices?.[0]?.message?.content;
  if (!content) throw new Error("No content from AI");

  const jsonMatch = content.match(/```(?:json)?\s*([\s\S]*?)```/);
  const jsonString = jsonMatch ? jsonMatch[1].trim() : content.trim();
  return JSON.parse(jsonString);
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
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

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

    // ---- STEP 3: AI generation (fallback) ----
    const creditsNeeded = usedImageAnalysis ? 0 : 2; // Image already charged 3
    if (creditsNeeded > 0) {
      const creditCheck = await checkAndDeductCredits(supabaseAdmin, userId, creditsNeeded, "recipe_generation");
      if (!creditCheck.allowed) {
        return new Response(JSON.stringify({ error: creditCheck.reason }), {
          status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    }

    // Spoonacular verification
    let spoonacularResult = { verified: false, similarRecipe: undefined as string | undefined };
    if (ingredientNames.length > 0) {
      spoonacularResult = await verifyWithSpoonacular(ingredientNames, LOVABLE_API_KEY);
    }

    // If we had a partial local match, use it as a base hint
    const baseHint = localMatch ? JSON.stringify({ title: localMatch.recipe.title, score: localMatch.score }) : undefined;

    try {
      const recipeJson = await generateRecipeWithAI(
        LOVABLE_API_KEY,
        ingredientNames.join(", "),
        difficulty as DifficultyLevel,
        spoonacularResult.similarRecipe,
        baseHint
      );

      if (!recipeJson.title || !recipeJson.ingredients || !recipeJson.instructions) {
        throw new Error("Invalid recipe structure from AI");
      }

      const { data: insertedRecipe, error: insertError } = await supabase
        .from("recipes")
        .insert({
          title: recipeJson.title,
          ingredients: recipeJson.ingredients,
          instructions: recipeJson.instructions,
          substitutions: recipeJson.substitutions || [],
          cooking_time: recipeJson.cooking_time || null,
          user_id: userId,
        })
        .select()
        .single();

      if (insertError) throw new Error(`Failed to save recipe: ${insertError.message}`);

      await logAiUsage(supabaseAdmin, userId, "recipe_generation", 1500, creditsNeeded, "ai");

      return new Response(
        JSON.stringify({
          success: true,
          recipe: insertedRecipe,
          why_it_works: recipeJson.why_it_works || null,
          reliability_score: recipeJson.reliability_score || "medium",
          spoonacular_verified: spoonacularResult.verified,
          source: "ai",
        }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    } catch (aiError) {
      const msg = aiError instanceof Error ? aiError.message : "";
      if (msg === "RATE_LIMIT") {
        return new Response(
          JSON.stringify({ error: "יותר מדי בקשות, נסו שוב בעוד מספר שניות" }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (msg === "PAYMENT_REQUIRED") {
        return new Response(
          JSON.stringify({ error: "נדרש חיוב נוסף עבור שירות AI" }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      throw aiError;
    }
  } catch (error) {
    console.error("Edge function error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
