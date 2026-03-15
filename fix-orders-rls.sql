-- This script fixes the Type Casting error by teaching PostgreSQL 
-- how to apply the upper() function to the order_status enum!

CREATE OR REPLACE FUNCTION public.upper(public.order_status)
RETURNS text AS $$
  SELECT upper($1::text);
$$ LANGUAGE sql IMMUTABLE;
