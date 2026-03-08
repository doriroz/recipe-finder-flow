CREATE POLICY "Admins can delete ai logs"
ON public.ai_usage_logs
FOR DELETE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));