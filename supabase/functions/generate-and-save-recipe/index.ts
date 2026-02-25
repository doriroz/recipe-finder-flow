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
  used_count?: number;
  missed_count?: number;
}

type DifficultyLevel = "low" | "medium" | "high";

// ============ MYMEMORY TRANSLATION (Hebrew→English only) ============

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

async function translateEachHeToEn(texts: string[]): Promise<string[]> {
  const results: string[] = [];
  for (const text of texts) {
    const translated = await translateText(text, "he|en");
    results.push(translated);
  }
  return results;
}

// ============ AI TRANSLATION WITH DB CACHE (English→Hebrew) ============

async function translateRecipeWithAI(
  apiKey: string,
  supabaseAdmin: any,
  title: string,
  ingredients: { name: string; unit: string }[],
  steps: string[]
): Promise<{
  title: string;
  ingredientNames: string[];
  units: string[];
  steps: string[];
}> {
  // Collect all unique texts to translate
  const allTexts: string[] = [
    title,
    ...ingredients.map(i => i.name),
    ...ingredients.map(i => i.unit).filter(u => u && u.trim() !== ""),
    ...steps,
  ];

  // Remove empty strings
  const textsToLookup = allTexts.filter(t => t && t.trim() !== "");
  const uniqueTexts = [...new Set(textsToLookup)];

  // Step 1: Check cache for all texts
  const translationMap = new Map<string, string>();

  if (uniqueTexts.length > 0) {
    const { data: cached } = await supabaseAdmin
      .from("translation_cache")
      .select("source_text, translated_text")
      .eq("lang_pair", "en|he")
      .in("source_text", uniqueTexts);

    if (cached) {
      for (const row of cached) {
        translationMap.set(row.source_text, row.translated_text);
      }
    }
  }

  // Step 2: Find cache misses
  const misses = uniqueTexts.filter(t => !translationMap.has(t));
  console.log(`Translation cache: ${uniqueTexts.length - misses.length} hits, ${misses.length} misses`);

  // Step 3: AI translate misses in one call
  if (misses.length > 0) {
    try {
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
              content: `You are a professional cooking/food translator. Translate from English to Hebrew.
Return ONLY a JSON object with a "translations" array containing the Hebrew translations in the same order as the input texts.
Do not add any explanation or extra text.`,
            },
            {
              role: "user",
              content: JSON.stringify({ texts: misses }),
            },
          ],
          temperature: 0.2,
          max_tokens: 2048,
        }),
      });

      if (!response.ok) {
        console.error(`AI translation error: ${response.status}`);
        if (response.status === 429) console.warn("AI translation rate limited");
        if (response.status === 402) console.warn("AI translation payment required");
        // Fall back to English for misses
      } else {
        const data = await response.json();
        const content = data.choices?.[0]?.message?.content?.trim();
        try {
          const jsonMatch = content?.match(/\{[\s\S]*\}/);
          const parsed = JSON.parse(jsonMatch ? jsonMatch[0] : content);
          const translations: string[] = parsed.translations || [];

          // Map translations and save to cache
          const cacheInserts: { source_text: string; translated_text: string; lang_pair: string }[] = [];
          for (let i = 0; i < misses.length && i < translations.length; i++) {
            if (translations[i] && translations[i].trim()) {
              translationMap.set(misses[i], translations[i]);
              cacheInserts.push({
                source_text: misses[i],
                translated_text: translations[i],
                lang_pair: "en|he",
              });
            }
          }

          // Save to DB cache (fire and forget, don't block)
          if (cacheInserts.length > 0) {
            supabaseAdmin
              .from("translation_cache")
              .upsert(cacheInserts, { onConflict: "source_text,lang_pair" })
              .then(({ error }: any) => {
                if (error) console.error("Cache save error:", error);
                else console.log(`Saved ${cacheInserts.length} translations to cache`);
              });
          }
        } catch (parseErr) {
          console.error("Failed to parse AI translation response:", parseErr, content);
        }
      }
    } catch (err) {
      console.error("AI translation call failed:", err);
    }
  }

  // Step 4: Build result using translation map (fallback to original English)
  const getTranslation = (text: string) => translationMap.get(text) || text;

  return {
    title: getTranslation(title),
    ingredientNames: ingredients.map(i => getTranslation(i.name)),
    units: ingredients.map(i => (i.unit && i.unit.trim()) ? getTranslation(i.unit) : ""),
    steps: steps.map(s => getTranslation(s)),
  };
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
    // Deduplicate: keep only 1 substitution per original ingredient
    const seenOriginals = new Set<string>();
    const deduped: typeof matched = [];
    for (const m of matched) {
      if (!seenOriginals.has(m.original)) {
        seenOriginals.add(m.original);
        deduped.push(m);
      }
    }
    return deduped.slice(0, 4);
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
  const pantryItems = new Set(['מלח', 'פלפל שחור', 'שמן', 'שמן זית', 'מים']);
  const significantRecipeIngs = recipeIngredients.filter(i => !pantryItems.has(i));
  if (significantRecipeIngs.length === 0) return 0;

  const userSet = new Set(userIngredients.map(i => i.trim()));
  let matched = 0;
  for (const ing of significantRecipeIngs) {
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

  let { data: userCredits } = await supabaseAdmin
    .from("user_credits")
    .select("*")
    .eq("user_id", userId)
    .single();

  if (!userCredits) {
    const { data: newCredits } = await supabaseAdmin
      .from("user_credits")
      .insert({ user_id: userId, credits_remaining: 10 })
      .select()
      .single();
    userCredits = newCredits;
  }

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

// ============ IMPERIAL → METRIC CONVERSION ============

const UNIT_DIRECT_HEBREW: Record<string, string> = {
  "tablespoon": "כף",
  "tablespoons": "כפות",
  "Tablespoon": "כף",
  "Tablespoons": "כפות",
  "Tbsp": "כף",
  "Tbsps": "כפות",
  "tbsp": "כף",
  "tbsps": "כפות",
  "teaspoon": "כפית",
  "teaspoons": "כפיות",
  "Teaspoon": "כפית",
  "Teaspoons": "כפיות",
  "tsp": "כפית",
  "tsps": "כפיות",
  "cup": "כוס",
  "cups": "כוסות",
  "clove": "שן",
  "cloves": "שיניים",
  "pinch": "קמצוץ",
  "pinches": "קמצוצים",
  "slice": "פרוסה",
  "slices": "פרוסות",
  "piece": "חתיכה",
  "pieces": "חתיכות",
  "bunch": "צרור",
  "bunches": "צרורות",
  "handful": "חופן",
  "large": "גדול",
  "medium": "בינוני",
  "small": "קטן",
};

interface MetricResult {
  amount: number;
  unit: string;
  skipTranslation: boolean; // true if unit is already in Hebrew
}

function convertToMetric(amount: number, unit: string): MetricResult {
  const u = unit.toLowerCase().trim();

  // Direct Hebrew mapping (no conversion needed, just translate unit)
  if (UNIT_DIRECT_HEBREW[unit]) {
    return { amount, unit: UNIT_DIRECT_HEBREW[unit], skipTranslation: true };
  }

  // Imperial weight → grams
  if (u === "pound" || u === "pounds" || u === "lb" || u === "lbs") {
    const grams = amount * 454;
    return { amount: Math.round(grams / 10) * 10, unit: "גרם", skipTranslation: true };
  }
  if (u === "ounce" || u === "ounces" || u === "oz") {
    const grams = amount * 28;
    return { amount: Math.round(grams / 5) * 5, unit: "גרם", skipTranslation: true };
  }

  // Imperial volume → ml
  if (u === "fluid ounce" || u === "fluid ounces" || u === "fl oz" || u === "fl. oz.") {
    const ml = amount * 30;
    return { amount: Math.round(ml), unit: 'מ"ל', skipTranslation: true };
  }
  if (u === "quart" || u === "quarts" || u === "qt") {
    const ml = amount * 946;
    return { amount: Math.round(ml / 10) * 10, unit: 'מ"ל', skipTranslation: true };
  }
  if (u === "pint" || u === "pints" || u === "pt") {
    const ml = amount * 473;
    return { amount: Math.round(ml / 10) * 10, unit: 'מ"ל', skipTranslation: true };
  }
  if (u === "gallon" || u === "gallons") {
    const ml = amount * 3785;
    const liters = ml / 1000;
    return { amount: Math.round(liters * 10) / 10, unit: "ליטר", skipTranslation: true };
  }

  // Fahrenheit → Celsius
  if (u === "°f" || u === "fahrenheit" || u === "f") {
    const celsius = Math.round((amount - 32) * 5 / 9 / 5) * 5;
    return { amount: celsius, unit: "°C", skipTranslation: true };
  }

  // Already metric or unknown — pass through for AI translation
  if (u === "g" || u === "gram" || u === "grams") {
    return { amount, unit: "גרם", skipTranslation: true };
  }
  if (u === "kg" || u === "kilogram" || u === "kilograms") {
    return { amount, unit: 'ק"ג', skipTranslation: true };
  }
  if (u === "ml" || u === "milliliter" || u === "milliliters") {
    return { amount, unit: 'מ"ל', skipTranslation: true };
  }
  if (u === "l" || u === "liter" || u === "liters" || u === "litre" || u === "litres") {
    return { amount, unit: "ליטר", skipTranslation: true };
  }

  // No conversion — let AI translate the unit
  return { amount, unit, skipTranslation: false };
}

// ============ SPOONACULAR RECIPE FETCHING ============

async function fetchRecipeFromSpoonacular(
  hebrewIngredients: string[],
  apiKey: string,
  supabaseAdmin: any
): Promise<RecipeResponse | null> {
  const SPOONACULAR_API_KEY = Deno.env.get("SPOONACULAR_API_KEY");
  if (!SPOONACULAR_API_KEY) {
    console.error("SPOONACULAR_API_KEY not configured");
    return null;
  }

  try {
    // Translate ingredients to English (Hebrew→English via MyMemory)
    const rawTranslated = await translateEachHeToEn(hebrewIngredients);
    // Normalize: trim, remove trailing punctuation, collapse spaces
    const englishIngredients = rawTranslated.map(t =>
      t.trim().replace(/[.,;:!?]+$/, '').replace(/\s{2,}/g, ' ').trim()
    );
    console.log("Translated & normalized ingredients for Spoonacular:", englishIngredients);

    const userCount = hebrewIngredients.length;

    // Find recipes by ingredients — ignorePantry=true, fetch 8 candidates
    const findUrl = `https://api.spoonacular.com/recipes/findByIngredients?ingredients=${encodeURIComponent(englishIngredients.join(","))}&number=8&ranking=1&ignorePantry=true&apiKey=${SPOONACULAR_API_KEY}`;
    const findRes = await fetch(findUrl);
    if (!findRes.ok) {
      console.error("Spoonacular findByIngredients error:", findRes.status);
      return null;
    }
    const findData = await findRes.json();
    if (!findData || findData.length === 0) return null;

    // Composite scoring: coverage * 0.7 + precision * 0.3
    const scored = findData.map((c: any) => {
      const used = c.usedIngredientCount || 0;
      const missed = c.missedIngredientCount || 0;
      const coverage = userCount > 0 ? used / userCount : 0;
      const precision = (used + missed) > 0 ? used / (used + missed) : 0;
      const score = coverage * 0.7 + precision * 0.3;
      return { ...c, used, missed, coverage, precision, score };
    });

    // Sort: score desc, used desc, missed asc
    scored.sort((a: any, b: any) =>
      b.score - a.score || b.used - a.used || a.missed - b.missed
    );

    // Log all candidates for diagnostics
    console.log("=== Spoonacular candidates (scored) ===");
    scored.forEach((c: any, i: number) =>
      console.log(`  #${i + 1} "${c.title}" score=${c.score.toFixed(3)} coverage=${c.coverage.toFixed(2)} precision=${c.precision.toFixed(2)} used=${c.used} missed=${c.missed}`)
    );

    // Hard rejection thresholds
    const minCoverage = 0.6;
    const minPrecision = 0.35;
    const maxMissed = userCount + 3;

    // Find first candidate passing all guards
    let best: any = null;
    for (const c of scored) {
      if (c.coverage < minCoverage) {
        console.log(`  REJECTED "${c.title}": coverage ${c.coverage.toFixed(2)} < ${minCoverage}`);
        continue;
      }
      if (c.precision < minPrecision) {
        console.log(`  REJECTED "${c.title}": precision ${c.precision.toFixed(2)} < ${minPrecision}`);
        continue;
      }
      if (c.missed > maxMissed) {
        console.log(`  REJECTED "${c.title}": missed ${c.missed} > max ${maxMissed}`);
        continue;
      }
      best = c;
      break;
    }

    if (!best) {
      console.log("No candidate passed quality guards (coverage/precision/missed). Rejecting all.");
      return null;
    }

    console.log(`SELECTED "${best.title}" score=${best.score.toFixed(3)} coverage=${best.coverage.toFixed(2)} precision=${best.precision.toFixed(2)} used=${best.used} missed=${best.missed}`);

    const recipeId = best.id;

    // Get full recipe info
    const infoUrl = `https://api.spoonacular.com/recipes/${recipeId}/information?apiKey=${SPOONACULAR_API_KEY}`;
    const infoRes = await fetch(infoUrl);
    if (!infoRes.ok) return null;
    const info = await infoRes.json();

    // Extract data
    const title = info.title || "Recipe";
    const cookingTime = info.readyInMinutes || 30;
    const rawIngredients: { name: string; amount: number; unit: string }[] = (info.extendedIngredients || []).map((ing: any) => ({
      name: ing.name || ing.original || "",
      amount: ing.amount || 0,
      unit: ing.unit || "",
    }));

    // Convert imperial → metric before translation
    const extIngredients = rawIngredients.map(ing => {
      const converted = convertToMetric(ing.amount, ing.unit);
      return {
        name: ing.name,
        amount: converted.amount,
        unit: converted.unit,
        skipUnitTranslation: converted.skipTranslation,
      };
    });

    const steps: string[] = (info.analyzedInstructions?.[0]?.steps || []).map((s: any) => s.step || "");

    if (steps.length === 0 && info.instructions) {
      const cleanInstructions = info.instructions.replace(/<[^>]*>/g, "").trim();
      if (cleanInstructions) steps.push(cleanInstructions);
    }

    if (steps.length === 0) return null;

    // Only send units that need AI translation (non-Hebrew ones)
    const unitsForTranslation = extIngredients.map(i =>
      i.skipUnitTranslation ? "" : i.unit
    );

    // AI translate with DB cache: title + ingredient names + non-Hebrew units + steps
    const translated = await translateRecipeWithAI(
      apiKey,
      supabaseAdmin,
      title,
      extIngredients.map((i, idx) => ({ name: i.name, unit: unitsForTranslation[idx] })),
      steps
    );

    const ingredients = extIngredients.map((ing, idx) => ({
      name: translated.ingredientNames[idx] || ing.name,
      amount: ing.amount ? String(ing.amount) : undefined,
      // Use already-Hebrew unit if skipTranslation, otherwise use AI-translated unit
      unit: ing.skipUnitTranslation ? ing.unit : (translated.units[idx] || undefined),
    }));

    // Estimate difficulty
    const stepCount = translated.steps.length;
    const ingCount = ingredients.length;
    let difficulty = "medium";
    if (stepCount <= 4 && ingCount <= 6) difficulty = "low";
    else if (stepCount >= 8 || ingCount >= 12) difficulty = "high";

    return {
      title: translated.title,
      ingredients,
      instructions: translated.steps,
      substitutions: [],
      cooking_time: cookingTime,
      difficulty,
      why_it_works: `מתכון מאומת מ-Spoonacular עם ${ingCount} מצרכים ו-${stepCount} שלבי הכנה`,
      reliability_score: "high",
      used_count: best.used,
      missed_count: best.missed,
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

    // User-scoped client
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );

    // Service role client for credits/logging/translation cache (bypasses RLS)
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

    // ---- STEP 3: Spoonacular recipe (AI translation, 0 user credits) ----
    if (!LOVABLE_API_KEY) {
      console.error("LOVABLE_API_KEY not configured for translation");
      return new Response(
        JSON.stringify({ error: "שגיאת תצורה פנימית" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const spoonacularRecipe = await fetchRecipeFromSpoonacular(ingredientNames, LOVABLE_API_KEY, supabaseAdmin);

    if (!spoonacularRecipe) {
      return new Response(
        JSON.stringify({ error: "לא מצאנו מתכון מתאים למצרכים שבחרתם. נסו לשנות או להוסיף מצרכים" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Log translation usage (0 credits to user)
    await logAiUsage(supabaseAdmin, userId, "translation", 400, 0, "ai");

    // Look up substitutions from DB
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
        used_count: spoonacularRecipe.used_count,
        missed_count: spoonacularRecipe.missed_count,
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
