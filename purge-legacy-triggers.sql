-- ==========================================
-- DYNAMIC HUNTER-KILLER SCRIPT FOR ROGUE TRIGGERS
-- ==========================================

-- The 400 Bad Request is being caused by a hidden, unknown function that is STILL 
-- trying to insert into the deleted column "notification_type".
-- Since we don't know the name of the function, this script searches the entire 
-- PostgreSQL source code for the word "notification_type" and permanently detonates 
-- any function (and its attached triggers) that contains it.

DO $$ 
DECLARE 
    func_record RECORD;
BEGIN
    -- 1. Scan the PostgreSQL internal procedures table for the bad keyword
    FOR func_record IN 
        SELECT p.proname 
        FROM pg_proc p
        JOIN pg_namespace n ON p.pronamespace = n.oid
        WHERE n.nspname = 'public' 
        AND p.prosrc ILIKE '%notification_type%'
    LOOP
        -- 2. Drop the rogue function using CASCADE so it automatically unhooks the trigger attached to Orders
        RAISE NOTICE 'Dropping legacy function: %', func_record.proname;
        EXECUTE 'DROP FUNCTION IF EXISTS public.' || quote_ident(func_record.proname) || ' CASCADE';
    END LOOP;
END $$;

-- 3. Re-affirm the CORRECT trigger just in case the purge caught it.
CREATE OR REPLACE FUNCTION public.log_order_status_update()
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

DROP TRIGGER IF EXISTS order_status_notification_trigger ON public.orders;
CREATE TRIGGER order_status_notification_trigger
    AFTER UPDATE ON public.orders
    FOR EACH ROW
    EXECUTE FUNCTION public.log_order_status_update();

NOTIFY pgrst, 'reload schema';
