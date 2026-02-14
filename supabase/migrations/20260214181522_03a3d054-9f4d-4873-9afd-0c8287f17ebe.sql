
CREATE TABLE public.analytics_events (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID,
  event_name TEXT NOT NULL,
  event_data JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.analytics_events ENABLE ROW LEVEL SECURITY;

-- Allow anyone (including anonymous) to insert events
CREATE POLICY "Anyone can insert analytics events"
ON public.analytics_events
FOR INSERT
WITH CHECK (true);

-- Only the user can view their own events (for admin purposes later)
CREATE POLICY "Users can view their own events"
ON public.analytics_events
FOR SELECT
USING (auth.uid() = user_id);

-- Create index for querying by event name and date
CREATE INDEX idx_analytics_event_name ON public.analytics_events (event_name);
CREATE INDEX idx_analytics_created_at ON public.analytics_events (created_at);
