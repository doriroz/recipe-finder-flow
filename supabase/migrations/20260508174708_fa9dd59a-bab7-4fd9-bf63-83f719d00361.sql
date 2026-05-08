
-- Allow admins to update and delete ingredients
CREATE POLICY "Admins can update ingredients"
ON public.ingredients
FOR UPDATE
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can delete ingredients"
ON public.ingredients
FOR DELETE
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));
