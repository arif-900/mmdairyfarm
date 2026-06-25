-- Robust migration to ensure cart system exists and is updated

-- 1. Ensure Carts table exists
CREATE TABLE IF NOT EXISTS carts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- 2. Ensure Cart Items table exists
CREATE TABLE IF NOT EXISTS cart_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    cart_id UUID REFERENCES carts(id) ON DELETE CASCADE NOT NULL,
    product_id UUID REFERENCES products(id) ON DELETE CASCADE NOT NULL,
    quantity INTEGER NOT NULL DEFAULT 1 CHECK (quantity > 0),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    UNIQUE (cart_id, product_id)
);

-- 3. Add missing columns for weight and selection
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='cart_items' AND column_name='selected_weight') THEN
        ALTER TABLE cart_items ADD COLUMN selected_weight NUMERIC;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='cart_items' AND column_name='unit_type') THEN
        ALTER TABLE cart_items ADD COLUMN unit_type TEXT;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='cart_items' AND column_name='selected') THEN
        ALTER TABLE cart_items ADD COLUMN selected BOOLEAN DEFAULT TRUE;
    END IF;
END $$;

-- 4. Enable RLS
ALTER TABLE carts ENABLE ROW LEVEL SECURITY;
ALTER TABLE cart_items ENABLE ROW LEVEL SECURITY;

-- 5. Policies
DO $$ 
BEGIN
    -- Carts Policy
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'carts' AND policyname = 'Users can manage their own carts') THEN
        CREATE POLICY "Users can manage their own carts" ON carts
            FOR ALL USING (auth.uid() = user_id);
    END IF;

    -- Cart Items Policy
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'cart_items' AND policyname = 'Users can manage their own cart items') THEN
        CREATE POLICY "Users can manage their own cart items" ON cart_items
            FOR ALL USING (
                EXISTS (
                    SELECT 1 FROM carts 
                    WHERE carts.id = cart_items.cart_id 
                    AND carts.user_id = auth.uid()
                )
            );
    END IF;
END $$;
