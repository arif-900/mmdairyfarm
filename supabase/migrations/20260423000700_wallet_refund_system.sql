-- Migration: Unified Wallet Refund System
-- Date: 2026-04-23 00:07:00

-- 1. Create Wallet Ledger for Auditability
CREATE TABLE IF NOT EXISTS public.wallet_ledger (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.profiles(user_id) ON DELETE CASCADE,
    amount NUMERIC NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('credit', 'debit')),
    reason TEXT NOT NULL,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. Enable RLS on Ledger
ALTER TABLE public.wallet_ledger ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own wallet history" ON public.wallet_ledger 
    FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Admin/Staff have full access to ledger" ON public.wallet_ledger 
    FOR ALL USING (EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role IN ('admin', 'staff')));

-- 3. Function: Count Future Deliveries for a Subscription
CREATE OR REPLACE FUNCTION public.count_remaining_deliveries(
    p_next_delivery_date DATE,
    p_end_date DATE,
    p_plan_type TEXT,
    p_delivery_time TEXT -- 'morning', 'evening', or 'both'
) RETURNS INTEGER AS $$
DECLARE
    v_count INTEGER := 0;
    v_curr DATE := p_next_delivery_date;
    v_multiplier INTEGER := CASE WHEN p_delivery_time = 'both' THEN 2 ELSE 1 END;
BEGIN
    IF p_end_date IS NULL OR v_curr > p_end_date THEN
        RETURN 0;
    END IF;

    WHILE v_curr <= p_end_date LOOP
        v_count := v_count + 1;
        
        -- Move to next delivery date based on plan
        CASE p_plan_type
            WHEN 'daily' THEN v_curr := v_curr + INTERVAL '1 day';
            WHEN 'alternate' THEN v_curr := v_curr + INTERVAL '2 days';
            WHEN 'weekly' THEN v_curr := v_curr + INTERVAL '7 days';
            WHEN 'monthly' THEN v_curr := v_curr + INTERVAL '1 month';
            ELSE v_curr := v_curr + INTERVAL '1 day';
        END CASE;
    END LOOP;

    RETURN v_count * v_multiplier;
END;
$$ LANGUAGE plpgsql;

-- 4. Function: Refund One-Time Order to Wallet
CREATE OR REPLACE FUNCTION public.refund_order_to_wallet(p_order_id UUID)
RETURNS JSONB AS $$
DECLARE
    v_order RECORD;
    v_profile RECORD;
BEGIN
    -- 1. Lock and get order
    SELECT * INTO v_order FROM public.orders WHERE id = p_order_id FOR UPDATE;
    IF NOT FOUND THEN RETURN jsonb_build_object('success', false, 'message', 'Order not found'); END IF;
    IF v_order.status = 'cancelled' THEN RETURN jsonb_build_object('success', false, 'message', 'Order already cancelled'); END IF;

    -- 2. Credit Profile
    UPDATE public.profiles 
    SET reward_coins = reward_coins + v_order.total_amount
    WHERE user_id = v_order.user_id;

    -- 3. Update Order Status
    UPDATE public.orders 
    SET status = 'cancelled', 
        refund_status = 'full_to_wallet',
        refund_id = 'WALLET-' || p_order_id::text
    WHERE id = p_order_id;

    -- 4. Record in Ledger
    INSERT INTO public.wallet_ledger (user_id, amount, type, reason, metadata)
    VALUES (
        v_order.user_id, 
        v_order.total_amount, 
        'credit', 
        'Refund for cancelled order #' || upper(left(p_order_id::text, 8)),
        jsonb_build_object('order_id', p_order_id)
    );

    RETURN jsonb_build_object('success', true, 'refunded_amount', v_order.total_amount);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5. Function: Refund Subscription to Wallet
CREATE OR REPLACE FUNCTION public.refund_subscription_to_wallet(p_item_id UUID)
RETURNS JSONB AS $$
DECLARE
    v_item RECORD;
    v_remaining_qty INTEGER;
    v_refund_amount NUMERIC;
    v_sub_user_id UUID;
BEGIN
    -- 1. Lock and get item
    SELECT si.*, s.user_id INTO v_item 
    FROM public.subscription_items si
    JOIN public.subscriptions s ON si.subscription_id = s.id
    WHERE si.id = p_item_id 
    FOR UPDATE;

    IF NOT FOUND THEN RETURN jsonb_build_object('success', false, 'message', 'Subscription item not found'); END IF;
    IF v_item.status = 'cancelled' THEN RETURN jsonb_build_object('success', false, 'message', 'Already cancelled'); END IF;

    -- 2. Calculate remaining deliveries
    -- We start from current date if next_delivery_date is in the past
    v_remaining_qty := public.count_remaining_deliveries(
        GREATEST(v_item.next_delivery_date, CURRENT_DATE),
        v_item.end_date,
        v_item.plan_type,
        v_item.delivery_time
    );

    v_refund_amount := v_remaining_qty * (v_item.price_per_unit * v_item.quantity);

    -- 3. Update status
    UPDATE public.subscription_items 
    SET status = 'cancelled' 
    WHERE id = p_item_id;

    -- 4. Credit Wallet if amount > 0
    IF v_refund_amount > 0 THEN
        UPDATE public.profiles 
        SET reward_coins = reward_coins + v_refund_amount
        WHERE user_id = v_item.user_id;

        -- 5. Record in Ledger
        INSERT INTO public.wallet_ledger (user_id, amount, type, reason, metadata)
        VALUES (
            v_item.user_id, 
            v_refund_amount, 
            'credit', 
            'Refund for cancelled subscription #' || upper(left(p_item_id::text, 8)),
            jsonb_build_object('subscription_item_id', p_item_id, 'remaining_deliveries', v_remaining_qty)
        );
    END IF;

    RETURN jsonb_build_object(
        'success', true, 
        'refunded_amount', v_refund_amount, 
        'remaining_deliveries', v_remaining_qty
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 6. Grant Permissions
GRANT ALL ON public.wallet_ledger TO authenticated;
GRANT ALL ON public.wallet_ledger TO service_role;

-- Grant Execute permissions to functions
GRANT EXECUTE ON FUNCTION public.count_remaining_deliveries TO authenticated;
GRANT EXECUTE ON FUNCTION public.count_remaining_deliveries TO service_role;

GRANT EXECUTE ON FUNCTION public.refund_order_to_wallet TO authenticated;
GRANT EXECUTE ON FUNCTION public.refund_order_to_wallet TO service_role;

GRANT EXECUTE ON FUNCTION public.refund_subscription_to_wallet TO authenticated;
GRANT EXECUTE ON FUNCTION public.refund_subscription_to_wallet TO service_role;
