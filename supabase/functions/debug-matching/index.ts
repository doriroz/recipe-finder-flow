import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// ============ STAPLE & ANCHOR LISTS ============
// IMPORTANT: These lists MUST match generate-and-save-recipe/index.ts

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

function isCoreAnchorEn(name: string): boolean {
  const lower = name.trim().toLowerCase();
  for (const a of CORE_ANCHOR_INGREDIENTS_EN) {
    if (lower === a || lower.includes(a) || a.includes(lower)) return true;
  }
  return false;
}

function isStapleEn(name: string): boolean {
  const lower = name.trim().toLowerCase();
  for (const s of STAPLE_INGREDIENTS_EN) {
    if (lower === s || lower.includes(s) || s.includes(lower)) return true;
  }
  return false;
}

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

interface DebugRecipeResult {
  title: string;
  recipeId: string;
  status: "accepted" | "rejected";
  rejectionReason: string | null;
  finalScore: number | null;
  badge: string | null;
  usedCount: number;
  missedCount: number;
  usedIngredientNames: string[];
  missedNonStaple: string[];
  missedAnchors: string[];
  detectedUserAnchors: string[];
  detectedRecipeAnchors: string[];
  recipeIngredientNames: string[];
  complexity: string;
  coverage: number | null;
  precision: number | null;
  burdenPenalty: number | null;
  structuralBonus?: number | null;
  burdenRatio?: number | null;
  maxBurdenRatio?: number | null;
}

interface FallbackResult {
  recipe: { title: string; id: string; ingredient_names: string[] } | null;
  anchorsChecked: string[];
  allAnchorsPresent: boolean;
  usedNames: string[];
  passed: boolean;
  reason: string;
}

interface WaterfallSummary {
  step1Count: number;
  step2Count: number;
  step3Result: FallbackResult | null;
  wouldReachStep: number;
}

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

// ============ STEP 1: Hebrew local matching ============

function debugChefLogic(
  userIngredients: string[],
  library: LibraryRecipe[]
): DebugRecipeResult[] {
  const userSet = new Set(userIngredients.map(i => i.trim()));
  const userCount = userIngredients.length;
  const maxBurden = userCount <= 2 ? 2 : 3;
  const userAnchors = userIngredients.filter(i => isCoreAnchorHe(i));
  const results: DebugRecipeResult[] = [];

  for (const recipe of library) {
    const recipeIngs = recipe.ingredient_names || [];
    if (recipeIngs.length === 0) continue;

    const nonStapleRecipeIngs = recipeIngs.filter(i => !isStapleHe(i));
    const anchorRecipeIngs = recipeIngs.filter(i => isCoreAnchorHe(i));

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
        if (!isStapleHe(recipeIng)) missedNonStaple.push(recipeIng);
        if (isCoreAnchorHe(recipeIng)) missedAnchors.push(recipeIng);
      }
    }

    const base: Partial<DebugRecipeResult> = {
      title: recipe.title,
      recipeId: recipe.id,
      usedCount: usedNames.length,
      missedCount: missedNonStaple.length,
      usedIngredientNames: usedNames,
      missedNonStaple,
      missedAnchors: [...missedAnchors],
      detectedUserAnchors: userAnchors,
      detectedRecipeAnchors: anchorRecipeIngs,
      recipeIngredientNames: recipeIngs,
      complexity: recipe.complexity || "Everyday",
    };

    if (usedNames.length === 0) {
      results.push({ ...base, status: "rejected", rejectionReason: "אפס התאמות – אין חפיפה בין המצרכים", finalScore: null, badge: null, coverage: null, precision: null, burdenPenalty: null } as DebugRecipeResult);
      continue;
    }
    // Anchor penalties (soft, not hard rejection)
    let anchorPenalty = missedAnchors.length * 0.15;

    for (const userIng of userSet) {
      if (isCoreAnchorHe(userIng)) {
        const recipeHasIt = recipeIngs.some(ri => ri.includes(userIng) || userIng.includes(ri));
        if (!recipeHasIt) { anchorPenalty += 0.15; }
      }
    }

    if (missedNonStaple.length > maxBurden) {
      results.push({ ...base, status: "rejected", rejectionReason: `עומס: ${missedNonStaple.length} מצרכים חסרים (מקסימום ${maxBurden}). חסר: ${missedNonStaple.join(", ")}`, finalScore: null, badge: null, coverage: null, precision: null, burdenPenalty: null } as DebugRecipeResult);
      continue;
    }

    if (recipe.complexity === "Special") {
      const nonStapleCoverage = nonStapleRecipeIngs.length > 0 ? (nonStapleRecipeIngs.length - missedNonStaple.length) / nonStapleRecipeIngs.length : 0;
      if (nonStapleCoverage < 0.8) {
        results.push({ ...base, status: "rejected", rejectionReason: `מורכבות: מתכון Special דורש 80% כיסוי, יש רק ${(nonStapleCoverage * 100).toFixed(0)}%`, finalScore: null, badge: null, coverage: null, precision: null, burdenPenalty: null } as DebugRecipeResult);
        continue;
      }
    }

    const usedCount = usedNames.length;
    const totalIngredients = recipeIngs.length;
    const coverage = userCount > 0 ? usedCount / userCount : 0;
    const precision = totalIngredients > 0 ? usedCount / totalIngredients : 0;
    const extraCount = totalIngredients - usedCount;
    const burdenRatio = userCount > 0 ? extraCount / userCount : 0;
    const maxBurdenRatio = userCount <= 3 ? 0.75 : userCount <= 5 ? 1.0 : 1.5;
    const burdenPenalty = Math.min(burdenRatio / maxBurdenRatio, 1);

    const proteinKwHe = ["עוף", "בשר", "סלמון", "טונה", "דג", "ביצה", "טופו", "נקניק"];
    const hasProtein = usedNames.some(n => proteinKwHe.some(p => n.includes(p)));
    let structuralBonus = 0;
    if (hasProtein) structuralBonus += 0.05;
    if (missedNonStaple.length <= 3) structuralBonus += 0.05;
    structuralBonus -= anchorPenalty;

    const finalScore = 0.55 * coverage + 0.20 * precision + 0.15 * (1 - burdenPenalty) + 0.10 * structuralBonus;

    // Soft threshold
    if (coverage < 0.5 || usedCount < 2 || finalScore < 0.55) {
      results.push({ ...base, status: "rejected", rejectionReason: `סף מינימלי: coverage=${coverage.toFixed(2)} usedCount=${usedCount} finalScore=${finalScore.toFixed(3)}`, finalScore, badge: null, coverage, precision, burdenPenalty, structuralBonus, burdenRatio, maxBurdenRatio } as DebugRecipeResult);
      continue;
    }

    const badge = finalScore >= 0.85 ? "המלצת השף" : finalScore >= 0.70 ? "התאמה מצוינת" : "המלצת השף";

    results.push({ ...base, status: "accepted", rejectionReason: null, finalScore, badge, coverage, precision, burdenPenalty, structuralBonus, burdenRatio, maxBurdenRatio } as DebugRecipeResult);
  }

  results.sort((a, b) => {
    if (a.status === "accepted" && b.status !== "accepted") return -1;
    if (a.status !== "accepted" && b.status === "accepted") return 1;
    return (b.finalScore || 0) - (a.finalScore || 0);
  });

  return results;
}

// ============ STEP 2 LIVE: Real Spoonacular API call ============

interface Step2LiveResult {
  translationMap: Record<string, string>;
  spoonacularUrl: string;
  rawCandidates: any[];
  afterChefLogic: DebugRecipeResult[];
  candidatesBeforeFilter: number;
  candidatesAfterFilter: number;
  error: string | null;
}

async function liveStep2(userIngredientsHe: string[]): Promise<Step2LiveResult> {
  const SPOONACULAR_API_KEY = Deno.env.get("SPOONACULAR_API_KEY");
  if (!SPOONACULAR_API_KEY) {
    return { translationMap: {}, spoonacularUrl: "", rawCandidates: [], afterChefLogic: [], candidatesBeforeFilter: 0, candidatesAfterFilter: 0, error: "SPOONACULAR_API_KEY not configured" };
  }

  // 1. Translate each Hebrew ingredient to English via MyMemory
  const translationMap: Record<string, string> = {};
  const englishIngredients: string[] = [];
  for (const heIng of userIngredientsHe) {
    const en = await translateText(heIng, "he|en");
    translationMap[heIng] = en;
    englishIngredients.push(en.toLowerCase().trim());
  }

  // 2. Call Spoonacular findByIngredients
  const ingredientsParam = englishIngredients.join(",");
  const spoonacularUrl = `https://api.spoonacular.com/recipes/findByIngredients?ingredients=${encodeURIComponent(ingredientsParam)}&number=10&ranking=1&ignorePantry=true&apiKey=${SPOONACULAR_API_KEY}`;
  const maskedUrl = spoonacularUrl.replace(SPOONACULAR_API_KEY, "***MASKED***");

  let rawCandidates: any[] = [];
  try {
    const res = await fetch(spoonacularUrl);
    if (!res.ok) {
      const errText = await res.text();
      return { translationMap, spoonacularUrl: maskedUrl, rawCandidates: [], afterChefLogic: [], candidatesBeforeFilter: 0, candidatesAfterFilter: 0, error: `Spoonacular API error ${res.status}: ${errText}` };
    }
    rawCandidates = await res.json();
  } catch (err) {
    return { translationMap, spoonacularUrl: maskedUrl, rawCandidates: [], afterChefLogic: [], candidatesBeforeFilter: 0, candidatesAfterFilter: 0, error: `Fetch error: ${err}` };
  }

  // 3. Apply Chef Logic scoring (same as main function)
  const userCount = userIngredientsHe.length;
  const maxBurden = userCount <= 2 ? 2 : 3;
  const userSetEn = new Set(englishIngredients);
  const afterChefLogic: DebugRecipeResult[] = [];

  for (const c of rawCandidates) {
    const used = c.usedIngredientCount || c.usedIngredients?.length || 0;
    const missed = c.missedIngredientCount || c.missedIngredients?.length || 0;
    const missedIngredients = c.missedIngredients || [];
    const usedIngredients = c.usedIngredients || [];
    const usedNames = usedIngredients.map((i: any) => i.name || "");
    const missedNames = missedIngredients.map((i: any) => i.name || "");

    const base: Partial<DebugRecipeResult> = {
      title: c.title || "Unknown",
      recipeId: String(c.id || ""),
      usedCount: used,
      missedCount: missed,
      usedIngredientNames: usedNames,
      missedNonStaple: missedNames.filter((n: string) => !isStapleEn(n)),
      missedAnchors: [],
      detectedUserAnchors: englishIngredients.filter(i => isCoreAnchorEn(i)),
      detectedRecipeAnchors: [...usedNames, ...missedNames].filter((n: string) => isCoreAnchorEn(n)),
      recipeIngredientNames: [...usedNames, ...missedNames],
      complexity: "External",
    };

    // RULE 0: Zero match
    if (used === 0) {
      afterChefLogic.push({ ...base, status: "rejected", rejectionReason: "Zero matches – no ingredient overlap", finalScore: null, badge: null, coverage: null, precision: null, burdenPenalty: null } as DebugRecipeResult);
      continue;
    }

    // RULE 1: Core Anchor — soft penalty
    const missedAnchorsArr = missedIngredients.filter((i: any) => isCoreAnchorEn((i.name || "").toLowerCase().trim()));
    let anchorPenalty = missedAnchorsArr.length * 0.15;

    // RULE 1b: Reverse anchor — soft penalty
    for (const userIng of userSetEn) {
      if (isCoreAnchorEn(userIng)) {
        const recipeHasIt = usedIngredients.some((i: any) =>
          (i.name || "").toLowerCase().trim().includes(userIng) || userIng.includes((i.name || "").toLowerCase().trim())
        );
        if (!recipeHasIt) { anchorPenalty += 0.15; }
      }
    }

    // RULE 2: Burden
    const missedNonStaple = missedIngredients.filter((i: any) => !isStapleEn((i.name || "").toLowerCase().trim()));
    if (missedNonStaple.length > maxBurden) {
      afterChefLogic.push({ ...base, status: "rejected", rejectionReason: `Burden: ${missedNonStaple.length} missing non-staples > max ${maxBurden}`, finalScore: null, badge: null, coverage: null, precision: null, burdenPenalty: null } as DebugRecipeResult);
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
    const hasProtein = usedIngredients.some((i: any) => proteinKeywords.some(p => (i.name || "").toLowerCase().includes(p)));
    let structuralBonus = 0;
    if (hasProtein) structuralBonus += 0.05;
    if (missed <= 3) structuralBonus += 0.05;
    structuralBonus -= anchorPenalty;

    const finalScore = 0.55 * coverage + 0.20 * precision + 0.15 * (1 - burdenPenalty) + 0.10 * structuralBonus;

    // Soft threshold
    if (coverage < 0.5 || used < 2 || finalScore < 0.55) {
      afterChefLogic.push({ ...base, status: "rejected", rejectionReason: `Threshold: coverage=${coverage.toFixed(2)} used=${used} finalScore=${finalScore.toFixed(3)}`, finalScore, badge: null, coverage, precision, burdenPenalty, structuralBonus, burdenRatio, maxBurdenRatio, missedAnchors: missedAnchorsArr.map((a: any) => a.name) } as DebugRecipeResult);
      continue;
    }

    afterChefLogic.push({
      ...base,
      status: "accepted",
      rejectionReason: null,
      finalScore,
      badge: finalScore >= 0.85 ? "Chef's Pick" : finalScore >= 0.70 ? "Good Match" : "Match",
      coverage,
      precision,
      burdenPenalty,
      structuralBonus,
      burdenRatio,
      maxBurdenRatio,
      missedAnchors: missedAnchorsArr.map((a: any) => a.name),
    } as DebugRecipeResult);
  }

  afterChefLogic.sort((a, b) => {
    if (a.status === "accepted" && b.status !== "accepted") return -1;
    if (a.status !== "accepted" && b.status === "accepted") return 1;
    return (b.finalScore || 0) - (a.finalScore || 0);
  });

  const accepted = afterChefLogic.filter(r => r.status === "accepted");

  return {
    translationMap,
    spoonacularUrl: maskedUrl,
    rawCandidates: rawCandidates.map(c => ({
      id: c.id,
      title: c.title,
      image: c.image,
      usedIngredientCount: c.usedIngredientCount,
      missedIngredientCount: c.missedIngredientCount,
      usedIngredients: (c.usedIngredients || []).map((i: any) => ({ name: i.name, original: i.original })),
      missedIngredients: (c.missedIngredients || []).map((i: any) => ({ name: i.name, original: i.original })),
    })),
    afterChefLogic,
    candidatesBeforeFilter: rawCandidates.length,
    candidatesAfterFilter: accepted.length,
    error: null,
  };
}

// ============ STEP 3 SIMULATION (Fallback) ============

function simulateStep3(
  userIngredients: string[],
  library: LibraryRecipe[]
): FallbackResult {
  const userAnchors = userIngredients.filter(i => isCoreAnchorHe(i));
  if (userAnchors.length === 0) {
    return { recipe: null, anchorsChecked: [], allAnchorsPresent: false, usedNames: [], passed: false, reason: "אין עוגנים בקלט המשתמש" };
  }

  const userSet = new Set(userIngredients.map(i => i.trim()));

  for (const recipe of library) {
    if (recipe.complexity === "Special") continue;
    const recipeIngs = recipe.ingredient_names || [];

    let allAnchorsPresent = true;
    for (const anchor of userAnchors) {
      const recipeHasIt = recipeIngs.some(ri => ri.includes(anchor) || anchor.includes(ri));
      if (!recipeHasIt) {
        allAnchorsPresent = false;
        break;
      }
    }
    if (!allAnchorsPresent) continue;

    const usedNames = recipeIngs.filter(ri => {
      for (const ui of userSet) {
        if (ui === ri || ui.includes(ri) || ri.includes(ui)) return true;
      }
      return false;
    });

    if (usedNames.length === 0) continue;

    return {
      recipe: { title: recipe.title, id: recipe.id, ingredient_names: recipeIngs },
      anchorsChecked: userAnchors,
      allAnchorsPresent: true,
      usedNames,
      passed: true,
      reason: `נבחר "${recipe.title}" – כל ${userAnchors.length} עוגנים נמצאו, ${usedNames.length} מצרכים התאימו`,
    };
  }

  return {
    recipe: null,
    anchorsChecked: userAnchors,
    allAnchorsPresent: false,
    usedNames: [],
    passed: false,
    reason: `אף מתכון Everyday לא מכיל את כל העוגנים: ${userAnchors.join(", ")}`,
  };
}

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

    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );

    const token = authHeader.replace("Bearer ", "");
    const { data: claimsData, error: claimsError } = await supabase.auth.getClaims(token);
    if (claimsError || !claimsData?.claims) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { ingredients } = await req.json();
    if (!ingredients || !Array.isArray(ingredients) || ingredients.length === 0) {
      return new Response(
        JSON.stringify({ error: "ingredients array is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { data: library, error: libError } = await supabaseAdmin
      .from("recipe_library")
      .select("*");

    if (libError) {
      return new Response(
        JSON.stringify({ error: `Failed to load library: ${libError.message}` }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Step 1: Hebrew local matching
    const step1Results = debugChefLogic(ingredients, library || []);
    const step1Accepted = step1Results.filter(r => r.status === "accepted");
    const step1Rejected = step1Results.filter(r => r.status === "rejected");

    // Step 2: LIVE Spoonacular API call (real dry-run)
    const step2Live = await liveStep2(ingredients);

    // Step 3: Fallback simulation
    const step3Result = simulateStep3(ingredients, library || []);

    // Waterfall summary
    const step2AcceptedCount = step2Live.afterChefLogic.filter(r => r.status === "accepted").length;
    const wouldReachStep = step1Accepted.length > 0 ? 1 : step2AcceptedCount > 0 ? 2 : step3Result.passed ? 3 : 4;

    const waterfall: WaterfallSummary = {
      step1Count: step1Accepted.length,
      step2Count: step2AcceptedCount,
      step3Result,
      wouldReachStep,
    };

    // Rejection summary
    const rejectionSummary: Record<string, number> = {};
    for (const r of step1Rejected) {
      const reason = r.rejectionReason?.split(":")[0] || "unknown";
      rejectionSummary[reason] = (rejectionSummary[reason] || 0) + 1;
    }

    const userAnchors = ingredients.filter((i: string) => isCoreAnchorHe(i));
    const userStaples = ingredients.filter((i: string) => isStapleHe(i));
    const userCount = ingredients.length;
    const maxBurdenRatio = userCount <= 3 ? 0.75 : userCount <= 5 ? 1.0 : 1.5;

    return new Response(
      JSON.stringify({
        success: true,
        input: {
          ingredients,
          userAnchors,
          userStaples,
          maxBurden: ingredients.length <= 2 ? 2 : 3,
          totalLibraryRecipes: library?.length || 0,
        },
        formula: {
          weights: { coverage: 0.55, precision: 0.20, burden: 0.15, structural: 0.10 },
          maxBurden: ingredients.length <= 2 ? 2 : 3,
          maxBurdenRatio,
          description: "finalScore = 0.55×coverage + 0.20×precision + 0.15×(1-burdenPenalty) + 0.10×structuralBonus",
        },
        waterfall,
        summary: {
          accepted: step1Accepted.length,
          rejected: step1Rejected.length,
          rejectionSummary,
        },
        accepted: step1Accepted.slice(0, 10),
        rejected: step1Rejected.slice(0, 20),
        step2_live: step2Live,
        fallback: step3Result,
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Debug matching error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
