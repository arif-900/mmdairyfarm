-- Database-backed idempotency table for payment webhooks
CREATE TABLE IF NOT EXISTS public.webhook_events (
  event_id TEXT PRIMARY KEY,
  event_type TEXT NOT NULL,
  payload JSONB,
  processed_at TIMESTAMPTZ DEFAULT now()
);

-- Index for rapid event lookup
CREATE INDEX IF NOT EXISTS idx_webhook_events_lookup ON public.webhook_events (event_id, event_type);

-- RLS Protection: Only service role can access webhook_events table
ALTER TABLE public.webhook_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role full access to webhook_events"
  ON public.webhook_events
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);
