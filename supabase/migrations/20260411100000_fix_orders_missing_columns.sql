-- =========================================================
-- Fix: Add all missing columns to orders table
-- Run this in: Supabase Dashboard → SQL Editor
-- =========================================================

-- 1. Delivery tracking columns
ALTER TABLE public.orders 
  ADD COLUMN IF NOT EXISTS order_delivery_days INTEGER DEFAULT 3,
  ADD COLUMN IF NOT EXISTS expected_delivery_date TIMESTAMP WITH TIME ZONE;

-- 2. WhatsApp tracking columns  
ALTER TABLE public.orders 
  ADD COLUMN IF NOT EXISTS whatsapp_opt_in BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS reminder_sent BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS retry_count INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS user_name TEXT;

-- 3. Razorpay order ID (for online payment tracking)
ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS razorpay_order_id TEXT;

-- 4. Set default delivery dates for existing orders
UPDATE public.orders 
  SET expected_delivery_date = created_at + INTERVAL '3 days' 
  WHERE expected_delivery_date IS NULL;

-- =========================================================
-- Verify the columns were added:
-- SELECT column_name, data_type FROM information_schema.columns 
-- WHERE table_name = 'orders' ORDER BY column_name;
-- =========================================================
