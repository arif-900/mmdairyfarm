-- 1. Add refund fields to orders table
ALTER TABLE public.orders 
ADD COLUMN IF NOT EXISTS refund_id TEXT,
ADD COLUMN IF NOT EXISTS refund_status TEXT;

-- 2. Enhance order cancellation RPC
-- This allows customers to cancel if not yet shipped
CREATE OR REPLACE FUNCTION public.cancel_user_order(p_order_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
    v_updated BOOLEAN;
BEGIN
    UPDATE public.orders 
    SET status = 'cancelled' 
    WHERE id = p_order_id 
      AND user_id = auth.uid() 
      AND status IN ('pending', 'paid', 'processing')
    RETURNING true INTO v_updated;

    RETURN COALESCE(v_updated, false);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;
