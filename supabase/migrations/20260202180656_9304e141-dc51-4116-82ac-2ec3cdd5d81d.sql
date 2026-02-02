-- Create storage bucket for gallery images
INSERT INTO storage.buckets (id, name, public)
VALUES ('gallery-images', 'gallery-images', true);

-- Allow authenticated users to upload their own images
CREATE POLICY "Users can upload gallery images"
ON storage.objects
FOR INSERT
WITH CHECK (
  bucket_id = 'gallery-images' 
  AND auth.uid() IS NOT NULL 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Allow public read access to gallery images
CREATE POLICY "Gallery images are publicly accessible"
ON storage.objects
FOR SELECT
USING (bucket_id = 'gallery-images');

-- Allow users to delete their own images
CREATE POLICY "Users can delete their own gallery images"
ON storage.objects
FOR DELETE
USING (
  bucket_id = 'gallery-images' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);