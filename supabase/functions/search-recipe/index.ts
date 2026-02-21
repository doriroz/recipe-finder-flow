import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

interface RecipeResult {
  id: string;
  title: string;
  ingredients: { name: string; amount?: string; unit?: string }[];
  instructions: string[];
  substitutions: { original: string; alternative: string; reason: string }[] | null;
  cooking_time: number | null;
  difficulty: string;
  source: "existing" | "generated";
}

// Estimate difficulty based on cooking time and instruction count
function estimateDifficulty(cookingTime: number | null, instructionCount: number): string {
  const time = cookingTime || 30;
  if (time <= 15 && instructionCount <= 5) return "קל";
  if (time <= 30 && instructionCount <= 8) return "בינוני";
  return "מאתגר";
}

function getDifficultyOrder(difficulty: string): number {
  switch (difficulty) {
    case "קל": return 1;
    case "בינוני": return 2;
    case "מאתגר": return 3;
    default: return 2;
  }
}

// Translate text via MyMemory API (free, no key needed)
// Falls back to original text on any failure
async function translateText(text: string, langpair: string): Promise<string> {
  try {
    const url = new URL("https://api.mymemory.translated.net/get");
    // MyMemory has a ~500 char limit per call; truncate if needed
    const truncated = text.length > 490 ? text.substring(0, 490) : text;
    url.searchParams.set("q", truncated);
    url.searchParams.set("langpair", langpair);
    const res = await fetch(url.toString());
    if (res.ok) {
      const data = await res.json();
      if (data.responseStatus === 200 && data.responseData?.translatedText) {
        return data.responseData.translatedText;
      }
    }
    return text; // fallback to original
  } catch {
    return text; // fallback to original
  }
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Validate auth
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );

    // Validate user
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const userId = user.id;

    const { query } = await req.json();
    
    if (!query || typeof query !== "string" || query.trim().length < 2) {
      return new Response(
        JSON.stringify({ error: "Search query must be at least 2 characters" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const searchTerm = query.trim();
    const results: RecipeResult[] = [];

    // Step 1: Search existing user recipes
    const { data: existingRecipes, error: searchError } = await supabase
      .from("recipes")
      .select("*")
      .eq("user_id", userId)
      .ilike("title", `%${searchTerm}%`)
      .limit(5);

    if (searchError) {
      console.error("Search error:", searchError);
    } else if (existingRecipes && existingRecipes.length > 0) {
      for (const recipe of existingRecipes) {
        const instructions = recipe.instructions || [];
        results.push({
          id: recipe.id,
          title: recipe.title,
          ingredients: recipe.ingredients as any[],
          instructions,
          substitutions: recipe.substitutions as any[] | null,
          cooking_time: recipe.cooking_time,
          difficulty: estimateDifficulty(recipe.cooking_time, instructions.length),
          source: "existing",
        });
      }
    }

    // Step 2: If we have less than 3 results, fetch from Spoonacular + translate
    if (results.length < 3) {
      const SPOONACULAR_API_KEY = Deno.env.get("SPOONACULAR_API_KEY");
      if (!SPOONACULAR_API_KEY) {
        console.warn("SPOONACULAR_API_KEY not configured, skipping external search");
      } else {
        try {
          // Translate Hebrew search term to English for Spoonacular
          const englishQuery = await translateText(searchTerm, "he|en");

          const needed = 3 - results.length;
          const spoonUrl = new URL("https://api.spoonacular.com/recipes/complexSearch");
          spoonUrl.searchParams.set("query", englishQuery);
          spoonUrl.searchParams.set("number", String(needed));
          spoonUrl.searchParams.set("addRecipeInformation", "true");
          spoonUrl.searchParams.set("fillIngredients", "true");
          spoonUrl.searchParams.set("instructionsRequired", "true");
          spoonUrl.searchParams.set("apiKey", SPOONACULAR_API_KEY);

          const spoonRes = await fetch(spoonUrl.toString());
          if (spoonRes.ok) {
            const spoonData = await spoonRes.json();
            const spoonRecipes = spoonData.results || [];

            for (const sr of spoonRecipes) {
              // Gather all translatable strings into one batch
              const ingredientNames: string[] = (sr.extendedIngredients || []).map((i: any) => i.name || i.originalName || "");
              const steps: string[] = (sr.analyzedInstructions?.[0]?.steps || []).map((s: any) => s.step || "");
              // Translate each string individually for reliability
              const allTexts = [sr.title, ...ingredientNames, ...steps];
              const translatedAll: string[] = [];
              for (const t of allTexts) {
                translatedAll.push(await translateText(t, "en|he"));
              }

              const translatedTitle = translatedAll[0] || sr.title;
              const translatedIngredients = ingredientNames.map((orig, idx) => translatedAll[1 + idx] || orig);
              const translatedSteps = steps.map((orig, idx) => translatedAll[1 + ingredientNames.length + idx] || orig);

              const ingredients = (sr.extendedIngredients || []).map((ing: any, idx: number) => ({
                name: translatedIngredients[idx] || ing.name,
                amount: ing.amount ? String(ing.amount) : undefined,
                unit: ing.unit || undefined,
              }));

              const cookingTime = sr.readyInMinutes || null;
              const difficulty = estimateDifficulty(cookingTime, translatedSteps.length);

              // Look up substitutions from DB
              const hebrewIngNames = ingredients.map((i: any) => i.name);
              let searchSubstitutions: any[] | null = null;
              try {
                const { data: allSubs } = await supabase
                  .from("ingredient_substitutions")
                  .select("original_ingredient, alternative_ingredient, reason")
                  .eq("is_valid", true);
                if (allSubs && allSubs.length > 0) {
                  const matched: any[] = [];
                  for (const ingName of hebrewIngNames) {
                    for (const sub of allSubs) {
                      if (ingName.includes(sub.original_ingredient) || sub.original_ingredient.includes(ingName)) {
                        matched.push({ original: sub.original_ingredient, alternative: sub.alternative_ingredient, reason: sub.reason });
                      }
                    }
                  }
                  const unique = matched.filter((m, i, arr) => arr.findIndex(x => x.original === m.original && x.alternative === m.alternative) === i);
                  if (unique.length > 0) searchSubstitutions = unique.slice(0, 4);
                }
              } catch (subErr) {
                console.error("Substitution lookup error:", subErr);
              }

              results.push({
                id: `generated-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
                title: translatedTitle,
                ingredients,
                instructions: translatedSteps.length > 0 ? translatedSteps : ["No instructions available"],
                substitutions: searchSubstitutions,
                cooking_time: cookingTime,
                difficulty,
                source: "generated",
              });
            }
          } else {
            console.error("Spoonacular error:", spoonRes.status, await spoonRes.text());
          }
        } catch (spoonError) {
          console.error("Spoonacular/translation error:", spoonError);
        }
      }
    }

    // Sort by difficulty (easy first)
    results.sort((a, b) => getDifficultyOrder(a.difficulty) - getDifficultyOrder(b.difficulty));

    return new Response(
      JSON.stringify({ results, query: searchTerm }),
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
