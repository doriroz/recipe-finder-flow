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

// MyMemory for Hebrew→English only (short search terms)
async function translateText(text: string, langpair: string): Promise<string> {
  try {
    const truncated = text.length > 490 ? text.substring(0, 490) : text;
    const url = new URL("https://api.mymemory.translated.net/get");
    url.searchParams.set("q", truncated);
    url.searchParams.set("langpair", langpair);
    const res = await fetch(url.toString());
    if (res.ok) {
      const data = await res.json();
      if (data.responseStatus === 200 && data.responseData?.translatedText) {
        return data.responseData.translatedText;
      }
    }
    return text;
  } catch {
    return text;
  }
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

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );

    // Service role client for translation cache
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

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

    // Step 2: If less than 3 results, fetch from Spoonacular + AI translate
    if (results.length < 3) {
      const SPOONACULAR_API_KEY = Deno.env.get("SPOONACULAR_API_KEY");
      if (!SPOONACULAR_API_KEY) {
        console.warn("SPOONACULAR_API_KEY not configured, skipping external search");
      } else if (!LOVABLE_API_KEY) {
        console.warn("LOVABLE_API_KEY not configured, skipping translation");
      } else {
        try {
          // Translate Hebrew search term to English (MyMemory, fine for short terms)
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
              const ingredientData = (sr.extendedIngredients || []).map((i: any) => ({
                name: i.name || i.originalName || "",
                unit: i.unit || "",
              }));
              const steps: string[] = (sr.analyzedInstructions?.[0]?.steps || []).map((s: any) => s.step || "");

              // AI translate with DB cache
              const translated = await translateRecipeWithAI(
                LOVABLE_API_KEY,
                supabaseAdmin,
                sr.title,
                ingredientData,
                steps
              );

              const ingredients = (sr.extendedIngredients || []).map((ing: any, idx: number) => ({
                name: translated.ingredientNames[idx] || ing.name,
                amount: ing.amount ? String(ing.amount) : undefined,
                unit: translated.units[idx] || undefined,
              }));

              const cookingTime = sr.readyInMinutes || null;
              const difficulty = estimateDifficulty(cookingTime, translated.steps.length);

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
                title: translated.title,
                ingredients,
                instructions: translated.steps.length > 0 ? translated.steps : ["No instructions available"],
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
