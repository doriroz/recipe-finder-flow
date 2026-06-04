import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const userClient = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } },
    );

    const token = authHeader.replace("Bearer ", "");
    const { data: claims, error: claimsError } = await userClient.auth.getClaims(token);
    if (claimsError || !claims?.claims) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const callerId = claims.claims.sub;

    const admin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    const { data: roleRow } = await admin
      .from("user_roles")
      .select("role")
      .eq("user_id", callerId)
      .eq("role", "admin")
      .maybeSingle();

    if (!roleRow) {
      return new Response(JSON.stringify({ error: "פעולה זו זמינה למנהלי מערכת בלבד" }), {
        status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const body = await req.json().catch(() => ({}));
    const { user_id, new_credit_amount, mode } = body as {
      user_id?: string; new_credit_amount?: number; mode?: "set" | "add";
    };

    if (!user_id || typeof new_credit_amount !== "number" || !Number.isFinite(new_credit_amount)) {
      return new Response(JSON.stringify({ error: "Invalid arguments" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Ensure row exists
    await admin.from("user_credits").upsert(
      { user_id, credits_remaining: 0 },
      { onConflict: "user_id", ignoreDuplicates: true },
    );

    let newValue = new_credit_amount;
    if (mode === "add") {
      const { data: cur } = await admin
        .from("user_credits").select("credits_remaining").eq("user_id", user_id).single();
      newValue = (cur?.credits_remaining ?? 0) + new_credit_amount;
    }
    if (newValue < 0) newValue = 0;

    const { data, error } = await admin
      .from("user_credits")
      .update({ credits_remaining: newValue, updated_at: new Date().toISOString() })
      .eq("user_id", user_id)
      .select("credits_remaining")
      .single();

    if (error) {
      return new Response(JSON.stringify({ error: error.message }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ success: true, credits_remaining: data.credits_remaining }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("admin-update-credits error:", err);
    return new Response(JSON.stringify({ error: "שגיאה בלתי צפויה" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});