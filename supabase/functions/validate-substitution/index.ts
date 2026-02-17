import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

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

    // Service role client for reading substitutions table (public read)
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // ---- STEP 1: Check local substitutions table first ----
    const { data: localSub } = await supabaseAdmin
      .from("ingredient_substitutions")
      .select("*")
      .eq("original_ingredient", originalIngredient)
      .eq("alternative_ingredient", suggestedReplacement)
      .single();

    if (localSub) {
      console.log("Substitution found in local table:", localSub);

      // Log as local usage (0 credits)
      const authHeader = req.headers.get("Authorization");
      if (authHeader) {
        const supabaseUser = createClient(
          Deno.env.get("SUPABASE_URL")!,
          Deno.env.get("SUPABASE_ANON_KEY")!,
          { global: { headers: { Authorization: authHeader } } }
        );
        const token = authHeader.replace("Bearer ", "");
        const { data: claims } = await supabaseUser.auth.getClaims(token);
        if (claims?.claims?.sub) {
          await supabaseAdmin.from("ai_usage_logs").insert({
            user_id: claims.claims.sub,
            action_type: "substitution_validation",
            tokens_estimated: 0,
            credits_used: 0,
            source: "local",
          });
        }
      }

      return new Response(
        JSON.stringify({
          success: true,
          result: {
            isValid: localSub.is_valid,
            confidence: localSub.confidence,
            explanation: localSub.reason,
            tips: localSub.tips || undefined,
          },
          source: "local",
        }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Also check reverse direction
    const { data: reverseSub } = await supabaseAdmin
      .from("ingredient_substitutions")
      .select("*")
      .eq("original_ingredient", suggestedReplacement)
      .eq("alternative_ingredient", originalIngredient)
      .single();

    if (reverseSub) {
      console.log("Reverse substitution found:", reverseSub);
      return new Response(
        JSON.stringify({
          success: true,
          result: {
            isValid: reverseSub.is_valid,
            confidence: reverseSub.confidence,
            explanation: reverseSub.reason,
            tips: reverseSub.tips || undefined,
          },
          source: "local",
        }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // ---- STEP 2: AI fallback (short explanation only, 1 credit) ----
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      return new Response(
        JSON.stringify({ error: "AI service not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Check credits if authenticated
    const authHeader = req.headers.get("Authorization");
    let userId: string | null = null;
    if (authHeader?.startsWith("Bearer ")) {
      const supabaseUser = createClient(
        Deno.env.get("SUPABASE_URL")!,
        Deno.env.get("SUPABASE_ANON_KEY")!,
        { global: { headers: { Authorization: authHeader } } }
      );
      const token = authHeader.replace("Bearer ", "");
      const { data: claims } = await supabaseUser.auth.getClaims(token);
      userId = claims?.claims?.sub || null;

      if (userId) {
        // Check user credits (1 credit for substitution)
        let { data: userCredits } = await supabaseAdmin
          .from("user_credits")
          .select("credits_remaining")
          .eq("user_id", userId)
          .single();

        if (!userCredits) {
          await supabaseAdmin.from("user_credits").insert({ user_id: userId, credits_remaining: 10 });
          userCredits = { credits_remaining: 10 };
        }

        if (userCredits.credits_remaining < 1) {
          return new Response(
            JSON.stringify({ error: "אין מספיק קרדיטים לבדיקת החלפה" }),
            { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        // Deduct 1 credit
        await supabaseAdmin
          .from("user_credits")
          .update({ credits_remaining: userCredits.credits_remaining - 1 })
          .eq("user_id", userId);
      }
    }

    const systemPrompt = `אתה שף מומחה. העריך בקצרה האם ההחלפה תעבוד. החזר JSON בלבד:
{
  "isValid": true/false,
  "confidence": "high"/"medium"/"low",
  "explanation": "הסבר קצר בעברית (משפט אחד)",
  "tips": "טיפ קצר (אופציונלי)"
}
JSON בלבד.`;

    const userPrompt = `מצרך מקורי: ${originalIngredient}\nתחליף: ${suggestedReplacement}${recipeTitle ? `\nמתכון: ${recipeTitle}` : ""}`;

    const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${LOVABLE_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        temperature: 0.3,
        max_tokens: 200,
      }),
    });

    if (!aiResponse.ok) {
      if (aiResponse.status === 429) {
        return new Response(JSON.stringify({ error: "יותר מדי בקשות, נסה שוב" }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (aiResponse.status === 402) {
        return new Response(JSON.stringify({ error: "נדרש תשלום" }), {
          status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      throw new Error(`AI error: ${aiResponse.status}`);
    }

    const aiData = await aiResponse.json();
    const content = aiData.choices?.[0]?.message?.content;
    const jsonMatch = content?.match(/```(?:json)?\s*([\s\S]*?)```/);
    const jsonString = jsonMatch ? jsonMatch[1].trim() : content?.trim();
    const result = JSON.parse(jsonString);

    // Save result to substitutions table for future lookups
    await supabaseAdmin.from("ingredient_substitutions").upsert({
      original_ingredient: originalIngredient,
      alternative_ingredient: suggestedReplacement,
      reason: result.explanation,
      confidence: result.confidence,
      is_valid: result.isValid,
      tips: result.tips || null,
    }, { onConflict: "original_ingredient,alternative_ingredient" });

    // Log AI usage
    if (userId) {
      await supabaseAdmin.from("ai_usage_logs").insert({
        user_id: userId,
        action_type: "substitution_validation",
        tokens_estimated: 200,
        credits_used: 1,
        source: "ai",
      });
    }

    return new Response(
      JSON.stringify({ success: true, result, source: "ai" }),
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
