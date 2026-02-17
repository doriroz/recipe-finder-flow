import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

interface UserCredits {
  credits_remaining: number;
  daily_ai_calls: number;
  total_ai_calls: number;
  total_local_matches: number;
}

export const useUserCredits = () => {
  const { user } = useAuth();
  const [credits, setCredits] = useState<UserCredits | null>(null);
  const [loading, setLoading] = useState(false);

  const fetchCredits = useCallback(async () => {
    if (!user) {
      setCredits(null);
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("user_credits" as any)
        .select("credits_remaining, daily_ai_calls, total_ai_calls, total_local_matches")
        .eq("user_id", user.id)
        .single();

      if (error && error.code === "PGRST116") {
        // No record yet — will be created on first AI call
        setCredits({ credits_remaining: 10, daily_ai_calls: 0, total_ai_calls: 0, total_local_matches: 0 });
      } else if (data) {
        setCredits(data as any);
      }
    } catch (err) {
      console.error("Error fetching credits:", err);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchCredits();
  }, [fetchCredits]);

  return { credits, loading, refetch: fetchCredits };
};
