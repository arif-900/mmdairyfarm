-- migration_v4_2.sql
-- Fix weight tracking in subscriptions

ALTER TABLE public.subscription_items 
ADD COLUMN IF NOT EXISTS selected_weight integer DEFAULT 1000,
ADD COLUMN IF NOT EXISTS unit_type text DEFAULT 'ml';

-- Update existing records if any
-- Assuming most things are ml based on current catalog
UPDATE public.subscription_items 
SET unit_type = 'ml' 
WHERE unit_type IS NULL;

UPDATE public.subscription_items 
SET selected_weight = 1000 
WHERE selected_weight IS NULL;
