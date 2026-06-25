-- Add payment_method column to orders table
ALTER TABLE public.orders 
ADD COLUMN IF NOT EXISTS payment_method text NOT NULL DEFAULT 'online';

-- Add index for faster querying
CREATE INDEX IF NOT EXISTS idx_orders_payment_method ON public.orders(payment_method);