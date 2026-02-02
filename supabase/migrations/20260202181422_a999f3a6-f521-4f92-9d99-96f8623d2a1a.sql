-- Add RLS policies for user_gallery table

-- Users can view their own gallery items
CREATE POLICY "Users can view their own gallery items"
ON public.user_gallery
FOR SELECT
USING (auth.uid() = user_id);

-- Users can insert their own gallery items
CREATE POLICY "Users can insert their own gallery items"
ON public.user_gallery
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Users can update their own gallery items
CREATE POLICY "Users can update their own gallery items"
ON public.user_gallery
FOR UPDATE
USING (auth.uid() = user_id);

-- Users can delete their own gallery items
CREATE POLICY "Users can delete their own gallery items"
ON public.user_gallery
FOR DELETE
USING (auth.uid() = user_id);