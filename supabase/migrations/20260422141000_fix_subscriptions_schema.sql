-- Fix to enforce new schema for subscriptions

-- Temporarily drop the old tables so they can be recreated perfectly.
DROP TABLE IF EXISTS public.deliveries CASCADE;
DROP TABLE IF EXISTS public.subscriptions CASCADE;

-- Recreate subscriptions table
CREATE TABLE public.subscriptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.profiles(user_id) ON DELETE CASCADE,
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
    address TEXT NOT NULL,
    price NUMERIC NOT NULL CHECK (price >= 0),
    payment_status TEXT NOT NULL DEFAULT 'pending' CHECK (payment_status IN ('paid', 'pending')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Recreate deliveries table
CREATE TABLE public.deliveries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    subscription_id UUID REFERENCES public.subscriptions(id) ON DELETE CASCADE,
    delivery_date DATE NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'delivered', 'skipped')),
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Re-enable RLS
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.deliveries ENABLE ROW LEVEL SECURITY;

-- Re-apply Policies
CREATE POLICY "Users can view own subscriptions" ON public.subscriptions 
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own subscriptions" ON public.subscriptions 
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own subscriptions" ON public.subscriptions 
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Staff and admin have full access to subscriptions" ON public.subscriptions 
    FOR ALL USING (EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role IN ('admin', 'staff')));

CREATE POLICY "Users can view own deliveries" ON public.deliveries 
    FOR SELECT USING (
        subscription_id IN (SELECT id FROM public.subscriptions WHERE user_id = auth.uid())
    );

CREATE POLICY "Users can update own deliveries" ON public.deliveries 
    FOR UPDATE USING (
        subscription_id IN (SELECT id FROM public.subscriptions WHERE user_id = auth.uid())
    );

CREATE POLICY "Staff and admin have full access to deliveries" ON public.deliveries 
    FOR ALL USING (EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role IN ('admin', 'staff')));
