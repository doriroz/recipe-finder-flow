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

    // Call Spoonacular findByIngredients to discover what pairs well.
    // ranking=1 maximizes used ingredients (=> most relevant pairings appear in missedIngredients).
    const ingredientsParam = ingredientNames.join(",");
    const url = `https://api.spoonacular.com/recipes/findByIngredients?ingredients=${encodeURIComponent(ingredientsParam)}&number=10&ranking=1&ignorePantry=true&apiKey=${apiKey}`;

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

    // Count frequency of each "missed" ingredient across all recipes => most-paired items rise to top.
    const pairingCounts = new Map<string, { name: string; count: number; aisle?: string }>();
    const submitted = new Set(ingredientNames.map((n: string) => n.toLowerCase()));

    for (const recipe of recipes) {
      for (const ing of (recipe.missedIngredients || [])) {
        const rawName = (ing.name || "").toLowerCase().trim();
        if (!rawName || submitted.has(rawName)) continue;
        const existing = pairingCounts.get(rawName);
        if (existing) {
          existing.count += 1;
        } else {
          pairingCounts.set(rawName, { name: rawName, count: 1, aisle: ing.aisle });
        }
      }
    }

    // Sort by frequency desc
    const pairings = Array.from(pairingCounts.values())
      .sort((a, b) => b.count - a.count)
      .slice(0, 30);

    return new Response(
      JSON.stringify({
        pairings, // [{ name, count, aisle }]
        recipeCount: recipes.length,
      }),
      { headers: { ...CORS, "Content-Type": "application/json" } }
    );
  } catch (err: unknown) {
    console.error("Error in ingredient-pairings:", err);
    const message = err instanceof Error ? err.message : "Unknown error";
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...CORS, "Content-Type": "application/json" },
    });
  }
});
