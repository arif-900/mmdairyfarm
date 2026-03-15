-- Enable Realtime WebSockets for the 'products' table
-- This allows the Frontend to instantly detect when a Product's stock or price changes.

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 
    FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'products'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.products;
  END IF;
END;
$$;

-- Ensure PostgREST knows about any permission or schema changes
NOTIFY pgrst, 'reload schema';
