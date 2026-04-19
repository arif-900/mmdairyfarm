-- Database Enhancements for MMVALI Dairy Farm
-- Run this in the Supabase SQL Editor

-- 1. Add 'staff' to app_role enum
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type t JOIN pg_enum e ON t.oid = e.enumtypid WHERE t.typname = 'app_role' AND e.enumlabel = 'staff') THEN
        ALTER TYPE public.app_role ADD VALUE 'staff';
    END IF;
END $$;

-- 2. Add new statuses to order_status enum
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type t JOIN pg_enum e ON t.oid = e.enumtypid WHERE t.typname = 'order_status' AND e.enumlabel = 'picked_up') THEN
        ALTER TYPE public.order_status ADD VALUE 'picked_up';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_type t JOIN pg_enum e ON t.oid = e.enumtypid WHERE t.typname = 'order_status' AND e.enumlabel = 'out_for_delivery') THEN
        ALTER TYPE public.order_status ADD VALUE 'out_for_delivery';
    END IF;
END $$;

-- 3. Update orders table
ALTER TABLE public.orders 
ADD COLUMN IF NOT EXISTS assigned_to UUID REFERENCES auth.users(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS is_cash_collected BOOLEAN DEFAULT false;

-- 4. Create commissions table
CREATE TABLE IF NOT EXISTS public.commissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    staff_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    order_id UUID REFERENCES public.orders(id) ON DELETE CASCADE NOT NULL,
    amount DECIMAL(10, 2) NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending', -- 'pending', 'paid'
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- 5. Enable RLS on commissions
ALTER TABLE public.commissions ENABLE ROW LEVEL SECURITY;

-- 6. RLS Policies for commissions
DROP POLICY IF EXISTS "Staff can view their own commissions" ON public.commissions;
CREATE POLICY "Staff can view their own commissions"
ON public.commissions FOR SELECT
USING (auth.uid() = staff_id OR public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Admins can manage commissions" ON public.commissions;
CREATE POLICY "Admins can manage commissions"
ON public.commissions FOR ALL
USING (public.has_role(auth.uid(), 'admin'));

-- 7. RLS Policy for staff to view all orders
DROP POLICY IF EXISTS "Staff and admins can view all orders" ON public.orders;
CREATE POLICY "Staff and admins can view all orders"
ON public.orders FOR SELECT
USING (public.has_role(auth.uid(), 'staff') OR public.has_role(auth.uid(), 'admin') OR auth.uid() = user_id);

DROP POLICY IF EXISTS "Staff can view assigned orders" ON public.orders;

-- 8. Add staff access to order_items
DROP POLICY IF EXISTS "Staff can view assigned order items" ON public.order_items;
CREATE POLICY "Staff can view assigned order items"
ON public.order_items FOR SELECT
USING (EXISTS (
    SELECT 1 FROM public.orders
    WHERE orders.id = order_items.order_id
    AND (orders.assigned_to = auth.uid() OR orders.user_id = auth.uid() OR public.has_role(auth.uid(), 'admin'))
));
