
-- Create translation cache table
CREATE TABLE public.translation_cache (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  source_text text NOT NULL,
  translated_text text NOT NULL,
  lang_pair text NOT NULL DEFAULT 'en|he',
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Unique index for fast lookups and deduplication
CREATE UNIQUE INDEX idx_translation_cache_unique ON public.translation_cache (source_text, lang_pair);

-- Enable RLS
ALTER TABLE public.translation_cache ENABLE ROW LEVEL SECURITY;

-- Anyone can read (public cache)
CREATE POLICY "Anyone can read translation cache"
  ON public.translation_cache
  FOR SELECT
  USING (true);

-- Only service role can insert (edge functions use supabaseAdmin)
-- No INSERT/UPDATE/DELETE policies for anon/authenticated = only service role can write
