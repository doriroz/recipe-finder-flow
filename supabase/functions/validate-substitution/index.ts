import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

interface ValidationResult {
  isValid: boolean;
  confidence: "high" | "medium" | "low";
  explanation: string;
  tips?: string;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { originalIngredient, suggestedReplacement, recipeTitle, recipeContext } = await req.json();

    if (!originalIngredient || !suggestedReplacement) {
      return new Response(
        JSON.stringify({ error: "נדרש מצרך מקורי ותחליף מוצע" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      return new Response(
        JSON.stringify({ error: "AI service not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const systemPrompt = `אתה שף מומחה ויועץ קולינרי. המשימה שלך היא להעריך האם החלפת מצרך אחד באחר תעבוד במתכון נתון.

עליך להחזיר JSON בלבד בפורמט הבא:
{
  "isValid": true/false,
  "confidence": "high"/"medium"/"low",
  "explanation": "הסבר קצר בעברית למה ההחלפה תעבוד או לא",
  "tips": "טיפ אופציונלי לשיפור ההחלפה (רק אם רלוונטי)"
}

קריטריונים להערכה:
- טעם: האם הטעם ישתנה באופן משמעותי?
- מרקם: האם המרקם הסופי יושפע?
- תפקוד: האם המצרך החדש ממלא את אותו תפקיד (קשירה, תפיחה, לחות וכו')?
- בישול: האם נדרשים שינויים בזמן או טמפרטורת הבישול?

החזר רק JSON, ללא טקסט נוסף.`;

    const userPrompt = `מתכון: ${recipeTitle || "לא צוין"}
${recipeContext ? `הקשר נוסף: ${recipeContext}` : ""}

מצרך מקורי: ${originalIngredient}
תחליף מוצע: ${suggestedReplacement}

האם ההחלפה הזו תעבוד?`;

    const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        temperature: 0.3,
        max_tokens: 500,
      }),
    });

    if (!aiResponse.ok) {
      if (aiResponse.status === 429) {
        return new Response(
          JSON.stringify({ error: "יותר מדי בקשות, נסה שוב בעוד כמה שניות" }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (aiResponse.status === 402) {
        return new Response(
          JSON.stringify({ error: "נדרש תשלום לשימוש בשירות" }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      throw new Error(`AI response error: ${aiResponse.status}`);
    }

    const aiData = await aiResponse.json();
    const content = aiData.choices?.[0]?.message?.content;

    if (!content) {
      throw new Error("No content in AI response");
    }

    // Parse JSON from response
    const jsonMatch = content.match(/```(?:json)?\s*([\s\S]*?)```/);
    const jsonString = jsonMatch ? jsonMatch[1].trim() : content.trim();
    const result: ValidationResult = JSON.parse(jsonString);

    return new Response(
      JSON.stringify({ success: true, result }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("Validation error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "שגיאה בבדיקת ההחלפה" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
