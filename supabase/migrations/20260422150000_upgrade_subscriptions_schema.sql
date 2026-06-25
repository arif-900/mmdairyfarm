-- Upgrade to V2 Subscription System (Multi-Product Cart Style)
-- Date: 2026-04-22 15:00:00

-- 1. Drop existing delivery and subscription tables
DROP TABLE IF EXISTS public.deliveries CASCADE;
DROP TABLE IF EXISTS public.subscription_items CASCADE;
DROP TABLE IF EXISTS public.subscriptions CASCADE;

-- 2. Create parent subscriptions table (Order Group)
CREATE TABLE public.subscriptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.profiles(user_id) ON DELETE CASCADE,
    address TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3. Create subscription_items table (Actual subscription engine)
CREATE TABLE public.subscription_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    subscription_id UUID REFERENCES public.subscriptions(id) ON DELETE CASCADE,
    product_id UUID REFERENCES public.products(id) ON DELETE RESTRICT,
    quantity NUMERIC NOT NULL CHECK (quantity > 0),
    plan_type TEXT NOT NULL CHECK (plan_type IN ('daily', 'alternate', 'weekly', 'monthly')),
    delivery_time TEXT NOT NULL CHECK (delivery_time IN ('morning', 'evening')),
    start_date DATE NOT NULL,
    end_date DATE,
    next_delivery_date DATE NOT NULL,
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'paused', 'cancelled')),
    pause_from DATE,
    pause_to DATE,
    price_per_unit NUMERIC NOT NULL CHECK (price_per_unit >= 0),
    payment_status TEXT NOT NULL DEFAULT 'pending' CHECK (payment_status IN ('paid', 'pending')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 4. Create deliveries table
CREATE TABLE public.deliveries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    subscription_item_id UUID REFERENCES public.subscription_items(id) ON DELETE CASCADE,
    delivery_date DATE NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'delivered', 'skipped')),
    notes TEXT,
    is_subscription BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 5. Enable RLS
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscription_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.deliveries ENABLE ROW LEVEL SECURITY;

-- 6. Setup Policies for Subscriptions
DROP POLICY IF EXISTS "Users can view own subscriptions" ON public.subscriptions;
CREATE POLICY "Users can view own subscriptions" ON public.subscriptions 
    FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own subscriptions" ON public.subscriptions;
CREATE POLICY "Users can insert own subscriptions" ON public.subscriptions 
    FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Staff and admin have full access to subscriptions" ON public.subscriptions;
CREATE POLICY "Staff and admin have full access to subscriptions" ON public.subscriptions 
    FOR ALL USING (EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role IN ('admin', 'staff')));

-- 7. Setup Policies for Subscription Items
DROP POLICY IF EXISTS "Users can view own subscription items" ON public.subscription_items;
CREATE POLICY "Users can view own subscription items" ON public.subscription_items 
    FOR SELECT USING (
        subscription_id IN (SELECT id FROM public.subscriptions WHERE user_id = auth.uid())
    );

DROP POLICY IF EXISTS "Users can insert own subscription items" ON public.subscription_items;
CREATE POLICY "Users can insert own subscription items" ON public.subscription_items 
    FOR INSERT WITH CHECK (
        subscription_id IN (SELECT id FROM public.subscriptions WHERE user_id = auth.uid())
    );

DROP POLICY IF EXISTS "Users can update own subscription items" ON public.subscription_items;
CREATE POLICY "Users can update own subscription items" ON public.subscription_items 
    FOR UPDATE USING (
        subscription_id IN (SELECT id FROM public.subscriptions WHERE user_id = auth.uid())
    );

DROP POLICY IF EXISTS "Staff and admin have full access to subscription items" ON public.subscription_items;
CREATE POLICY "Staff and admin have full access to subscription items" ON public.subscription_items 
    FOR ALL USING (EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role IN ('admin', 'staff')));

-- 8. Setup Policies for Deliveries
DROP POLICY IF EXISTS "Users can view own deliveries" ON public.deliveries;
CREATE POLICY "Users can view own deliveries" ON public.deliveries 
    FOR SELECT USING (
        subscription_item_id IN (
            SELECT si.id FROM public.subscription_items si 
            JOIN public.subscriptions s ON si.subscription_id = s.id 
            WHERE s.user_id = auth.uid()
        )
    );

DROP POLICY IF EXISTS "Staff and admin have full access to deliveries" ON public.deliveries;
CREATE POLICY "Staff and admin have full access to deliveries" ON public.deliveries 
    FOR ALL USING (EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role IN ('admin', 'staff')));
