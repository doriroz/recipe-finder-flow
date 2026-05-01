import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { z } from "https://esm.sh/zod@3.23.8";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const BodySchema = z.object({
  email: z.string().trim().email().max(255),
  password: z.string().min(6).max(72),
});

function json(status: number, body: unknown) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return json(405, { error: "Method not allowed" });
  }

  try {
    const raw = await req.json().catch(() => null);
    const parsed = BodySchema.safeParse(raw);
    if (!parsed.success) {
      return json(400, { error: "האימייל או הסיסמה לא תקינים. הסיסמה חייבת להכיל לפחות 6 תווים." });
    }
    const { email, password } = parsed.data;

    const admin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    const { data, error } = await admin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
    });

    if (error) {
      const msg = (error.message || "").toLowerCase();
      console.error("signup createUser error:", error);

      if (msg.includes("already") || msg.includes("registered") || msg.includes("exists") || msg.includes("duplicate")) {
        return json(409, { error: "כבר קיים חשבון עם אימייל זה. נסה להתחבר." });
      }
      if (msg.includes("password")) {
        return json(400, { error: "הסיסמה חייבת להכיל לפחות 6 תווים." });
      }
      if (msg.includes("email") && msg.includes("invalid")) {
        return json(400, { error: "כתובת האימייל אינה תקינה." });
      }
      return json(500, { error: "משהו השתבש בהרשמה. נסה שוב בעוד רגע." });
    }

    return json(200, { success: true, user_id: data.user?.id ?? null });
  } catch (err) {
    console.error("signup unexpected error:", err);
    return json(500, { error: "שגיאה בלתי צפויה. נסה שוב." });
  }
});
