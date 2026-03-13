-- Add DELETE policy on recipes so users can delete their own recipes
CREATE POLICY "Users can delete their own recipes"
ON public.recipes
FOR DELETE
USING (auth.uid() = user_id);