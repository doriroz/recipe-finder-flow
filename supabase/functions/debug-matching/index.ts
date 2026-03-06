import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

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
  score: number | null;
  matchCount: number;
  missingCount: number;
  usedIngredientNames: string[];
  recipeIngredientNames: string[];
  badge: string | null;
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

// ============ STEP 1: Hebrew local matching (simple scoring) ============

function debugSimpleScoring(
  userIngredients: string[],
  library: LibraryRecipe[]
): DebugRecipeResult[] {
  const userSet = new Set(userIngredients.map(i => i.trim()));
  const results: DebugRecipeResult[] = [];

  for (const recipe of library) {
    const recipeIngs = recipe.ingredient_names || [];
    if (recipeIngs.length === 0) continue;

    // Skip recipes with > 10 ingredients
    if (recipeIngs.length > 10) {
      results.push({
        title: recipe.title, recipeId: recipe.id, status: "rejected",
        rejectionReason: "יותר מ-10 מצרכים", score: null, matchCount: 0,
        missingCount: recipeIngs.length, usedIngredientNames: [],
        recipeIngredientNames: recipeIngs, badge: null,
      });
      continue;
    }

    const usedNames: string[] = [];
    for (const recipeIng of recipeIngs) {
      for (const userIng of userSet) {
        if (userIng === recipeIng || userIng.includes(recipeIng) || recipeIng.includes(userIng)) {
          usedNames.push(recipeIng);
          break;
        }
      }
    }

    const matchCount = usedNames.length;
    const missingCount = recipeIngs.length - matchCount;

    if (matchCount === 0) {
      results.push({
        title: recipe.title, recipeId: recipe.id, status: "rejected",
        rejectionReason: "אפס התאמות", score: null, matchCount: 0,
        missingCount: recipeIngs.length, usedIngredientNames: [],
        recipeIngredientNames: recipeIngs, badge: null,
      });
      continue;
    }

    if (missingCount > 3) {
      results.push({
        title: recipe.title, recipeId: recipe.id, status: "rejected",
        rejectionReason: `חסרים ${missingCount} מצרכים (מקסימום 3)`, score: null,
        matchCount, missingCount, usedIngredientNames: usedNames,
        recipeIngredientNames: recipeIngs, badge: null,
      });
      continue;
    }

    const score = matchCount - missingCount;
    const badge = missingCount === 0 ? "מוכן לבישול" :
                  missingCount <= 2 ? "כמעט מוכן" :
                  "חסרים 3 מצרכים";

    results.push({
      title: recipe.title, recipeId: recipe.id, status: "accepted",
      rejectionReason: null, score, matchCount, missingCount,
      usedIngredientNames: usedNames, recipeIngredientNames: recipeIngs, badge,
    });
  }

  results.sort((a, b) => {
    if (a.status === "accepted" && b.status !== "accepted") return -1;
    if (a.status !== "accepted" && b.status === "accepted") return 1;
    return (b.score || 0) - (a.score || 0);
  });

  return results;
}

// ============ STEP 2 LIVE: Real Spoonacular API call ============

interface Step2LiveResult {
  translationMap: Record<string, string>;
  spoonacularUrl: string;
  rawCandidates: any[];
  afterScoring: DebugRecipeResult[];
  candidatesBeforeFilter: number;
  candidatesAfterFilter: number;
  error: string | null;
}

async function liveStep2(userIngredientsHe: string[]): Promise<Step2LiveResult> {
  const SPOONACULAR_API_KEY = Deno.env.get("SPOONACULAR_API_KEY");
  if (!SPOONACULAR_API_KEY) {
    return { translationMap: {}, spoonacularUrl: "", rawCandidates: [], afterScoring: [], candidatesBeforeFilter: 0, candidatesAfterFilter: 0, error: "SPOONACULAR_API_KEY not configured" };
  }

  const translationMap: Record<string, string> = {};
  const englishIngredients: string[] = [];
  for (const heIng of userIngredientsHe) {
    const en = await translateText(heIng, "he|en");
    translationMap[heIng] = en;
    englishIngredients.push(en.toLowerCase().trim());
  }

  const ingredientsParam = englishIngredients.join(",");
  const spoonacularUrl = `https://api.spoonacular.com/recipes/findByIngredients?ingredients=${encodeURIComponent(ingredientsParam)}&number=10&ranking=1&ignorePantry=true&apiKey=${SPOONACULAR_API_KEY}`;
  const maskedUrl = spoonacularUrl.replace(SPOONACULAR_API_KEY, "***MASKED***");

  let rawCandidates: any[] = [];
  try {
    const res = await fetch(spoonacularUrl);
    if (!res.ok) {
      const errText = await res.text();
      return { translationMap, spoonacularUrl: maskedUrl, rawCandidates: [], afterScoring: [], candidatesBeforeFilter: 0, candidatesAfterFilter: 0, error: `Spoonacular API error ${res.status}: ${errText}` };
    }
    rawCandidates = await res.json();
  } catch (err) {
    return { translationMap, spoonacularUrl: maskedUrl, rawCandidates: [], afterScoring: [], candidatesBeforeFilter: 0, candidatesAfterFilter: 0, error: `Fetch error: ${err}` };
  }

  const afterScoring: DebugRecipeResult[] = [];

  for (const c of rawCandidates) {
    const used = c.usedIngredientCount || 0;
    const missed = c.missedIngredientCount || 0;
    const total = used + missed;
    const usedIngredients = c.usedIngredients || [];
    const usedNames = usedIngredients.map((i: any) => i.name || "");
    const missedNames = (c.missedIngredients || []).map((i: any) => i.name || "");

    if (total > 10) {
      afterScoring.push({
        title: c.title || "Unknown", recipeId: String(c.id || ""), status: "rejected",
        rejectionReason: "יותר מ-10 מצרכים", score: null, matchCount: used,
        missingCount: missed, usedIngredientNames: usedNames,
        recipeIngredientNames: [...usedNames, ...missedNames], badge: null,
      });
      continue;
    }

    if (used === 0) {
      afterScoring.push({
        title: c.title || "Unknown", recipeId: String(c.id || ""), status: "rejected",
        rejectionReason: "אפס התאמות", score: null, matchCount: 0,
        missingCount: missed, usedIngredientNames: [],
        recipeIngredientNames: [...usedNames, ...missedNames], badge: null,
      });
      continue;
    }

    if (missed > 3) {
      afterScoring.push({
        title: c.title || "Unknown", recipeId: String(c.id || ""), status: "rejected",
        rejectionReason: `חסרים ${missed} מצרכים (מקסימום 3)`, score: null,
        matchCount: used, missingCount: missed, usedIngredientNames: usedNames,
        recipeIngredientNames: [...usedNames, ...missedNames], badge: null,
      });
      continue;
    }

    const score = used - missed;
    const badge = missed === 0 ? "מוכן לבישול" :
                  missed <= 2 ? "כמעט מוכן" :
                  "חסרים 3 מצרכים";

    afterScoring.push({
      title: c.title || "Unknown", recipeId: String(c.id || ""), status: "accepted",
      rejectionReason: null, score, matchCount: used, missingCount: missed,
      usedIngredientNames: usedNames, recipeIngredientNames: [...usedNames, ...missedNames], badge,
    });
  }

  afterScoring.sort((a, b) => {
    if (a.status === "accepted" && b.status !== "accepted") return -1;
    if (a.status !== "accepted" && b.status === "accepted") return 1;
    return (b.score || 0) - (a.score || 0);
  });

  const accepted = afterScoring.filter(r => r.status === "accepted");

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
    afterScoring,
    candidatesBeforeFilter: rawCandidates.length,
    candidatesAfterFilter: accepted.length,
    error: null,
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

    // Step 1: Hebrew local matching (simple scoring)
    const step1Results = debugSimpleScoring(ingredients, library || []);
    const step1Accepted = step1Results.filter(r => r.status === "accepted");
    const step1Rejected = step1Results.filter(r => r.status === "rejected");

    // Step 2: LIVE Spoonacular API call
    const step2Live = await liveStep2(ingredients);

    // Rejection summary
    const rejectionSummary: Record<string, number> = {};
    for (const r of step1Rejected) {
      const reason = r.rejectionReason?.split("–")[0]?.trim() || "unknown";
      rejectionSummary[reason] = (rejectionSummary[reason] || 0) + 1;
    }

    const step2AcceptedCount = step2Live.afterScoring.filter(r => r.status === "accepted").length;

    return new Response(
      JSON.stringify({
        success: true,
        input: {
          ingredients,
          totalLibraryRecipes: library?.length || 0,
        },
        formula: {
          description: "score = usedCount - missingCount. Reject if matchCount == 0, missingCount > 3, or totalIngredients > 10.",
          badges: {
            "missingCount == 0": "מוכן לבישול",
            "missingCount <= 2": "כמעט מוכן",
            "missingCount == 3": "חסרים 3 מצרכים",
          },
        },
        pipeline: {
          step1_local_accepted: step1Accepted.length,
          step2_api_accepted: step2AcceptedCount,
          api_triggered: localResults_count_for_pipeline(step1Accepted.length),
        },
        summary: {
          accepted: step1Accepted.length,
          rejected: step1Rejected.length,
          rejectionSummary,
        },
        accepted: step1Accepted.slice(0, 10),
        rejected: step1Rejected.slice(0, 20),
        step2_live: step2Live,
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

function localResults_count_for_pipeline(count: number): string {
  return count < 10 ? `Yes (only ${count} local results < 10)` : `No (${count} local results >= 10)`;
}
