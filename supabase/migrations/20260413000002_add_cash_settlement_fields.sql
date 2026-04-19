-- Migration to add cash settlement tracking fields to the orders table
ALTER TABLE public.orders 
ADD COLUMN IF NOT EXISTS is_cash_settled BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS cash_settled_at TIMESTAMP WITH TIME ZONE;

-- Add index for performance on filtering by assigned_to and payment_method
CREATE INDEX IF NOT EXISTS idx_orders_assigned_settlement 
ON public.orders (assigned_to, payment_method, is_cash_collected, is_cash_settled);
