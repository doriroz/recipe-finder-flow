
-- Custom categories table (admin-managed)
CREATE TABLE public.custom_categories (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  emoji TEXT NOT NULL DEFAULT '🍽️',
  subtitle TEXT NOT NULL DEFAULT '',
  hue TEXT NOT NULL DEFAULT '30 60% 82%',
  image_url TEXT,
  created_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.custom_categories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view custom categories"
ON public.custom_categories FOR SELECT
USING (true);

CREATE POLICY "Admins can insert custom categories"
ON public.custom_categories FOR INSERT
TO authenticated
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update custom categories"
ON public.custom_categories FOR UPDATE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete custom categories"
ON public.custom_categories FOR DELETE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER update_custom_categories_updated_at
BEFORE UPDATE ON public.custom_categories
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Storage bucket for category cover images (public read)
INSERT INTO storage.buckets (id, name, public)
VALUES ('category-images', 'category-images', true)
ON CONFLICT (id) DO NOTHING;

-- Public can view category images
CREATE POLICY "Public can view category images"
ON storage.objects FOR SELECT
USING (bucket_id = 'category-images');

-- Admins can upload category images
CREATE POLICY "Admins can upload category images"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'category-images'
  AND public.has_role(auth.uid(), 'admin')
);

-- Admins can update category images
CREATE POLICY "Admins can update category images"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'category-images'
  AND public.has_role(auth.uid(), 'admin')
);

-- Admins can delete category images
CREATE POLICY "Admins can delete category images"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'category-images'
  AND public.has_role(auth.uid(), 'admin')
);
