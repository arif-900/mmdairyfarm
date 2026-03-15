-- ==========================================
-- PHASE 4: Notifications System
-- ==========================================

-- 1. Create Notification Logs Table
CREATE TABLE IF NOT EXISTS public.notification_logs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL, 
    order_id UUID REFERENCES public.orders(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    type TEXT NOT NULL, -- e.g., 'order_status', 'system', 'promotion'
    is_read BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS
ALTER TABLE public.notification_logs ENABLE ROW LEVEL SECURITY;

-- 2. Clean Existing Notification Policies
DROP POLICY IF EXISTS "Users can view own notifications" ON public.notification_logs;
DROP POLICY IF EXISTS "Admins can view all notifications" ON public.notification_logs;
DROP POLICY IF EXISTS "Admins can insert notifications" ON public.notification_logs;
DROP POLICY IF EXISTS "Users can update own notifications" ON public.notification_logs;

-- Users can see their own notifications, admins & staff see all
CREATE POLICY "Users can view own notifications"
    ON public.notification_logs FOR SELECT
    USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'staff'));

-- Admins & Staff can create notifications
CREATE POLICY "Admins can insert notifications"
    ON public.notification_logs FOR INSERT
    WITH CHECK (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'staff') OR auth.uid() = user_id);

-- Users can update their own notifications (e.g. mark as read)
CREATE POLICY "Users can update own notifications"
    ON public.notification_logs FOR UPDATE
    USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'staff'));

-- 3. Trigger Function for Order Status Updates
CREATE OR REPLACE FUNCTION log_order_status_update()
RETURNS TRIGGER AS $$
BEGIN
    IF OLD.status IS DISTINCT FROM NEW.status THEN
        INSERT INTO public.notification_logs (user_id, order_id, title, message, type)
        VALUES (
            NEW.user_id,
            NEW.id,
            'Order Status Updated',
            'Your order #' || substr(NEW.id::text, 1, 8) || ' status has been updated to ' || NEW.status || '.',
            'order_status'
        );
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create the Trigger
DROP TRIGGER IF EXISTS order_status_notification_trigger ON public.orders;
CREATE TRIGGER order_status_notification_trigger
    AFTER UPDATE ON public.orders
    FOR EACH ROW
    EXECUTE FUNCTION log_order_status_update();

NOTIFY pgrst, 'reload schema';
