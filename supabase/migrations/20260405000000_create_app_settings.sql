-- 20260405_create_app_settings.sql
-- Create a table for application-wide settings (like Mapbox token, global flags)

CREATE TABLE IF NOT EXISTS public.app_settings (
    key TEXT PRIMARY KEY,
    value TEXT NOT NULL,
    description TEXT,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_by UUID REFERENCES auth.users(id)
);

-- Enable RLS
ALTER TABLE public.app_settings ENABLE ROW LEVEL SECURITY;

-- 🛡️ POLICIES

-- 1. Everyone (including anonymous users) can read settings
DROP POLICY IF EXISTS "Public can read app settings" ON public.app_settings;
CREATE POLICY "Public can read app settings"
ON public.app_settings FOR SELECT
USING (true);

-- 2. Only Admins can manage settings
DROP POLICY IF EXISTS "Admins can manage app settings" ON public.app_settings;
CREATE POLICY "Admins can manage app settings"
ON public.app_settings FOR ALL
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.user_roles 
        WHERE user_id = auth.uid() 
        AND role = 'admin'
    )
);

-- 💡 HELPER: Insert initial Mapbox token row (Placeholder)
-- INSERT INTO public.app_settings (key, value, description)
-- VALUES ('mapbox_token', 'your_token_here', 'Mapbox Access Token for Map Picker')
-- ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value;
