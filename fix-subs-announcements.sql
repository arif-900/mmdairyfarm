-- Fix Row Level Security (RLS) policies for Subscriptions and Announcements
-- The original policies checked the legacy `profiles.role` column. 
-- We must update them to use the new `public.has_role()` function which checks `user_roles`.

BEGIN;

-- ==========================================
-- 1. Fix Subscriptions Table Policies
-- ==========================================
DROP POLICY IF EXISTS "Admins can view all subscriptions" ON public.subscriptions;
DROP POLICY IF EXISTS "Admins can update all subscriptions" ON public.subscriptions;

CREATE POLICY "Admins can view all subscriptions" ON public.subscriptions
  FOR SELECT USING (
    public.has_role(auth.uid(), 'admin'::text) OR public.has_role(auth.uid(), 'staff'::text)
  );

CREATE POLICY "Admins can update all subscriptions" ON public.subscriptions
  FOR UPDATE USING (
    public.has_role(auth.uid(), 'admin'::text) OR public.has_role(auth.uid(), 'staff'::text)
  );

-- Also fix order_feedback just in case it was created with the old policy format
DROP POLICY IF EXISTS "Admins can view all feedback" ON public.order_feedback;

CREATE POLICY "Admins can view all feedback" ON public.order_feedback
  FOR SELECT USING (
    public.has_role(auth.uid(), 'admin'::text) OR public.has_role(auth.uid(), 'staff'::text)
  );

-- ==========================================
-- 2. Fix Announcements Table Policies
-- ==========================================
-- Ensure RLS is enabled
ALTER TABLE IF EXISTS public.announcements ENABLE ROW LEVEL SECURITY;

-- Clean existing policies safely
DROP POLICY IF EXISTS "Anyone can view active announcements" ON public.announcements;
DROP POLICY IF EXISTS "Admins can insert announcements" ON public.announcements;
DROP POLICY IF EXISTS "Admins can update announcements" ON public.announcements;
DROP POLICY IF EXISTS "Admins can delete announcements" ON public.announcements;

-- Public can only see active announcements
CREATE POLICY "Anyone can view active announcements" ON public.announcements
  FOR SELECT USING (is_active = true OR public.has_role(auth.uid(), 'admin'::text) OR public.has_role(auth.uid(), 'staff'::text));

-- Admin and Staff CRUD using has_role cast explicitly to text
CREATE POLICY "Admins can insert announcements" ON public.announcements
  FOR INSERT WITH CHECK (public.has_role(auth.uid(), 'admin'::text) OR public.has_role(auth.uid(), 'staff'::text));

CREATE POLICY "Admins can update announcements" ON public.announcements
  FOR UPDATE USING (public.has_role(auth.uid(), 'admin'::text) OR public.has_role(auth.uid(), 'staff'::text));

CREATE POLICY "Admins can delete announcements" ON public.announcements
  FOR DELETE USING (public.has_role(auth.uid(), 'admin'::text) OR public.has_role(auth.uid(), 'staff'::text));

COMMIT;

-- Ensure schema cache is updated
NOTIFY pgrst, 'reload schema';
