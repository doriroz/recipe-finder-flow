import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

const MAX_DAILY_TRIES = 3;

export const useDailyTries = () => {
  const { user } = useAuth();
  const [usedToday, setUsedToday] = useState(0);
  const [loading, setLoading] = useState(false);

  const fetchUsage = useCallback(async () => {
    if (!user) { setUsedToday(0); return; }
    setLoading(true);
    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const { count, error } = await supabase
        .from("ai_usage_logs" as any)
        .select("*", { count: "exact", head: true })
        .eq("user_id", user.id)
        .eq("action_type", "recipe_generation")
        .gte("created_at", today.toISOString());

      if (!error && count !== null) {
        setUsedToday(count);
      }
    } catch (err) {
      console.error("Error fetching daily tries:", err);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => { fetchUsage(); }, [fetchUsage]);

  const remaining = Math.max(0, MAX_DAILY_TRIES - usedToday);

  return { remaining, maxTries: MAX_DAILY_TRIES, usedToday, loading, refetch: fetchUsage };
};
