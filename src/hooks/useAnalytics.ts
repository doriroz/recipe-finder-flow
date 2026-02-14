import { useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";

export const useAnalytics = () => {
  const track = useCallback(async (eventName: string, eventData?: Record<string, unknown>) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      await supabase.from("analytics_events" as any).insert({
        user_id: user?.id || null,
        event_name: eventName,
        event_data: eventData || {},
      });
    } catch (err) {
      console.error("Analytics track error:", err);
    }
  }, []);

  return { track };
};
