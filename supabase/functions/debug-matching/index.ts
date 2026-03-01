import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// ============ STAPLE & ANCHOR LISTS (mirrored from main function) ============

const STAPLE_INGREDIENTS_HE = new Set([
  "מלח", "פלפל שחור", "שמן זית", "שמן קנולה", "סוכר", "מים", "חומץ", "רוטב סויה",
  "שמן", "פלפל",
]);

const CORE_ANCHOR_INGREDIENTS_HE = new Set([
  "עוף", "בשר טחון", "סלמון", "טונה", "חזה עוף", "בשר בקר", "ביצה", "טופו",
  "פסטה", "אורז", "קוסקוס", "שריות עוף", "דג סול", "נקניקיות",
  "חציל", "כרוב", "תפוח אדמה", "בטטה", "כרובית", "דלעת",
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

    // RULE 0: Zero match
    if (usedNames.length === 0) {
      results.push({
        ...base,
        status: "rejected",
        rejectionReason: "אפס התאמות – אין חפיפה בין המצרכים",
        finalScore: null, badge: null, coverage: null, precision: null, burdenPenalty: null,
      } as DebugRecipeResult);
      continue;
    }

    // RULE 1: Missing anchor from recipe
    if (missedAnchors.length > 0) {
      results.push({
        ...base,
        status: "rejected",
        rejectionReason: `עוגן חסר: המתכון דורש ${missedAnchors.join(", ")} שלא נבחרו`,
        finalScore: null, badge: null, coverage: null, precision: null, burdenPenalty: null,
      } as DebugRecipeResult);
      continue;
    }

    // RULE 1b: Bidirectional anchor
    let reverseAnchorMissing: string | null = null;
    for (const userIng of userSet) {
      if (isCoreAnchorHe(userIng)) {
        const recipeHasIt = recipeIngs.some(ri => ri.includes(userIng) || userIng.includes(ri));
        if (!recipeHasIt) {
          reverseAnchorMissing = userIng;
          break;
        }
      }
    }
    if (reverseAnchorMissing) {
      results.push({
        ...base,
        status: "rejected",
        rejectionReason: `עוגן הפוך: בחרת "${reverseAnchorMissing}" אבל המתכון לא מכיל אותו`,
        finalScore: null, badge: null, coverage: null, precision: null, burdenPenalty: null,
      } as DebugRecipeResult);
      continue;
    }

    // RULE 2: Burden
    if (missedNonStaple.length > maxBurden) {
      results.push({
        ...base,
        status: "rejected",
        rejectionReason: `עומס: ${missedNonStaple.length} מצרכים חסרים (מקסימום ${maxBurden}). חסר: ${missedNonStaple.join(", ")}`,
        finalScore: null, badge: null, coverage: null, precision: null, burdenPenalty: null,
      } as DebugRecipeResult);
      continue;
    }

    // RULE 3: Complexity
    if (recipe.complexity === "Special") {
      const nonStapleCoverage = nonStapleRecipeIngs.length > 0
        ? (nonStapleRecipeIngs.length - missedNonStaple.length) / nonStapleRecipeIngs.length
        : 0;
      if (nonStapleCoverage < 0.8) {
        results.push({
          ...base,
          status: "rejected",
          rejectionReason: `מורכבות: מתכון Special דורש 80% כיסוי, יש רק ${(nonStapleCoverage * 100).toFixed(0)}%`,
          finalScore: null, badge: null, coverage: null, precision: null, burdenPenalty: null,
        } as DebugRecipeResult);
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

    const proteinKwHe = ["עוף", "בשר", "סלמון", "טונה", "דג", "ביצה", "טופו", "נקניק"];
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
                  "המלצת השף";

    results.push({
      ...base,
      status: "accepted",
      rejectionReason: null,
      finalScore,
      badge,
      coverage,
      precision,
      burdenPenalty,
    } as DebugRecipeResult);
  }

  results.sort((a, b) => {
    if (a.status === "accepted" && b.status !== "accepted") return -1;
    if (a.status !== "accepted" && b.status === "accepted") return 1;
    return (b.finalScore || 0) - (a.finalScore || 0);
  });

  return results;
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

    // Verify user is admin
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

    // Load recipe library
    const { data: library, error: libError } = await supabaseAdmin
      .from("recipe_library")
      .select("*");

    if (libError) {
      return new Response(
        JSON.stringify({ error: `Failed to load library: ${libError.message}` }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const debugResults = debugChefLogic(ingredients, library || []);

    const accepted = debugResults.filter(r => r.status === "accepted");
    const rejected = debugResults.filter(r => r.status === "rejected");

    // Categorize rejections
    const rejectionSummary: Record<string, number> = {};
    for (const r of rejected) {
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
        summary: {
          accepted: accepted.length,
          rejected: rejected.length,
          rejectionSummary,
        },
        accepted: accepted.slice(0, 10),
        rejected: rejected.slice(0, 20),
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
