CREATE TABLE public.fridge_challenges (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  ingredient_names TEXT[] NOT NULL DEFAULT '{}',
  ingredient_emojis TEXT[] NOT NULL DEFAULT '{}',
  recipe_id UUID REFERENCES public.recipes(id) ON DELETE SET NULL,
  recipe_title TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.fridge_challenges ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own challenges" ON public.fridge_challenges FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own challenges" ON public.fridge_challenges FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete own challenges" ON public.fridge_challenges FOR DELETE TO authenticated USING (auth.uid() = user_id);