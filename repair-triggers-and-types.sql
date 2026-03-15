-- ==========================================
-- MASTER REPAIR SCRIPT for 400 Errors
-- ==========================================

-- 1. FIX THE ORDER UPDATE TRIGGER CRASH
-- This function was crashing `UPDATE orders` because it tried inserting into legacy columns.
CREATE OR REPLACE FUNCTION log_order_status_update()
RETURNS TRIGGER AS $$
BEGIN
    IF OLD.status IS DISTINCT FROM NEW.status THEN
        INSERT INTO public.notification_logs (
            user_id, 
            order_id, 
            title, 
            message, 
            type
        )
        VALUES (
            NEW.user_id,
            NEW.id,
            'Order Status Updated',
            'Your order #' || substr(NEW.id::text, 1, 8) || ' status has been updated to ' || NEW.status,
            'order_status'
        );
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Overwrite the trigger safely just in case it had wrong timing bounds
DROP TRIGGER IF EXISTS order_status_notification_trigger ON public.orders;
CREATE TRIGGER order_status_notification_trigger
    AFTER UPDATE ON public.orders
    FOR EACH ROW
    EXECUTE FUNCTION log_order_status_update();

-- 2. FIX THE SUBSCRIPTIONS RLS TYPECAST ERROR
-- Subscriptions SELECT is crashing with 400 because `auth.uid()` (UUID) is being checked against `user_id` (which might be TEXT depending on how user created the table).
-- By explicitly casting both sides to text, we stop Postgres from crashing during security checks.
DO $$ 
BEGIN
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'subscriptions') THEN
        DROP POLICY IF EXISTS "Enable read access for subscriptions" ON public.subscriptions;
        DROP POLICY IF EXISTS "Enable insert for subscriptions" ON public.subscriptions;
        DROP POLICY IF EXISTS "Enable update for subscriptions" ON public.subscriptions;

        CREATE POLICY "Enable read access for subscriptions"
        ON public.subscriptions FOR SELECT
        USING (auth.uid()::text = user_id::text OR public.has_role(auth.uid(), 'admin'::text) OR public.has_role(auth.uid(), 'staff'::text));

        CREATE POLICY "Enable insert for subscriptions"
        ON public.subscriptions FOR INSERT
        WITH CHECK (auth.uid()::text = user_id::text);

        CREATE POLICY "Enable update for subscriptions"
        ON public.subscriptions FOR UPDATE
        USING (auth.uid()::text = user_id::text OR public.has_role(auth.uid(), 'admin'::text) OR public.has_role(auth.uid(), 'staff'::text));
    END IF;

    -- Precautionary Patch to Orders too
    DROP POLICY IF EXISTS "Enable read access for all users" ON public.orders;
    CREATE POLICY "Enable read access for all users"
    ON public.orders FOR SELECT
    USING (auth.uid()::text = user_id::text OR public.has_role(auth.uid(), 'admin'::text) OR public.has_role(auth.uid(), 'staff'::text));

    DROP POLICY IF EXISTS "Enable update for users based on email" ON public.orders;
    CREATE POLICY "Enable update for users based on email"
    ON public.orders FOR UPDATE
    USING (public.has_role(auth.uid(), 'admin'::text) OR public.has_role(auth.uid(), 'staff'::text));

END $$;

NOTIFY pgrst, 'reload schema';
