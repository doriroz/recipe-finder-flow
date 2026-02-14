
-- Create recipe_ratings table for feedback loop
CREATE TABLE public.recipe_ratings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  recipe_id UUID REFERENCES public.recipes(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.recipe_ratings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own ratings"
  ON public.recipe_ratings FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own ratings"
  ON public.recipe_ratings FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own ratings"
  ON public.recipe_ratings FOR UPDATE
  USING (auth.uid() = user_id);

-- Add unique constraint so one rating per user per recipe
CREATE UNIQUE INDEX idx_recipe_ratings_unique ON public.recipe_ratings(recipe_id, user_id);
