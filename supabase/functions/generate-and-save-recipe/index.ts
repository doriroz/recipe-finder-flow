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
  used_ingredient_names?: string[];
}

interface ScoredCandidate {
  id: number;
  title: string;
  usedIngredientCount: number;
  missedIngredientCount: number;
  usedIngredients: any[];
  missedIngredients: any[];
  finalScore: number;
  coverage: number;
  precision: number;
  badge: string;
  contextLine: string;
}

interface RecipeResultItem {
  recipe: any;
  badge: string;
  contextLine: string;
  why_it_works: string;
  reliability_score: "high" | "medium" | "creative";
  spoonacular_verified: boolean;
  source: "local" | "ai" | "spoonacular";
  used_count: number;
  missed_count: number;
  used_ingredient_names: string[];
  showAIButton?: boolean;
}

type DifficultyLevel = "low" | "medium" | "high";

// ============ CHEF LOGIC: STAPLE & ANCHOR LISTS ============

const STAPLE_INGREDIENTS_HE = new Set([
  "מלח", "פלפל שחור", "שמן זית", "שמן קנולה", "סוכר", "מים", "חומץ", "רוטב סויה",
  "שמן", "פלפל",
]);

const CORE_ANCHOR_INGREDIENTS_HE = new Set([
  "עוף", "בשר טחון", "סלמון", "טונה", "חזה עוף", "בשר בקר", "ביצה", "טופו",
  "פסטה", "אורז", "קוסקוס", "שריות עוף", "דג סול", "נקניקיות",
  "חציל", "כרוב", "תפוח אדמה", "בטטה", "כרובית", "דלעת",
]);

const CORE_ANCHOR_INGREDIENTS_EN = new Set([
  "chicken", "beef", "ground beef", "salmon", "tuna", "chicken breast", "egg", "tofu",
  "pasta", "rice", "couscous", "turkey", "lamb", "pork", "sausage", "steak", "fish",
  "eggplant", "cabbage", "potato", "sweet potato", "cauliflower", "squash", "pumpkin",
]);

const STAPLE_INGREDIENTS_EN = new Set([
  "salt", "black pepper", "pepper", "olive oil", "canola oil", "sugar", "water",
  "vinegar", "soy sauce", "oil", "vegetable oil",
]);

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
  const allTexts: string[] = [
    title,
    ...ingredients.map(i => i.name),
    ...ingredients.map(i => i.unit).filter(u => u && u.trim() !== ""),
    ...steps,
  ];

  const textsToLookup = allTexts.filter(t => t && t.trim() !== "");
  const uniqueTexts = [...new Set(textsToLookup)];

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

  const misses = uniqueTexts.filter(t => !translationMap.has(t));
  console.log(`Translation cache: ${uniqueTexts.length - misses.length} hits, ${misses.length} misses`);

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
      } else {
        const data = await response.json();
        const content = data.choices?.[0]?.message?.content?.trim();
        try {
          const jsonMatch = content?.match(/\{[\s\S]*\}/);
          const parsed = JSON.parse(jsonMatch ? jsonMatch[0] : content);
          const translations: string[] = parsed.translations || [];

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

// ============ CHEF LOGIC: RULES & SCORING ============

interface LibraryRecipe {
  id: string;
  title: string;
  ingredients: any;
  ingredient_names: string[];
  instructions: string[];
  substitutions: any;
  cooking_time: number | null;
  difficulty: string;
  complexity?: string;
}

interface ChefScoredRecipe {
  recipe: LibraryRecipe;
  finalScore: number;
  usedCount: number;
  missedCount: number;
  usedIngredientNames: string[];
  badge: string;
  contextLine: string;
}

function isStapleHe(name: string): boolean {
  const lower = name.trim();
  for (const s of STAPLE_INGREDIENTS_HE) {
    if (lower === s || lower.includes(s) || s.includes(lower)) return true;
  }
  return false;
}

function isCoreAnchorHe(name: string): boolean {
  const lower = name.trim();
  for (const a of CORE_ANCHOR_INGREDIENTS_HE) {
    if (lower === a || lower.includes(a) || a.includes(lower)) return true;
  }
  return false;
}

function applyChefLogicLocal(
  userIngredients: string[],
  library: LibraryRecipe[]
): ChefScoredRecipe[] {
  const userSet = new Set(userIngredients.map(i => i.trim()));
  const userCount = userIngredients.length;
  const maxBurden = userCount <= 2 ? 2 : 3;

  const proteinKwHe = ["עוף", "בשר", "סלמון", "טונה", "דג", "ביצה", "טופו", "נקניק"];

  const results: ChefScoredRecipe[] = [];

  for (const recipe of library) {
    const recipeIngs = recipe.ingredient_names || [];
    if (recipeIngs.length === 0) continue;

    // Separate recipe ingredients into staple and non-staple
    const nonStapleRecipeIngs = recipeIngs.filter(i => !isStapleHe(i));
    const anchorRecipeIngs = recipeIngs.filter(i => isCoreAnchorHe(i));

    // Match user ingredients against recipe ingredients
    const usedNames: string[] = [];
    const missedNonStaple: string[] = [];
    const missedAnchors: string[] = [];

    for (const recipeIng of recipeIngs) {
      let found = false;
      for (const userIng of userSet) {
        if (userIng === recipeIng || userIng.includes(recipeIng) || recipeIng.includes(userIng)) {
          found = true;
          usedNames.push(recipeIng);
          break;
        }
      }
      if (!found) {
        if (!isStapleHe(recipeIng)) {
          missedNonStaple.push(recipeIng);
        }
        if (isCoreAnchorHe(recipeIng)) {
          missedAnchors.push(recipeIng);
        }
      }
    }

    // RULE 0: Minimum Match Rule — reject if zero ingredient overlap
    const usedCountCheck = usedNames.length;
    if (usedCountCheck === 0) {
      console.log(`  Chef Logic REJECT (zero-match) "${recipe.title}": no ingredient overlap`);
      continue;
    }

    // RULE 1: Core Anchor Rule — reject if recipe needs a core anchor user didn't select
    if (missedAnchors.length > 0) {
      console.log(`  Chef Logic REJECT (anchor) "${recipe.title}": missing anchors [${missedAnchors.join(", ")}]`);
      continue;
    }

    // RULE 1b: Bidirectional Anchor Rule — reject if user selected a core anchor the recipe doesn't contain
    for (const userIng of userSet) {
      if (isCoreAnchorHe(userIng)) {
        const recipeHasIt = recipeIngs.some(ri => ri.includes(userIng) || userIng.includes(ri));
        if (!recipeHasIt) {
          console.log(`  Chef Logic REJECT (reverse-anchor) "${recipe.title}": user selected anchor "${userIng}" but recipe lacks it`);
          missedAnchors.push(userIng); // reuse to trigger skip
        }
      }
    }
    if (missedAnchors.length > 0) continue;

    // RULE 2: Burden Rule — count missing non-staple ingredients
    if (missedNonStaple.length > maxBurden) {
      console.log(`  Chef Logic REJECT (burden) "${recipe.title}": ${missedNonStaple.length} missing non-staples > max ${maxBurden}`);
      continue;
    }

    // RULE 3: Complexity Rule — Special recipes need >= 80% non-staple coverage
    if (recipe.complexity === "Special") {
      const nonStapleCoverage = nonStapleRecipeIngs.length > 0
        ? (nonStapleRecipeIngs.length - missedNonStaple.length) / nonStapleRecipeIngs.length
        : 0;
      if (nonStapleCoverage < 0.8) {
        console.log(`  Chef Logic REJECT (complexity) "${recipe.title}": Special recipe, non-staple coverage ${(nonStapleCoverage * 100).toFixed(0)}% < 80%`);
        continue;
      }
    }

    // SCORING
    const usedCount = usedNames.length;
    const totalIngredients = recipeIngs.length;
    const coverage = userCount > 0 ? usedCount / userCount : 0;
    const precision = totalIngredients > 0 ? usedCount / totalIngredients : 0;

    const extraCount = totalIngredients - usedCount;
    const burdenRatio = userCount > 0 ? extraCount / userCount : 0;
    const maxBurdenRatio = userCount <= 3 ? 0.75 : userCount <= 5 ? 1.0 : 1.5;
    const burdenPenalty = Math.min(burdenRatio / maxBurdenRatio, 1);

    const hasProtein = usedNames.some(n => proteinKwHe.some(p => n.includes(p)));
    let structuralBonus = 0;
    if (hasProtein) structuralBonus += 0.05;
    if (missedNonStaple.length <= 3) structuralBonus += 0.05;

    const finalScore =
      0.55 * coverage +
      0.20 * precision +
      0.15 * (1 - burdenPenalty) +
      0.10 * structuralBonus;

    const badge = finalScore >= 0.85 ? "המלצת השף" :
                  finalScore >= 0.70 ? "התאמה מצוינת" :
                  "המלצת השף"; // Step 1 local matches always get chef recommendation

    let contextLine = "";
    if (usedCount >= 5) contextLine = `משתמש ב-${usedCount} מהמצרכים שבחרת`;
    else if (missedNonStaple.length <= 2) contextLine = `דורש רק ${missedNonStaple.length} תוספות קטנות`;
    else contextLine = `מבוסס על ${usedCount} מהמצרכים שלך`;

    results.push({
      recipe,
      finalScore,
      usedCount,
      missedCount: missedNonStaple.length,
      usedIngredientNames: usedNames,
      badge,
      contextLine,
    });
  }

  // Sort by score descending
  results.sort((a, b) => b.finalScore - a.finalScore);
  return results;
}

// ============ STEP 3: LOCAL FALLBACK INSPIRATION ============

function findFallbackInspiration(
  userIngredients: string[],
  library: LibraryRecipe[]
): ChefScoredRecipe | null {
  // Collect ALL user anchors
  const userAnchors = userIngredients.filter(i => isCoreAnchorHe(i));
  if (userAnchors.length === 0) return null;

  const userSet = new Set(userIngredients.map(i => i.trim()));

  for (const recipe of library) {
    if (recipe.complexity === "Special") continue;
    const recipeIngs = recipe.ingredient_names || [];

    // NEW: Check ALL user anchors are present in recipe (bidirectional anchor rule)
    let allAnchorsPresent = true;
    for (const anchor of userAnchors) {
      const recipeHasIt = recipeIngs.some(ri => ri.includes(anchor) || anchor.includes(ri));
      if (!recipeHasIt) {
        allAnchorsPresent = false;
        break;
      }
    }
    if (!allAnchorsPresent) continue;

    // Compute used ingredients
    const usedNames = recipeIngs.filter(ri => {
      for (const ui of userSet) {
        if (ui === ri || ui.includes(ri) || ri.includes(ui)) return true;
      }
      return false;
    });

    // NEW: Zero-match guard — skip if no overlap at all
    if (usedNames.length === 0) continue;

    const bestAnchor = userAnchors[0];
    return {
      recipe,
      finalScore: 0.3,
      usedCount: usedNames.length,
      missedCount: recipeIngs.length - usedNames.length,
      usedIngredientNames: usedNames,
      badge: "השראה למצרך שלך",
      contextLine: `לא מצאנו התאמה מושלמת, אבל הנה מתכון יומיומי קלאסי ל${bestAnchor}`,
    };
  }

  return null; // no valid fallback -> triggers Step 4
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
  "tablespoon": "כף", "tablespoons": "כפות", "Tablespoon": "כף", "Tablespoons": "כפות",
  "Tbsp": "כף", "Tbsps": "כפות", "tbsp": "כף", "tbsps": "כפות",
  "teaspoon": "כפית", "teaspoons": "כפיות", "Teaspoon": "כפית", "Teaspoons": "כפיות",
  "tsp": "כפית", "tsps": "כפיות",
  "cup": "כוס", "cups": "כוסות",
  "clove": "שן", "cloves": "שיניים",
  "pinch": "קמצוץ", "pinches": "קמצוצים",
  "slice": "פרוסה", "slices": "פרוסות",
  "piece": "חתיכה", "pieces": "חתיכות",
  "bunch": "צרור", "bunches": "צרורות",
  "handful": "חופן",
  "large": "גדול", "medium": "בינוני", "small": "קטן",
};

interface MetricResult {
  amount: number;
  unit: string;
  skipTranslation: boolean;
}

function convertToMetric(amount: number, unit: string): MetricResult {
  const u = unit.toLowerCase().trim();

  if (UNIT_DIRECT_HEBREW[unit]) {
    return { amount, unit: UNIT_DIRECT_HEBREW[unit], skipTranslation: true };
  }

  if (u === "pound" || u === "pounds" || u === "lb" || u === "lbs") {
    return { amount: Math.round(amount * 454 / 10) * 10, unit: "גרם", skipTranslation: true };
  }
  if (u === "ounce" || u === "ounces" || u === "oz") {
    return { amount: Math.round(amount * 28 / 5) * 5, unit: "גרם", skipTranslation: true };
  }
  if (u === "fluid ounce" || u === "fluid ounces" || u === "fl oz" || u === "fl. oz.") {
    return { amount: Math.round(amount * 30), unit: 'מ"ל', skipTranslation: true };
  }
  if (u === "quart" || u === "quarts" || u === "qt") {
    return { amount: Math.round(amount * 946 / 10) * 10, unit: 'מ"ל', skipTranslation: true };
  }
  if (u === "pint" || u === "pints" || u === "pt") {
    return { amount: Math.round(amount * 473 / 10) * 10, unit: 'מ"ל', skipTranslation: true };
  }
  if (u === "gallon" || u === "gallons") {
    return { amount: Math.round(amount * 3.785 * 10) / 10, unit: "ליטר", skipTranslation: true };
  }
  if (u === "°f" || u === "fahrenheit" || u === "f") {
    return { amount: Math.round((amount - 32) * 5 / 9 / 5) * 5, unit: "°C", skipTranslation: true };
  }
  if (u === "g" || u === "gram" || u === "grams") return { amount, unit: "גרם", skipTranslation: true };
  if (u === "kg" || u === "kilogram" || u === "kilograms") return { amount, unit: 'ק"ג', skipTranslation: true };
  if (u === "ml" || u === "milliliter" || u === "milliliters") return { amount, unit: 'מ"ל', skipTranslation: true };
  if (u === "l" || u === "liter" || u === "liters" || u === "litre" || u === "litres") return { amount, unit: "ליטר", skipTranslation: true };

  return { amount, unit, skipTranslation: false };
}

// ============ CREATIVE FALLBACK ENGINE ============

async function generateCreativeFallback(
  englishIngredients: string[],
  hebrewIngredients: string[],
  apiKey: string
): Promise<RecipeResponse | null> {
  console.log("Generating creative fallback recipe for:", englishIngredients);

  const proteinKw = ["chicken","beef","pork","fish","salmon","tuna","shrimp","egg","tofu","lamb","turkey","sausage","meat","steak"];
  const carbKw = ["rice","pasta","bread","potato","noodle","flour","couscous","quinoa","oat"];
  const vegKw = ["tomato","onion","garlic","pepper","carrot","lettuce","cucumber","zucchini","spinach","broccoli","mushroom","corn","pea","bean","eggplant","squash","cabbage","celery"];

  const categories = { protein: [] as string[], carb: [] as string[], veg: [] as string[], other: [] as string[] };
  for (const ing of englishIngredients) {
    const lower = ing.toLowerCase();
    if (proteinKw.some(p => lower.includes(p))) categories.protein.push(ing);
    else if (carbKw.some(p => lower.includes(p))) categories.carb.push(ing);
    else if (vegKw.some(p => lower.includes(p))) categories.veg.push(ing);
    else categories.other.push(ing);
  }

  let style = "stir-fry";
  if (categories.protein.length > 0 && categories.carb.length > 0) style = "skillet bowl";
  else if (categories.protein.length > 0) style = "pan-seared dish";
  else if (categories.veg.length >= 3) style = "vegetable medley";
  else if (categories.carb.length > 0) style = "one-pot dish";

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
            content: `You are a creative chef. Generate a simple, coherent recipe in Hebrew using ONLY the provided ingredients (plus basic pantry items like salt, pepper, oil).
Return ONLY a JSON object with this exact structure:
{
  "title": "שם המתכון",
  "ingredients": [{"name": "שם", "amount": "כמות", "unit": "יחידה"}],
  "instructions": ["שלב 1", "שלב 2", ...],
  "cooking_time": 30,
  "difficulty": "medium"
}
No extra text.`,
          },
          {
            role: "user",
            content: `Create a ${style} recipe using these ingredients: ${englishIngredients.join(", ")}. Hebrew ingredient names: ${hebrewIngredients.join(", ")}. Keep it simple, 4-6 steps max.`,
          },
        ],
        temperature: 0.7,
        max_tokens: 1024,
      }),
    });

    if (!response.ok) {
      console.error(`Creative fallback AI error: ${response.status}`);
      return null;
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content?.trim();
    const jsonMatch = content?.match(/\{[\s\S]*\}/);
    const parsed = JSON.parse(jsonMatch ? jsonMatch[0] : content);

    return {
      title: parsed.title || `מתכון יצירתי עם ${hebrewIngredients[0]}`,
      ingredients: (parsed.ingredients || []).map((i: any) => ({
        name: i.name || "",
        amount: i.amount ? String(i.amount) : undefined,
        unit: i.unit || undefined,
      })),
      instructions: parsed.instructions || ["הכינו את המצרכים", "בשלו והגישו"],
      substitutions: [],
      cooking_time: parsed.cooking_time || 30,
      difficulty: parsed.difficulty || "medium",
      why_it_works: "מתכון יצירתי שנוצר במיוחד עבור המצרכים שבחרתם",
      reliability_score: "creative",
      used_count: hebrewIngredients.length,
      missed_count: 0,
      used_ingredient_names: hebrewIngredients,
    };
  } catch (err) {
    console.error("Creative fallback generation error:", err);
    return null;
  }
}

// ============ SPOONACULAR SCORING WITH CHEF LOGIC ============

function scoreCandidatesWithChefLogic(findData: any[], userCount: number, userIngredientsEn: string[]): ScoredCandidate[] {
  const userSet = new Set(userIngredientsEn.map(i => i.toLowerCase().trim()));
  const maxBurden = userCount <= 2 ? 2 : 3;

  const scored: ScoredCandidate[] = [];

  for (const c of findData) {
    const used = c.usedIngredientCount || 0;
    const missed = c.missedIngredientCount || 0;
    const missedIngredients = c.missedIngredients || [];

    // RULE 0: Minimum Match Rule — reject if zero ingredient overlap
    if (used === 0) {
      console.log(`  Chef Logic REJECT (zero-match) "${c.title}": no ingredient overlap`);
      continue;
    }

    // RULE 1: Core Anchor Rule — reject if missing a core anchor
    const missedAnchors = missedIngredients.filter((i: any) =>
      CORE_ANCHOR_INGREDIENTS_EN.has((i.name || "").toLowerCase().trim())
    );
    if (missedAnchors.length > 0) {
      console.log(`  Chef Logic REJECT (anchor) "${c.title}": missing anchors [${missedAnchors.map((a: any) => a.name).join(", ")}]`);
      continue;
    }

    // RULE 1b: Bidirectional Anchor Rule — reject if user selected a core anchor the recipe doesn't contain
    let userAnchorMissing = false;
    for (const userIng of userSet) {
      if (CORE_ANCHOR_INGREDIENTS_EN.has(userIng)) {
        const recipeHasIt = (c.usedIngredients || []).some((i: any) =>
          (i.name || "").toLowerCase().trim().includes(userIng) || userIng.includes((i.name || "").toLowerCase().trim())
        );
        if (!recipeHasIt) {
          console.log(`  Chef Logic REJECT (reverse-anchor) "${c.title}": user selected anchor "${userIng}" but recipe lacks it`);
          userAnchorMissing = true;
          break;
        }
      }
    }
    if (userAnchorMissing) continue;

    // RULE 2: Burden Rule — count missing non-staple ingredients
    const missedNonStaple = missedIngredients.filter((i: any) =>
      !STAPLE_INGREDIENTS_EN.has((i.name || "").toLowerCase().trim())
    );
    if (missedNonStaple.length > maxBurden) {
      console.log(`  Chef Logic REJECT (burden) "${c.title}": ${missedNonStaple.length} missing non-staples > max ${maxBurden}`);
      continue;
    }

    // SCORING
    const totalIngredients = used + missed;
    const coverage = userCount > 0 ? used / userCount : 0;
    const precision = totalIngredients > 0 ? used / totalIngredients : 0;

    const extraCount = totalIngredients - used;
    const burdenRatio = userCount > 0 ? extraCount / userCount : 0;
    const maxBurdenRatio = userCount <= 3 ? 0.75 : userCount <= 5 ? 1.0 : 1.5;
    const burdenPenalty = Math.min(burdenRatio / maxBurdenRatio, 1);

    const proteinKeywords = ["chicken","beef","pork","fish","salmon","tuna","shrimp","egg","tofu","lamb","turkey","sausage","meat","steak"];
    const hasProtein = (c.usedIngredients || []).some((i: any) =>
      proteinKeywords.some(p => (i.name || "").toLowerCase().includes(p)));
    let structuralBonus = 0;
    if (hasProtein) structuralBonus += 0.05;
    if (missed <= 3) structuralBonus += 0.05;

    const finalScore =
      0.55 * coverage +
      0.20 * precision +
      0.15 * (1 - burdenPenalty) +
      0.10 * structuralBonus;

    const badge = finalScore >= 0.85 ? "המלצת השף" :
                  finalScore >= 0.70 ? "התאמה מצוינת" :
                  "המלצת השף"; // Step 2 results get chef recommendation

    let contextLine = "";
    if (used >= 5) contextLine = `משתמש ב-${used} מהמצרכים שבחרת`;
    else if (missedNonStaple.length <= 2) contextLine = `דורש רק ${missedNonStaple.length} תוספות קטנות`;
    else contextLine = `מבוסס על ${used} מהמצרכים שלך`;

    scored.push({
      ...c,
      usedIngredientCount: used,
      missedIngredientCount: missed,
      finalScore,
      coverage,
      precision,
      badge,
      contextLine,
    });
  }

  scored.sort((a, b) => b.finalScore - a.finalScore);
  return scored;
}

// ============ SPOONACULAR RECIPE FETCHING ============

async function processOneCandidate(
  candidate: ScoredCandidate,
  hebrewIngredients: string[],
  englishIngredients: string[],
  apiKey: string,
  supabaseAdmin: any,
  SPOONACULAR_API_KEY: string
): Promise<{
  recipeData: RecipeResponse;
  badge: string;
  contextLine: string;
} | null> {
  try {
    const infoUrl = `https://api.spoonacular.com/recipes/${candidate.id}/information?apiKey=${SPOONACULAR_API_KEY}`;
    const infoRes = await fetch(infoUrl);
    if (!infoRes.ok) return null;
    const info = await infoRes.json();

    const title = info.title || "Recipe";
    const cookingTime = info.readyInMinutes || 30;
    const rawIngredients: { name: string; amount: number; unit: string }[] = (info.extendedIngredients || []).map((ing: any) => ({
      name: ing.name || ing.original || "",
      amount: ing.amount || 0,
      unit: ing.unit || "",
    }));

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

    const unitsForTranslation = extIngredients.map(i => i.skipUnitTranslation ? "" : i.unit);

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
      unit: ing.skipUnitTranslation ? ing.unit : (translated.units[idx] || undefined),
    }));

    const stepCount = translated.steps.length;
    const ingCount = ingredients.length;
    let difficulty = "medium";
    if (stepCount <= 4 && ingCount <= 6) difficulty = "low";
    else if (stepCount >= 8 || ingCount >= 12) difficulty = "high";

    const enToHeLookup = new Map<string, string>();
    for (let i = 0; i < englishIngredients.length; i++) {
      enToHeLookup.set(englishIngredients[i].toLowerCase().trim(), hebrewIngredients[i]);
    }
    const usedIngNames: string[] = [];
    for (const ui of (candidate.usedIngredients || [])) {
      const enName = (ui.name || "").toLowerCase().trim();
      const heMatch = enToHeLookup.get(enName);
      if (heMatch) {
        usedIngNames.push(heMatch);
      } else {
        for (const [en, he] of enToHeLookup.entries()) {
          if (enName.includes(en) || en.includes(enName)) {
            usedIngNames.push(he);
            break;
          }
        }
      }
    }

    return {
      recipeData: {
        title: translated.title,
        ingredients,
        instructions: translated.steps,
        substitutions: [],
        cooking_time: cookingTime,
        difficulty,
        why_it_works: `מתכון מאומת מ-Spoonacular עם ${ingCount} מצרכים ו-${stepCount} שלבי הכנה`,
        reliability_score: candidate.coverage >= 0.5 ? "high" : "medium",
        used_count: candidate.usedIngredientCount,
        missed_count: candidate.missedIngredientCount,
        used_ingredient_names: usedIngNames,
      },
      badge: candidate.badge,
      contextLine: candidate.contextLine,
    };
  } catch (err) {
    console.error(`Error processing candidate ${candidate.id}:`, err);
    return null;
  }
}

async function saveSpoonacularToLibrary(
  supabaseAdmin: any,
  recipeData: RecipeResponse
) {
  try {
    const ingredientNames = recipeData.ingredients.map(i => i.name);
    const complexity = ingredientNames.length >= 8 || recipeData.difficulty === "high" ? "Special" : "Everyday";

    await supabaseAdmin.from("recipe_library").insert({
      title: recipeData.title,
      ingredients: recipeData.ingredients,
      ingredient_names: ingredientNames,
      instructions: recipeData.instructions,
      substitutions: recipeData.substitutions || [],
      cooking_time: recipeData.cooking_time || null,
      difficulty: recipeData.difficulty || "medium",
      complexity,
      category: "spoonacular",
    });
    console.log(`Saved "${recipeData.title}" to recipe_library for future local matches`);
  } catch (err) {
    console.error("Failed to save to recipe_library:", err);
  }
}

// ============ MAIN HANDLER: 4-STEP WATERFALL ============

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

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );

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

    const { ingredients, imageBase64, difficulty = "medium", forceCreative = false } = await req.json();

    if (!ingredients && !imageBase64) {
      return new Response(
        JSON.stringify({ error: "Either ingredients or imageBase64 is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // ---- Handle image → extract ingredients ----
    let ingredientNames: string[] = [];

    if (imageBase64) {
      const creditCheck = await checkAndDeductCredits(supabaseAdmin, userId, 3, "image_analysis");
      if (!creditCheck.allowed) {
        return new Response(JSON.stringify({ error: creditCheck.reason }), {
          status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is required for image analysis");
      ingredientNames = await extractIngredientsFromImage(imageBase64, LOVABLE_API_KEY);

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

    // ---- STEP 4 (forceCreative): AI On-Demand ----
    if (forceCreative) {
      console.log("=== STEP 4: forceCreative AI generation ===");
      const creditCheck = await checkAndDeductCredits(supabaseAdmin, userId, 2, "creative_recipe");
      if (!creditCheck.allowed) {
        return new Response(JSON.stringify({ error: creditCheck.reason }), {
          status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY required");

      const rawTranslated = await translateEachHeToEn(ingredientNames);
      const englishIngredients = rawTranslated.map(t => t.trim().replace(/[.,;:!?]+$/, '').replace(/\s{2,}/g, ' ').trim());

      const fallback = await generateCreativeFallback(englishIngredients, ingredientNames, LOVABLE_API_KEY);
      if (!fallback) {
        return new Response(
          JSON.stringify({ error: "לא הצלחנו ליצור מתכון AI. נסו שוב." }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      await logAiUsage(supabaseAdmin, userId, "creative_recipe", 1024, 2, "ai");

      const { data: insertedRecipe, error: insertError } = await supabase
        .from("recipes")
        .insert({
          title: fallback.title,
          ingredients: fallback.ingredients,
          instructions: fallback.instructions,
          substitutions: fallback.substitutions || [],
          cooking_time: fallback.cooking_time || null,
          user_id: userId,
        })
        .select()
        .single();

      if (insertError) throw new Error(`Failed to save recipe: ${insertError.message}`);

      return new Response(
        JSON.stringify({
          success: true,
          recipes: [{
            recipe: insertedRecipe,
            badge: "אפשרות יצירתית",
            contextLine: `מתכון יצירתי מבוסס על ${ingredientNames.length} המצרכים שלך`,
            why_it_works: fallback.why_it_works,
            reliability_score: "creative",
            spoonacular_verified: false,
            source: "ai",
            used_count: fallback.used_count || 0,
            missed_count: 0,
            used_ingredient_names: fallback.used_ingredient_names || [],
            showAIButton: false,
          }],
          recipe: insertedRecipe,
          why_it_works: fallback.why_it_works,
          reliability_score: "creative",
          spoonacular_verified: false,
          source: "ai",
        }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // ---- STEP 1: Local DB Strict Match (Chef Logic) ----
    console.log("=== STEP 1: Local DB Strict Match ===");
    const { data: library, error: libError } = await supabaseAdmin
      .from("recipe_library")
      .select("*");

    if (libError) {
      console.error("Failed to load recipe library:", libError);
    }

    if (library && library.length > 0) {
      const localResults = applyChefLogicLocal(ingredientNames, library);
      console.log(`Step 1: ${localResults.length} recipes passed Chef Logic out of ${library.length} total`);

      if (localResults.length > 0) {
        const top3 = localResults.slice(0, 3);
        const responseRecipes: any[] = [];

        for (const result of top3) {
          const recipe = result.recipe;
          const dbSubstitutions = await findSubstitutionsFromDB(supabaseAdmin, recipe.ingredient_names || []);

          const { data: insertedRecipe, error: insertError } = await supabase
            .from("recipes")
            .insert({
              title: recipe.title,
              ingredients: recipe.ingredients,
              instructions: recipe.instructions,
              substitutions: dbSubstitutions.length > 0 ? dbSubstitutions : (recipe.substitutions || []),
              cooking_time: recipe.cooking_time || null,
              user_id: userId,
            })
            .select()
            .single();

          if (insertError) {
            console.error(`Failed to save local recipe: ${insertError.message}`);
            continue;
          }

          responseRecipes.push({
            recipe: insertedRecipe,
            badge: result.badge,
            contextLine: result.contextLine,
            why_it_works: `מתכון מהמאגר המקומי – ${result.contextLine}`,
            reliability_score: "high",
            spoonacular_verified: false,
            source: "local",
            used_count: result.usedCount,
            missed_count: result.missedCount,
            used_ingredient_names: result.usedIngredientNames,
            showAIButton: false,
          });
        }

        if (responseRecipes.length > 0) {
          await logAiUsage(supabaseAdmin, userId, "recipe_generation", 0, 0, "local");
          await incrementLocalMatchCount(supabaseAdmin, userId);

          const firstResult = responseRecipes[0];
          return new Response(
            JSON.stringify({
              success: true,
              recipes: responseRecipes,
              recipe: firstResult.recipe,
              why_it_works: firstResult.why_it_works,
              reliability_score: firstResult.reliability_score,
              spoonacular_verified: false,
              source: "local",
            }),
            { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }
      }
    }

    // ---- STEP 2: External API (Spoonacular) with Chef Logic ----
    console.log("=== STEP 2: Spoonacular with Chef Logic ===");
    if (!LOVABLE_API_KEY) {
      return new Response(
        JSON.stringify({ error: "שגיאת תצורה פנימית" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const SPOONACULAR_API_KEY = Deno.env.get("SPOONACULAR_API_KEY");
    if (!SPOONACULAR_API_KEY) {
      console.error("SPOONACULAR_API_KEY not configured");
    }

    let spoonacularResults: any[] = [];

    if (SPOONACULAR_API_KEY) {
      try {
        const rawTranslated = await translateEachHeToEn(ingredientNames);
        const englishIngredients = rawTranslated.map(t =>
          t.trim().replace(/[.,;:!?]+$/, '').replace(/\s{2,}/g, ' ').trim()
        );
        console.log("Translated ingredients for Spoonacular:", englishIngredients);

        const userCount = ingredientNames.length;
        const findUrl = `https://api.spoonacular.com/recipes/findByIngredients?ingredients=${encodeURIComponent(englishIngredients.join(","))}&number=10&ranking=1&ignorePantry=true&apiKey=${SPOONACULAR_API_KEY}`;
        const findRes = await fetch(findUrl);

        if (findRes.ok) {
          const findData = await findRes.json();
          if (findData && findData.length > 0) {
            // Apply Chef Logic to Spoonacular candidates
            const scored = scoreCandidatesWithChefLogic(findData, userCount, englishIngredients);

            console.log("=== Spoonacular candidates (Chef Logic) ===");
            scored.forEach((c, i) =>
              console.log(`  #${i + 1} "${c.title}" score=${c.finalScore.toFixed(3)} badge="${c.badge}" used=${c.usedIngredientCount} missed=${c.missedIngredientCount}`)
            );

            const top3 = scored.slice(0, 3);
            for (const candidate of top3) {
              const processed = await processOneCandidate(
                candidate, ingredientNames, englishIngredients,
                LOVABLE_API_KEY, supabaseAdmin, SPOONACULAR_API_KEY
              );
              if (processed) {
                // Save to recipe_library for future local matches
                await saveSpoonacularToLibrary(supabaseAdmin, processed.recipeData);

                // Look up substitutions
                const hebrewIngNames = processed.recipeData.ingredients.map((i: any) => i.name);
                const dbSubstitutions = await findSubstitutionsFromDB(supabaseAdmin, hebrewIngNames);
                if (dbSubstitutions.length > 0) {
                  processed.recipeData.substitutions = dbSubstitutions;
                }

                const { data: insertedRecipe, error: insertError } = await supabase
                  .from("recipes")
                  .insert({
                    title: processed.recipeData.title,
                    ingredients: processed.recipeData.ingredients,
                    instructions: processed.recipeData.instructions,
                    substitutions: processed.recipeData.substitutions || [],
                    cooking_time: processed.recipeData.cooking_time || null,
                    user_id: userId,
                  })
                  .select()
                  .single();

                if (insertError) {
                  console.error(`Failed to save recipe: ${insertError.message}`);
                  continue;
                }

                spoonacularResults.push({
                  recipe: insertedRecipe,
                  badge: processed.badge,
                  contextLine: processed.contextLine,
                  why_it_works: processed.recipeData.why_it_works,
                  reliability_score: processed.recipeData.reliability_score,
                  spoonacular_verified: true,
                  source: "spoonacular",
                  used_count: processed.recipeData.used_count || 0,
                  missed_count: processed.recipeData.missed_count || 0,
                  used_ingredient_names: processed.recipeData.used_ingredient_names || [],
                  showAIButton: false,
                });
              }
            }
          }
        } else {
          console.error("Spoonacular findByIngredients error:", findRes.status);
        }
      } catch (err) {
        console.error("Spoonacular fetch error:", err);
      }
    }

    if (spoonacularResults.length > 0) {
      await logAiUsage(supabaseAdmin, userId, "recipe_generation", 400, 0, "spoonacular");

      const firstResult = spoonacularResults[0];
      return new Response(
        JSON.stringify({
          success: true,
          recipes: spoonacularResults,
          recipe: firstResult.recipe,
          why_it_works: firstResult.why_it_works,
          reliability_score: firstResult.reliability_score,
          spoonacular_verified: true,
          source: "spoonacular",
        }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // ---- STEP 3: Local Fallback Inspiration ----
    console.log("=== STEP 3: Local Fallback Inspiration ===");
    if (library && library.length > 0) {
      const fallback = findFallbackInspiration(ingredientNames, library);

      if (fallback) {
        console.log(`Step 3 fallback: "${fallback.recipe.title}" for user's anchor ingredient`);

        const recipe = fallback.recipe;
        const dbSubstitutions = await findSubstitutionsFromDB(supabaseAdmin, recipe.ingredient_names || []);

        const { data: insertedRecipe, error: insertError } = await supabase
          .from("recipes")
          .insert({
            title: recipe.title,
            ingredients: recipe.ingredients,
            instructions: recipe.instructions,
            substitutions: dbSubstitutions.length > 0 ? dbSubstitutions : (recipe.substitutions || []),
            cooking_time: recipe.cooking_time || null,
            user_id: userId,
          })
          .select()
          .single();

        if (insertError) throw new Error(`Failed to save recipe: ${insertError.message}`);

        await logAiUsage(supabaseAdmin, userId, "recipe_generation", 0, 0, "local_fallback");

        return new Response(
          JSON.stringify({
            success: true,
            recipes: [{
              recipe: insertedRecipe,
              badge: fallback.badge,
              contextLine: fallback.contextLine,
              why_it_works: `השראה מהמאגר המקומי – ${fallback.contextLine}`,
              reliability_score: "medium",
              spoonacular_verified: false,
              source: "local",
              used_count: fallback.usedCount,
              missed_count: fallback.missedCount,
              used_ingredient_names: fallback.usedIngredientNames,
              showAIButton: true,
            }],
            recipe: insertedRecipe,
            why_it_works: `השראה מהמאגר המקומי – ${fallback.contextLine}`,
            reliability_score: "medium",
            spoonacular_verified: false,
            source: "local",
          }),
          { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
    }

    // No results at all
    return new Response(
      JSON.stringify({ error: "לא מצאנו מתכון מתאים למצרכים שבחרתם. נסו לשנות או להוסיף מצרכים" }),
      { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Edge function error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
