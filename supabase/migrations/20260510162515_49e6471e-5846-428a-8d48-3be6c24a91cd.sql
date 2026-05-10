ALTER TABLE public.ingredients
  ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'approved';

UPDATE public.ingredients SET status = 'approved' WHERE status IS NULL OR status = '';

ALTER TABLE public.ingredients
  DROP CONSTRAINT IF EXISTS ingredients_status_check;
ALTER TABLE public.ingredients
  ADD CONSTRAINT ingredients_status_check CHECK (status IN ('pending','approved'));

DROP POLICY IF EXISTS "Anyone can view ingredients" ON public.ingredients;

CREATE POLICY "View approved or admin sees all"
  ON public.ingredients
  FOR SELECT
  USING (
    status = 'approved'
    OR public.has_role(auth.uid(), 'admin'::public.app_role)
  );

CREATE INDEX IF NOT EXISTS ingredients_status_idx ON public.ingredients(status);