-- Migration: 20260830000001_standardize_coins_and_delivery_rules.sql
-- Description: Enforces 4 Coins = ₹1 conversion rule in wallet refund functions, ledger credits, and conversion helpers.

-- 1. Create SQL Helper Functions for Coin Conversion
CREATE OR REPLACE FUNCTION public.coins_to_rupees(coins INTEGER)
RETURNS NUMERIC AS $$
BEGIN
    IF coins IS NULL OR coins <= 0 THEN
        RETURN 0;
    END IF;
    RETURN ROUND((coins * 0.25)::numeric, 2);
END;
$$ LANGUAGE plpgsql IMMUTABLE;

CREATE OR REPLACE FUNCTION public.rupees_to_coins(rupees NUMERIC)
RETURNS INTEGER AS $$
BEGIN
    IF rupees IS NULL OR rupees <= 0 THEN
        RETURN 0;
    END IF;
    RETURN FLOOR(rupees * 4)::integer;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- 2. Update Function: Refund One-Time Order to Wallet (4 Coins = ₹1)
CREATE OR REPLACE FUNCTION public.refund_order_to_wallet(p_order_id UUID)
RETURNS JSONB AS $$
DECLARE
    v_order RECORD;
    v_coins_to_credit INTEGER;
BEGIN
    -- 1. Lock and get order
    SELECT * INTO v_order FROM public.orders WHERE id = p_order_id FOR UPDATE;
    IF NOT FOUND THEN RETURN jsonb_build_object('success', false, 'message', 'Order not found'); END IF;
    IF v_order.status = 'cancelled' THEN RETURN jsonb_build_object('success', false, 'message', 'Order already cancelled'); END IF;

    -- 2. Calculate coins (4 Coins = ₹1)
    v_coins_to_credit := FLOOR(v_order.total_amount * 4)::integer;

    -- 3. Credit Profile with reward_coins
    UPDATE public.profiles 
    SET reward_coins = reward_coins + v_coins_to_credit
    WHERE user_id = v_order.user_id;

    -- 4. Update Order Status
    UPDATE public.orders 
    SET status = 'cancelled', 
        refund_status = 'full_to_wallet',
        refund_id = 'WALLET-' || p_order_id::text
    WHERE id = p_order_id;

    -- 5. Record in Ledger (amount in Coins)
    INSERT INTO public.wallet_ledger (user_id, amount, type, reason, metadata)
    VALUES (
        v_order.user_id, 
        v_coins_to_credit, 
        'credit', 
        'Refund for cancelled order #' || upper(left(p_order_id::text, 8)) || ' (' || v_coins_to_credit || ' Coins = ₹' || v_order.total_amount || ')',
        jsonb_build_object('order_id', p_order_id, 'rupee_value', v_order.total_amount, 'coins_credited', v_coins_to_credit)
    );

    RETURN jsonb_build_object('success', true, 'refunded_amount', v_order.total_amount, 'coins_credited', v_coins_to_credit);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Update Function: Refund Subscription Item to Wallet (4 Coins = ₹1)
CREATE OR REPLACE FUNCTION public.refund_subscription_to_wallet(p_item_id UUID)
RETURNS JSONB AS $$
DECLARE
    v_item RECORD;
    v_remaining_qty INTEGER;
    v_refund_amount NUMERIC;
    v_coins_to_credit INTEGER;
BEGIN
    -- 1. Lock and get item
    SELECT si.*, s.user_id INTO v_item 
    FROM public.subscription_items si
    JOIN public.subscriptions s ON si.subscription_id = s.id
    WHERE si.id = p_item_id 
    FOR UPDATE;

    IF NOT FOUND THEN RETURN jsonb_build_object('success', false, 'message', 'Subscription item not found'); END IF;
    IF v_item.status = 'cancelled' THEN RETURN jsonb_build_object('success', false, 'message', 'Already cancelled'); END IF;

    -- 2. Calculate remaining deliveries & refund amount in Rupees
    v_remaining_qty := public.count_remaining_deliveries(
        GREATEST(v_item.next_delivery_date, CURRENT_DATE),
        v_item.end_date,
        v_item.plan_type,
        v_item.delivery_time
    );

    v_refund_amount := v_remaining_qty * (v_item.price_per_unit * v_item.quantity);
    v_coins_to_credit := FLOOR(v_refund_amount * 4)::integer;

    -- 3. Update status
    UPDATE public.subscription_items 
    SET status = 'cancelled' 
    WHERE id = p_item_id;

    -- 4. Credit Wallet if amount > 0
    IF v_refund_amount > 0 THEN
        UPDATE public.profiles 
        SET reward_coins = reward_coins + v_coins_to_credit
        WHERE user_id = v_item.user_id;

        -- 5. Record in Ledger
        INSERT INTO public.wallet_ledger (user_id, amount, type, reason, metadata)
        VALUES (
            v_item.user_id, 
            v_coins_to_credit, 
            'credit', 
            'Refund for cancelled subscription #' || upper(left(p_item_id::text, 8)) || ' (' || v_coins_to_credit || ' Coins = ₹' || v_refund_amount || ')',
            jsonb_build_object('subscription_item_id', p_item_id, 'remaining_deliveries', v_remaining_qty, 'rupee_value', v_refund_amount, 'coins_credited', v_coins_to_credit)
        );
    END IF;

    RETURN jsonb_build_object(
        'success', true, 
        'refunded_amount', v_refund_amount, 
        'coins_credited', v_coins_to_credit,
        'remaining_deliveries', v_remaining_qty
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. Grant Permissions
GRANT EXECUTE ON FUNCTION public.coins_to_rupees TO authenticated, service_role, anon;
GRANT EXECUTE ON FUNCTION public.rupees_to_coins TO authenticated, service_role, anon;
