import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
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

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;

    // Verify user
    const userClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    });
    const token = authHeader.replace("Bearer ", "");
    const { data: claimsData, error: claimsError } = await userClient.auth.getClaims(token);
    if (claimsError || !claimsData?.claims) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const userId = claimsData.claims.sub;

    // Check admin role using service role client
    const adminClient = createClient(supabaseUrl, supabaseServiceKey);
    const { data: roleData } = await adminClient
      .from("user_roles")
      .select("role")
      .eq("user_id", userId)
      .eq("role", "admin")
      .maybeSingle();

    if (!roleData) {
      return new Response(JSON.stringify({ error: "Forbidden" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Check if dashboard is enabled
    const { data: settingData } = await adminClient
      .from("app_settings")
      .select("value")
      .eq("key", "analytics_dashboard_enabled")
      .single();

    if (settingData?.value === false || settingData?.value === "false") {
      return new Response(JSON.stringify({ disabled: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Fetch analytics data
    const { data: events } = await adminClient
      .from("analytics_events")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(1000);

    const allEvents = events || [];

    // Summary
    const totalEvents = allEvents.length;
    const uniqueUsers = new Set(allEvents.filter(e => e.user_id).map(e => e.user_id)).size;
    const pdfDownloads = allEvents.filter(e => e.event_name === "cookbook_pdf_downloaded").length;
    const checkoutOpened = allEvents.filter(e => e.event_name === "cookbook_checkout_opened").length;
    const conversionRate = checkoutOpened > 0 ? Math.round((pdfDownloads / checkoutOpened) * 100) : 0;

    // By event
    const byEvent: Record<string, number> = {};
    allEvents.forEach(e => {
      byEvent[e.event_name] = (byEvent[e.event_name] || 0) + 1;
    });

    // Daily
    const dailyMap: Record<string, number> = {};
    allEvents.forEach(e => {
      const day = e.created_at.substring(0, 10);
      dailyMap[day] = (dailyMap[day] || 0) + 1;
    });
    const daily = Object.entries(dailyMap)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, count]) => ({ date, count }));

    return new Response(
      JSON.stringify({
        disabled: false,
        summary: { totalEvents, uniqueUsers, pdfDownloads, conversionRate },
        byEvent,
        daily,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
