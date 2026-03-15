-- ==========================================
-- FIX FEEDBACK VISIBILITY FOR STAFF & ADMINS
-- ==========================================

-- 1. Apply Explicit Grants
-- We need to ensure that Authenticated users are explicitly allowed to read/write the table.
GRANT ALL ON TABLE public.order_feedback TO authenticated, anon, service_role;

-- 2. Clean Existing Legacy Policies
-- The original policies were incorrectly checking `profiles.role` rather than using `user_roles`.
DROP POLICY IF EXISTS "Admins can view all feedback" ON public.order_feedback;
DROP POLICY IF EXISTS "Users can view own feedback" ON public.order_feedback;
DROP POLICY IF EXISTS "Users can insert own feedback" ON public.order_feedback;

-- 3. Recreate the specific bulletproof security rules
-- Staff and Admins can now explicitly pull the feedback analytics
CREATE POLICY "Staff and Admins can view all feedback"
  ON public.order_feedback FOR SELECT
  USING (
    auth.uid() = user_id OR
    public.has_role(auth.uid(), 'admin'::text) OR 
    public.has_role(auth.uid(), 'staff'::text)
  );

-- Customers can view their own feedback
CREATE POLICY "Users can insert own feedback"
  ON public.order_feedback FOR INSERT
  WITH CHECK (auth.uid() = user_id);

NOTIFY pgrst, 'reload schema';
