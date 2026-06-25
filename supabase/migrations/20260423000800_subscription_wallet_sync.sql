-- Migration: Subscription Wallet Sync
-- Date: 2026-04-23 00:08:00

-- 1. Add audit columns to subscription_items
ALTER TABLE public.subscription_items 
ADD COLUMN IF NOT EXISTS coins_used NUMERIC DEFAULT 0,
ADD COLUMN IF NOT EXISTS coins_earned NUMERIC DEFAULT 0;

-- 3. Atomic Activation Function
CREATE OR REPLACE FUNCTION public.activate_subscription_v2(
    p_user_id UUID,
    p_address TEXT,
    p_product_id UUID,
    p_quantity INTEGER,
    p_selected_weight INTEGER,
    p_unit_type TEXT,
    p_plan_type TEXT,
    p_delivery_time TEXT,
    p_start_date DATE,
    p_end_date DATE,
    p_price_per_unit NUMERIC,
    p_coins_used NUMERIC DEFAULT 0
) RETURNS JSONB AS $$
DECLARE
    v_sub_id UUID;
    v_profile RECORD;
    v_coins_earned INTEGER;
    v_total_payable NUMERIC;
    v_item_id UUID;
BEGIN
    -- 1. Check Profile & Coins
    SELECT * INTO v_profile FROM public.profiles WHERE user_id = p_user_id FOR UPDATE;
    IF v_profile.reward_coins < p_coins_used THEN
        RETURN jsonb_build_object('success', false, 'message', 'Insufficient coins');
    END IF;

    -- 2. Deduct Coins & Record Ledger
    IF p_coins_used > 0 THEN
        UPDATE public.profiles SET reward_coins = reward_coins - p_coins_used WHERE user_id = p_user_id;
        
        INSERT INTO public.wallet_ledger (user_id, amount, type, reason, metadata)
        VALUES (
            p_user_id, 
            p_coins_used, 
            'debit', 
            'Used for subscription purchase',
            jsonb_build_object('product_id', p_product_id, 'plan_type', p_plan_type)
        );
    END IF;

    -- 3. Calculate Coins to Earn (3% of final amount)
    -- Note: Price calc logic should be mirrored here for security
    v_total_payable := (p_price_per_unit * p_quantity * public.count_remaining_deliveries(p_start_date, p_end_date, p_plan_type, p_delivery_time)) - p_coins_used;
    v_coins_earned := floor(GREATEST(0, v_total_payable) * 0.03);

    -- 4. Create Subscription Header
    INSERT INTO public.subscriptions (user_id, address)
    VALUES (p_user_id, p_address)
    RETURNING id INTO v_sub_id;

    -- 5. Create Subscription Item
    INSERT INTO public.subscription_items (
        subscription_id, product_id, quantity, selected_weight, unit_type, 
        plan_type, delivery_time, start_date, end_date, next_delivery_date, 
        status, price_per_unit, payment_status, coins_used, coins_earned
    )
    VALUES (
        v_sub_id, p_product_id, p_quantity, p_selected_weight, p_unit_type, 
        p_plan_type::subscription_plan_type, p_delivery_time::delivery_time_slot, p_start_date, p_end_date, p_start_date, 
        'active', p_price_per_unit, 'paid', p_coins_used, v_coins_earned
    )
    RETURNING id INTO v_item_id;

    RETURN jsonb_build_object(
        'success', true, 
        'subscription_id', v_sub_id, 
        'item_id', v_item_id,
        'coins_used', p_coins_used,
        'coins_earned', v_coins_earned
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant permissions for RPC access
GRANT EXECUTE ON FUNCTION public.activate_subscription_v2 TO authenticated;
GRANT EXECUTE ON FUNCTION public.activate_subscription_v2 TO service_role;


-- 4. Add index for faster ledger lookups
CREATE INDEX IF NOT EXISTS idx_wallet_ledger_user_id ON public.wallet_ledger(user_id);
CREATE INDEX IF NOT EXISTS idx_wallet_ledger_created_at ON public.wallet_ledger(created_at DESC);
