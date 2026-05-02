CREATE TABLE public.v2_cookbook_recipes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  title text NOT NULL,
  description text,
  story text,
  ingredients jsonb NOT NULL DEFAULT '[]'::jsonb,
  instructions jsonb NOT NULL DEFAULT '[]'::jsonb,
  cooking_time integer,
  difficulty text,
  source text NOT NULL DEFAULT 'ai',
  source_label text,
  heritage_image_url text,
  ocr_text text,
  cuisine_category text,
  tips jsonb DEFAULT '[]'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_v2_cookbook_recipes_user_id ON public.v2_cookbook_recipes(user_id);
CREATE INDEX idx_v2_cookbook_recipes_user_created ON public.v2_cookbook_recipes(user_id, created_at DESC);

ALTER TABLE public.v2_cookbook_recipes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own v2 cookbook recipes"
  ON public.v2_cookbook_recipes FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own v2 cookbook recipes"
  ON public.v2_cookbook_recipes FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own v2 cookbook recipes"
  ON public.v2_cookbook_recipes FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own v2 cookbook recipes"
  ON public.v2_cookbook_recipes FOR DELETE
  USING (auth.uid() = user_id);

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER update_v2_cookbook_recipes_updated_at
  BEFORE UPDATE ON public.v2_cookbook_recipes
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();