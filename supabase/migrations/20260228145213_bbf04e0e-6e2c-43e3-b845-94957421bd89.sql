
-- Migration: Add complexity to recipe_library, add is_staple and is_core_anchor to ingredients

-- 1. Add complexity field to recipe_library
ALTER TABLE public.recipe_library ADD COLUMN IF NOT EXISTS complexity TEXT DEFAULT 'Everyday';

-- 2. Mark recipes with 8+ ingredients or difficulty='high' as "Special"
UPDATE public.recipe_library 
SET complexity = 'Special' 
WHERE array_length(ingredient_names, 1) >= 8 OR difficulty = 'high';

-- 3. Add is_staple and is_core_anchor to ingredients table
ALTER TABLE public.ingredients ADD COLUMN IF NOT EXISTS is_staple BOOLEAN DEFAULT false;
ALTER TABLE public.ingredients ADD COLUMN IF NOT EXISTS is_core_anchor BOOLEAN DEFAULT false;

-- 4. Allow service role to insert into recipe_library (for saving Spoonacular recipes)
CREATE POLICY "Service role can insert into recipe_library"
ON public.recipe_library
FOR INSERT
WITH CHECK (true);

CREATE POLICY "Service role can update recipe_library"
ON public.recipe_library
FOR UPDATE
USING (true);
