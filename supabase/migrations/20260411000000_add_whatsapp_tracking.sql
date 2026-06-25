-- Add WhatsApp tracking columns to orders table
ALTER TABLE public.orders 
ADD COLUMN IF NOT EXISTS whatsapp_opt_in BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS reminder_sent BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS retry_count INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS user_name TEXT;

-- Update RLS if needed (usually orders already has policies)
-- The existing policies allow users to view their own orders and admins to update.
-- No additional RLS changes strictly required unless specific WhatsApp fields need protection.
