-- Upgrade to V3.1: Area-Based Delivery and Independent Items
-- Date: 2026-04-22 16:10:00

-- 1. Update addresses table to include Area Name
ALTER TABLE public.addresses ADD COLUMN IF NOT EXISTS area_name TEXT;

-- 2. Update deliveries table to include Delivery Boy assignment
ALTER TABLE public.deliveries ADD COLUMN IF NOT EXISTS delivery_boy_id UUID REFERENCES public.profiles(user_id) ON DELETE SET NULL;

-- 3. Create delivery_areas table (Master list of areas)
CREATE TABLE IF NOT EXISTS public.delivery_areas (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT UNIQUE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 4. Create delivery_assignments table (Link staff to areas)
CREATE TABLE IF NOT EXISTS public.delivery_assignments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    staff_id UUID REFERENCES public.profiles(user_id) ON DELETE CASCADE,
    area_id UUID REFERENCES public.delivery_areas(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(staff_id, area_id)
);

-- 5. Enable RLS
ALTER TABLE public.delivery_areas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.delivery_assignments ENABLE ROW LEVEL SECURITY;

-- 6. Setup Policies
DROP POLICY IF EXISTS "Anyone can view delivery areas" ON public.delivery_areas;
CREATE POLICY "Anyone can view delivery areas" ON public.delivery_areas FOR SELECT USING (true);

DROP POLICY IF EXISTS "Anyone can view delivery assignments" ON public.delivery_assignments;
CREATE POLICY "Anyone can view delivery assignments" ON public.delivery_assignments FOR SELECT USING (true);

DROP POLICY IF EXISTS "Admins have full access to areas" ON public.delivery_areas;
CREATE POLICY "Admins have full access to areas" ON public.delivery_areas 
    FOR ALL USING (EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin'));

DROP POLICY IF EXISTS "Admins have full access to assignments" ON public.delivery_assignments;
CREATE POLICY "Admins have full access to assignments" ON public.delivery_assignments 
    FOR ALL USING (EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin'));

-- 7. Seed some initial areas
INSERT INTO public.delivery_areas (name) VALUES 
('North Zone'), 
('South Zone'), 
('Downtown'), 
('East Park')
ON CONFLICT DO NOTHING;
