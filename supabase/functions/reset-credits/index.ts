import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

Deno.serve(async (req) => {
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

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );

    const token = authHeader.replace("Bearer ", "");
    const { data: claimsData, error: claimsError } = await supabase.auth.getClaims(token);
    if (claimsError || !claimsData?.claims) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const userId = claimsData.claims.sub;

    // Use service role for both the admin-role check and the reset itself
    const adminClient = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // ADMIN-ONLY: verify caller has the 'admin' role before resetting credits
    const { data: roleRow, error: roleErr } = await adminClient
      .from("user_roles")
      .select("role")
      .eq("user_id", userId)
      .eq("role", "admin")
      .maybeSingle();

    if (roleErr || !roleRow) {
      return new Response(
        JSON.stringify({ error: "פעולה זו זמינה למנהלי מערכת בלבד" }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Optional: admin may pass targetUserId to reset another user's credits
    let targetUserId = userId;
    try {
      if (req.headers.get("content-type")?.includes("application/json")) {
        const body = await req.json().catch(() => ({}));
        if (body?.targetUserId && typeof body.targetUserId === "string") {
          targetUserId = body.targetUserId;
        }
      }
    } catch { /* ignore */ }

    const { data, error } = await adminClient
      .from("user_credits")
      .update({ credits_remaining: 5, daily_ai_calls: 0 })
      .eq("user_id", targetUserId)
      .select("credits_remaining")
      .single();

    if (error) {
      // If no row exists, insert one
      if (error.code === "PGRST116") {
        const { data: inserted, error: insertErr } = await adminClient
          .from("user_credits")
          .insert({ user_id: targetUserId, credits_remaining: 5 })
          .select("credits_remaining")
          .single();

        if (insertErr) {
          return new Response(JSON.stringify({ error: "שגיאה באיפוס הקרדיטים" }), {
            status: 500,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }

        return new Response(JSON.stringify({ success: true, credits_remaining: inserted.credits_remaining }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      return new Response(JSON.stringify({ error: "שגיאה באיפוס הקרדיטים" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ success: true, credits_remaining: data.credits_remaining }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("Reset credits error:", err);
    return new Response(JSON.stringify({ error: "שגיאה בלתי צפויה" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
