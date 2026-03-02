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
    if (missedAnchors.length > 0) {
      results.push({ ...base, status: "rejected", rejectionReason: `עוגן חסר: המתכון דורש ${missedAnchors.join(", ")} שלא נבחרו`, finalScore: null, badge: null, coverage: null, precision: null, burdenPenalty: null } as DebugRecipeResult);
      continue;
    }

    let reverseAnchorMissing: string | null = null;
    for (const userIng of userSet) {
      if (isCoreAnchorHe(userIng)) {
        const recipeHasIt = recipeIngs.some(ri => ri.includes(userIng) || userIng.includes(ri));
        if (!recipeHasIt) { reverseAnchorMissing = userIng; break; }
      }
    }
    if (reverseAnchorMissing) {
      results.push({ ...base, status: "rejected", rejectionReason: `עוגן הפוך: בחרת "${reverseAnchorMissing}" אבל המתכון לא מכיל אותו`, finalScore: null, badge: null, coverage: null, precision: null, burdenPenalty: null } as DebugRecipeResult);
      continue;
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

    const finalScore = 0.55 * coverage + 0.20 * precision + 0.15 * (1 - burdenPenalty) + 0.10 * structuralBonus;
    const badge = finalScore >= 0.85 ? "המלצת השף" : finalScore >= 0.70 ? "התאמה מצוינת" : "המלצת השף";

    results.push({ ...base, status: "accepted", rejectionReason: null, finalScore, badge, coverage, precision, burdenPenalty } as DebugRecipeResult);
  }

  results.sort((a, b) => {
    if (a.status === "accepted" && b.status !== "accepted") return -1;
    if (a.status !== "accepted" && b.status === "accepted") return 1;
    return (b.finalScore || 0) - (a.finalScore || 0);
  });

  return results;
}

// ============ STEP 2 SIMULATION (English-side filtering) ============

function simulateStep2(
  userIngredients: string[],
  library: LibraryRecipe[]
): DebugRecipeResult[] {
  // Simulate English-side Chef Logic against library recipes that have English titles
  // This tests the same rules but with EN anchor/staple sets
  const englishRecipes = library.filter(r => /^[a-zA-Z]/.test(r.title));
  if (englishRecipes.length === 0) return [];

  const userSet = new Set(userIngredients.map(i => i.trim().toLowerCase()));
  const userCount = userIngredients.length;
  const maxBurden = userCount <= 2 ? 2 : 3;
  const userAnchors = userIngredients.filter(i => isCoreAnchorEn(i));
  const results: DebugRecipeResult[] = [];

  for (const recipe of englishRecipes) {
    const recipeIngs = (recipe.ingredient_names || []).map(i => i.toLowerCase());
    if (recipeIngs.length === 0) continue;

    const nonStapleRecipeIngs = recipeIngs.filter(i => !isStapleEn(i));
    const anchorRecipeIngs = recipeIngs.filter(i => isCoreAnchorEn(i));

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
        if (!isStapleEn(recipeIng)) missedNonStaple.push(recipeIng);
        if (isCoreAnchorEn(recipeIng)) missedAnchors.push(recipeIng);
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
      recipeIngredientNames: recipe.ingredient_names || [],
      complexity: recipe.complexity || "Everyday",
    };

    if (usedNames.length === 0) {
      results.push({ ...base, status: "rejected", rejectionReason: "Zero matches", finalScore: null, badge: null, coverage: null, precision: null, burdenPenalty: null } as DebugRecipeResult);
      continue;
    }
    if (missedAnchors.length > 0) {
      results.push({ ...base, status: "rejected", rejectionReason: `Missing anchor: ${missedAnchors.join(", ")}`, finalScore: null, badge: null, coverage: null, precision: null, burdenPenalty: null } as DebugRecipeResult);
      continue;
    }

    let reverseAnchorMissing: string | null = null;
    for (const userIng of userSet) {
      if (isCoreAnchorEn(userIng)) {
        const recipeHasIt = recipeIngs.some(ri => ri.includes(userIng) || userIng.includes(ri));
        if (!recipeHasIt) { reverseAnchorMissing = userIng; break; }
      }
    }
    if (reverseAnchorMissing) {
      results.push({ ...base, status: "rejected", rejectionReason: `Reverse anchor: "${reverseAnchorMissing}" not in recipe`, finalScore: null, badge: null, coverage: null, precision: null, burdenPenalty: null } as DebugRecipeResult);
      continue;
    }

    if (missedNonStaple.length > maxBurden) {
      results.push({ ...base, status: "rejected", rejectionReason: `Burden: ${missedNonStaple.length} missing > max ${maxBurden}`, finalScore: null, badge: null, coverage: null, precision: null, burdenPenalty: null } as DebugRecipeResult);
      continue;
    }

    const usedCount = usedNames.length;
    const totalIngredients = recipeIngs.length;
    const coverage = userCount > 0 ? usedCount / userCount : 0;
    const precision = totalIngredients > 0 ? usedCount / totalIngredients : 0;
    const extraCount = totalIngredients - usedCount;
    const burdenRatio = userCount > 0 ? extraCount / userCount : 0;
    const maxBurdenRatio = userCount <= 3 ? 0.75 : userCount <= 5 ? 1.0 : 1.5;
    const burdenPenalty = Math.min(burdenRatio / maxBurdenRatio, 1);
    const finalScore = 0.55 * coverage + 0.20 * precision + 0.15 * (1 - burdenPenalty);

    results.push({ ...base, status: "accepted", rejectionReason: null, finalScore, badge: finalScore >= 0.7 ? "Good Match" : "Match", coverage, precision, burdenPenalty } as DebugRecipeResult);
  }

  results.sort((a, b) => {
    if (a.status === "accepted" && b.status !== "accepted") return -1;
    if (a.status !== "accepted" && b.status === "accepted") return 1;
    return (b.finalScore || 0) - (a.finalScore || 0);
  });

  return results;
}

// ============ STEP 3 SIMULATION (Fallback with fixed logic) ============

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
    let missingAnchor = "";
    for (const anchor of userAnchors) {
      const recipeHasIt = recipeIngs.some(ri => ri.includes(anchor) || anchor.includes(ri));
      if (!recipeHasIt) {
        allAnchorsPresent = false;
        missingAnchor = anchor;
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

    // Step 2: English-side simulation (uses EN ingredients from library)
    const step2Results = simulateStep2(ingredients, library || []);
    const step2Accepted = step2Results.filter(r => r.status === "accepted");

    // Step 3: Fallback simulation
    const step3Result = simulateStep3(ingredients, library || []);

    // Waterfall summary
    const wouldReachStep = step1Accepted.length > 0 ? 1 : step2Accepted.length > 0 ? 2 : step3Result.passed ? 3 : 4;

    const waterfall: WaterfallSummary = {
      step1Count: step1Accepted.length,
      step2Count: step2Accepted.length,
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
        waterfall,
        summary: {
          accepted: step1Accepted.length,
          rejected: step1Rejected.length,
          rejectionSummary,
        },
        accepted: step1Accepted.slice(0, 10),
        rejected: step1Rejected.slice(0, 20),
        step2: {
          accepted: step2Accepted.slice(0, 10),
          rejected: step2Results.filter(r => r.status === "rejected").slice(0, 10),
          total: step2Results.length,
        },
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
