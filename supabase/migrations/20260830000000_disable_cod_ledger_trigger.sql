-- Migration: 20260830000000_disable_cod_ledger_trigger.sql
-- Description: Deprecates COD ledger trigger so new orders do not create COD collection records.

-- 1. Drop trigger if exists
DROP TRIGGER IF EXISTS trigger_sync_cod_ledger ON public.orders;

-- 2. Drop function if exists
DROP FUNCTION IF EXISTS public.sync_cod_ledger_on_order_update();

-- 3. Comment on cod_ledger table for historical retention
COMMENT ON TABLE public.cod_ledger IS 'DEPRECATED: Preserved for historical audit purposes only. Cash on Delivery is disabled.';
