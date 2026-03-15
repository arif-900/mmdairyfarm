-- This script inserts the 'admin' rank into the new user_roles table for your specific account.
-- It uses the exact User ID from your error logs: cef34be6-c268-4da2-8fc6-21fa98c0b556

INSERT INTO public.user_roles (user_id, role)
VALUES ('cef34be6-c268-4da2-8fc6-21fa98c0b556', 'admin')
ON CONFLICT (user_id, role) DO NOTHING;

-- Just in case there's another conflict pattern:
INSERT INTO public.user_roles (user_id, role)
SELECT id, 'admin' FROM auth.users WHERE id = 'cef34be6-c268-4da2-8fc6-21fa98c0b556'
ON CONFLICT DO NOTHING;
