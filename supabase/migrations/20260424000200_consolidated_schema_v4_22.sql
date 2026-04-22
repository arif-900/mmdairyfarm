-- Final Schema Consolidation and Cleanup
-- Date: 2026-04-24 00:02:00
-- Consolidates required changes from scratch files (add_dynamic_pricing_columns.sql, database-enhancements.sql, fix-product-visibility.sql)

-- ==========================================
-- 1. ROLES & STATUSES
-- ==========================================

-- Ensure 'staff' role exists
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type t JOIN pg_enum e ON t.oid = e.enumtypid WHERE t.typname = 'app_role' AND e.enumlabel = 'staff') THEN
        ALTER TYPE public.app_role ADD VALUE 'staff';
    END IF;
END $$;

-- Ensure delivery statuses exist
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type t JOIN pg_enum e ON t.oid = e.enumtypid WHERE t.typname = 'order_status' AND e.enumlabel = 'picked_up') THEN
        ALTER TYPE public.order_status ADD VALUE 'picked_up';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_type t JOIN pg_enum e ON t.oid = e.enumtypid WHERE t.typname = 'order_status' AND e.enumlabel = 'out_for_delivery') THEN
        ALTER TYPE public.order_status ADD VALUE 'out_for_delivery';
    END IF;
END $$;

-- ==========================================
-- 2. PRODUCTS SCHEMA UPDATES
-- ==========================================

ALTER TABLE public.products 
ADD COLUMN IF NOT EXISTS base_price_per_kg NUMERIC(10, 2),
ADD COLUMN IF NOT EXISTS available_weights INTEGER[] DEFAULT '{250, 500, 1000}',
ADD COLUMN IF NOT EXISTS unit_type TEXT DEFAULT 'g',
ADD COLUMN IF NOT EXISTS rating NUMERIC(3, 1) DEFAULT 4.6,
ADD COLUMN IF NOT EXISTS review_count INTEGER DEFAULT 39,
ADD COLUMN IF NOT EXISTS tags TEXT[] DEFAULT '{Flavorful, Traditional}',
ADD COLUMN IF NOT EXISTS is_active BOOLEAN NOT NULL DEFAULT true;

-- Ensure missing is_active values are populated
UPDATE public.products SET is_active = true WHERE is_active IS NULL;

-- Synchronize base_price_per_kg if newly added
UPDATE public.products 
SET base_price_per_kg = price 
WHERE base_price_per_kg IS NULL;

COMMENT ON COLUMN public.products.base_price_per_kg IS 'Price per 1000g (1kg) of the product';
COMMENT ON COLUMN public.products.available_weights IS 'Array of selectable weights in grams/milliliters (e.g. {250, 500, 1000})';

-- ==========================================
-- 3. ORDERS SCHEMA UPDATES
-- ==========================================

ALTER TABLE public.orders 
ADD COLUMN IF NOT EXISTS assigned_to UUID REFERENCES auth.users(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS is_cash_collected BOOLEAN DEFAULT false;

-- ==========================================
-- 4. COMMISSIONS SYSTEM
-- ==========================================

CREATE TABLE IF NOT EXISTS public.commissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    staff_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    order_id UUID REFERENCES public.orders(id) ON DELETE CASCADE NOT NULL,
    amount DECIMAL(10, 2) NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending', -- 'pending', 'paid'
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on commissions
ALTER TABLE public.commissions ENABLE ROW LEVEL SECURITY;

-- RLS Policies for commissions
DROP POLICY IF EXISTS "Staff can view their own commissions" ON public.commissions;
CREATE POLICY "Staff can view their own commissions"
ON public.commissions FOR SELECT
USING (auth.uid() = staff_id OR public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Admins can manage commissions" ON public.commissions;
CREATE POLICY "Admins can manage commissions"
ON public.commissions FOR ALL
USING (public.has_role(auth.uid(), 'admin'));

-- ==========================================
-- 5. PRODUCT VISIBILITY POLICY
-- ==========================================

ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Product Visibility Policy" ON public.products;
CREATE POLICY "Product Visibility Policy"
ON public.products FOR SELECT
USING (
  is_active = true 
  OR public.has_role(auth.uid(), 'admin') 
  OR public.has_role(auth.uid(), 'staff')
);

-- Ensure admins have full access (redundancy for safety)
DROP POLICY IF EXISTS "Admins can manage products" ON public.products;
CREATE POLICY "Admins can manage products"
ON public.products FOR ALL
USING (public.has_role(auth.uid(), 'admin'));

-- Reload schema cache
NOTIFY pgrst, 'reload schema';
