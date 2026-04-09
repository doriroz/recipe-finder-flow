import { corsHeaders } from "https://deno.land/x/cors@v1.2.2/mod.ts";

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: CORS });
  }

  try {
    const { ingredientNames } = await req.json();

    if (!ingredientNames || !Array.isArray(ingredientNames) || ingredientNames.length === 0) {
      return new Response(JSON.stringify({ error: "ingredientNames array required" }), {
        status: 400,
        headers: { ...CORS, "Content-Type": "application/json" },
      });
    }

    const apiKey = Deno.env.get("SPOONACULAR_API_KEY");
    if (!apiKey) {
      return new Response(JSON.stringify({ error: "SPOONACULAR_API_KEY not configured" }), {
        status: 500,
        headers: { ...CORS, "Content-Type": "application/json" },
      });
    }

    // Call Spoonacular findByIngredients to discover what pairs well
    const ingredientsParam = ingredientNames.join(",");
    const url = `https://api.spoonacular.com/recipes/findByIngredients?ingredients=${encodeURIComponent(ingredientsParam)}&number=5&ranking=2&ignorePantry=true&apiKey=${apiKey}`;

    const response = await fetch(url);
    if (!response.ok) {
      const text = await response.text();
      console.error("Spoonacular error:", response.status, text);
      return new Response(JSON.stringify({ error: "Spoonacular API error", status: response.status }), {
        status: 502,
        headers: { ...CORS, "Content-Type": "application/json" },
      });
    }

    const recipes = await response.json();

    // Extract all "missed" and "used" ingredient names to find related categories
    const relatedIngredients = new Set<string>();
    for (const recipe of recipes) {
      for (const ing of (recipe.missedIngredients || [])) {
        relatedIngredients.add(ing.name?.toLowerCase());
      }
      for (const ing of (recipe.usedIngredients || [])) {
        relatedIngredients.add(ing.name?.toLowerCase());
      }
    }

    // Also extract aisle info (category hints) from missed ingredients
    const aisles = new Set<string>();
    for (const recipe of recipes) {
      for (const ing of (recipe.missedIngredients || [])) {
        if (ing.aisle) aisles.add(ing.aisle);
      }
    }

    return new Response(
      JSON.stringify({
        relatedIngredients: Array.from(relatedIngredients),
        aisles: Array.from(aisles),
        recipeCount: recipes.length,
      }),
      { headers: { ...CORS, "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("Error in ingredient-pairings:", err);
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...CORS, "Content-Type": "application/json" },
    });
  }
});
