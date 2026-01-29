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
}

serve(async (req) => {
  // Handle CORS preflight
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

    // Get Gemini API key
    const GEMINI_API_KEY = Deno.env.get("GEMINI_API_KEY");
    if (!GEMINI_API_KEY) {
      throw new Error("GEMINI_API_KEY is not configured");
    }

    // Initialize Supabase client with user's auth
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

    // Parse request body
    const { ingredients, imageBase64 } = await req.json();

    if (!ingredients && !imageBase64) {
      return new Response(
        JSON.stringify({ error: "Either ingredients or imageBase64 is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Build the prompt
    const systemPrompt = `אתה שף מקצועי שמתמחה במתכונים למתחילים. 
בהתבסס על המצרכים שניתנו, ספק מתכון בפורמט JSON בלבד.
הפורמט צריך להיות בדיוק כזה:
{
  "title": "שם המתכון בעברית",
  "ingredients": [{"name": "שם המצרך", "amount": "כמות", "unit": "יחידה"}],
  "instructions": ["שלב 1", "שלב 2", "שלב 3"],
  "substitutions": [{"original": "מצרך מקורי", "alternative": "תחליף אפשרי", "reason": "הסבר"}],
  "cooking_time": 30
}
השפה חייבת להיות עברית בלבד.
החזר רק את ה-JSON, ללא טקסט נוסף.`;

    let userContent: any[];

    if (imageBase64) {
      // Multimodal request with image
      userContent = [
        {
          type: "text",
          text: "נתח את התמונה וזהה את המצרכים. לאחר מכן צור מתכון בהתבסס על מה שאתה רואה.",
        },
        {
          type: "image_url",
          image_url: {
            url: imageBase64.startsWith("data:") 
              ? imageBase64 
              : `data:image/jpeg;base64,${imageBase64}`,
          },
        },
      ];
    } else {
      // Text-only request with ingredients list
      const ingredientsList = Array.isArray(ingredients) 
        ? ingredients.map((i: any) => typeof i === 'string' ? i : i.name).join(", ")
        : ingredients;
      
      userContent = [
        {
          type: "text",
          text: `המצרכים הזמינים: ${ingredientsList}`,
        },
      ];
    }

    // Call Gemini API (using OpenAI-compatible endpoint)
    const geminiResponse = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/openai/chat/completions`,
      {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${GEMINI_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "gemini-2.0-flash",
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: userContent },
          ],
          temperature: 0.7,
          max_tokens: 2048,
        }),
      }
    );

    if (!geminiResponse.ok) {
      const errorText = await geminiResponse.text();
      console.error("Gemini API error:", geminiResponse.status, errorText);
      throw new Error(`Gemini API error: ${geminiResponse.status}`);
    }

    const geminiData = await geminiResponse.json();
    const content = geminiData.choices?.[0]?.message?.content;

    if (!content) {
      throw new Error("No content returned from Gemini");
    }

    // Parse JSON from response (handle potential markdown code blocks)
    let recipeJson: RecipeResponse;
    try {
      // Try to extract JSON from markdown code block if present
      const jsonMatch = content.match(/```(?:json)?\s*([\s\S]*?)```/);
      const jsonString = jsonMatch ? jsonMatch[1].trim() : content.trim();
      recipeJson = JSON.parse(jsonString);
    } catch (parseError) {
      console.error("Failed to parse recipe JSON:", content);
      throw new Error("Failed to parse recipe from AI response");
    }

    // Validate required fields
    if (!recipeJson.title || !recipeJson.ingredients || !recipeJson.instructions) {
      throw new Error("Invalid recipe structure from AI");
    }

    // Insert into recipes table
    const { data: insertedRecipe, error: insertError } = await supabase
      .from("recipes")
      .insert({
        title: recipeJson.title,
        ingredients: recipeJson.ingredients,
        instructions: recipeJson.instructions,
        substitutions: recipeJson.substitutions || [],
        cooking_time: recipeJson.cooking_time || null,
        user_id: userId,
      })
      .select()
      .single();

    if (insertError) {
      console.error("Database insert error:", insertError);
      throw new Error(`Failed to save recipe: ${insertError.message}`);
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        recipe: insertedRecipe,
        message: "המתכון נוצר ונשמר בהצלחה!" 
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, "Content-Type": "application/json" } 
      }
    );

  } catch (error) {
    console.error("Edge function error:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error occurred";
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { 
        status: 500, 
        headers: { ...corsHeaders, "Content-Type": "application/json" } 
      }
    );
  }
});
