
-- Fix ai_usage_logs insert policy to require auth context
DROP POLICY "Anyone can insert ai logs" ON public.ai_usage_logs;
CREATE POLICY "Service and authenticated can insert ai logs" ON public.ai_usage_logs FOR INSERT WITH CHECK (auth.uid() IS NOT NULL OR user_id IS NULL);
