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
    const token = authHeader.replace("Bearer ", "");
    const { data: claimsData, error: claimsError } = await supabase.auth.getClaims(token);
    if (claimsError || !claimsData?.claims) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const userId = claimsData.claims.sub;

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

    // Step 2: If we have less than 3 results, generate with AI
    if (results.length < 3) {
      const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
      if (!LOVABLE_API_KEY) {
        console.warn("LOVABLE_API_KEY not configured, skipping AI generation");
      } else {
        const systemPrompt = `אתה שף מקצועי. בהתבסס על החיפוש, הצע ${3 - results.length} מתכונים ברמות קושי שונות.
החזר מערך JSON בלבד בפורמט הבא:
[{
  "title": "שם המתכון",
  "ingredients": [{"name": "מצרך", "amount": "כמות", "unit": "יחידה"}],
  "instructions": ["שלב 1", "שלב 2"],
  "substitutions": [{"original": "מצרך", "alternative": "תחליף", "reason": "סיבה"}],
  "cooking_time": 30,
  "difficulty": "קל/בינוני/מאתגר"
}]
השפה חייבת להיות עברית. החזר רק JSON ללא טקסט נוסף.`;

        try {
          const aiResponse = await fetch(
            "https://ai.gateway.lovable.dev/v1/chat/completions",
            {
              method: "POST",
              headers: {
                Authorization: `Bearer ${LOVABLE_API_KEY}`,
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                model: "google/gemini-3-flash-preview",
                messages: [
                  { role: "system", content: systemPrompt },
                  { role: "user", content: `חפש מתכונים עבור: ${searchTerm}` },
                ],
                temperature: 0.8,
                max_tokens: 3000,
              }),
            }
          );

          if (aiResponse.ok) {
            const aiData = await aiResponse.json();
            const content = aiData.choices?.[0]?.message?.content;

            if (content) {
              const jsonMatch = content.match(/```(?:json)?\s*([\s\S]*?)```/);
              const jsonString = jsonMatch ? jsonMatch[1].trim() : content.trim();
              const generatedRecipes = JSON.parse(jsonString);

              for (const recipe of generatedRecipes) {
                results.push({
                  id: `generated-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
                  title: recipe.title,
                  ingredients: recipe.ingredients,
                  instructions: recipe.instructions,
                  substitutions: recipe.substitutions || null,
                  cooking_time: recipe.cooking_time,
                  difficulty: recipe.difficulty || estimateDifficulty(recipe.cooking_time, recipe.instructions?.length || 5),
                  source: "generated",
                });
              }
            }
          }
        } catch (aiError) {
          console.error("AI generation error:", aiError);
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
