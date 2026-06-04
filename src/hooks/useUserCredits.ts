import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

export interface UserCredits {
  credits_remaining: number;
  daily_ai_calls: number;
  total_ai_calls: number;
  total_local_matches: number;
}

export const USER_CREDITS_QUERY_KEY = ["user-credits"] as const;

export const useUserCredits = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const query = useQuery<UserCredits | null>({
    queryKey: [...USER_CREDITS_QUERY_KEY, user?.id],
    enabled: !!user,
    staleTime: 30_000,
    queryFn: async () => {
      if (!user) return null;

      // Ensure a row exists (auto-provisions 5 credits on first call)
      await supabase.rpc("check_user_credits" as any, { _user_id: user.id });

      const { data, error } = await supabase
        .from("user_credits" as any)
        .select("credits_remaining, daily_ai_calls, total_ai_calls, total_local_matches")
        .eq("user_id", user.id)
        .single();

      if (error) {
        console.error("Error fetching credits:", error);
        return { credits_remaining: 0, daily_ai_calls: 0, total_ai_calls: 0, total_local_matches: 0 };
      }
      return data as unknown as UserCredits;
    },
  });

  return {
    credits: query.data ?? null,
    loading: query.isLoading,
    refetch: () => queryClient.invalidateQueries({ queryKey: USER_CREDITS_QUERY_KEY }),
  };
};
