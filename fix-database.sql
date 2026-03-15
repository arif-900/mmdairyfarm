-- Fix orders table and add admin policies

-- Create order status enum if it doesn't exist
DO $$ BEGIN
    CREATE TYPE order_status AS ENUM ('pending', 'paid', 'processing', 'shipped', 'delivered', 'cancelled');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Remove default constraint first, then update column type
ALTER TABLE orders ALTER COLUMN status DROP DEFAULT;
ALTER TABLE orders ALTER COLUMN status TYPE order_status USING status::order_status;
ALTER TABLE orders ALTER COLUMN status SET DEFAULT 'pending'::order_status;

-- Admin policies for orders (simplified)
DROP POLICY IF EXISTS "Admins can view all orders" ON orders;
DROP POLICY IF EXISTS "Admins can update all orders" ON orders;
CREATE POLICY "Admins can view all orders" ON orders FOR SELECT USING (
  auth.uid() IN (SELECT user_id FROM profiles WHERE role = 'admin')
);
CREATE POLICY "Admins can update all orders" ON orders FOR UPDATE USING (
  auth.uid() IN (SELECT user_id FROM profiles WHERE role = 'admin')
);

-- Admin policies for order_items (simplified)
DROP POLICY IF EXISTS "Admins can view all order items" ON order_items;
CREATE POLICY "Admins can view all order items" ON order_items FOR SELECT USING (
  auth.uid() IN (SELECT user_id FROM profiles WHERE role = 'admin')
);

-- Fix profile policies - remove circular references
DROP POLICY IF EXISTS "Users can insert own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
DROP POLICY IF EXISTS "Users can manage own profile" ON profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON profiles;

-- Simple profile policies without circular references
CREATE POLICY "Users can view own profile" ON profiles FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own profile" ON profiles FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own profile" ON profiles FOR UPDATE USING (auth.uid() = user_id);

-- Admin policies for orders (simplified)
DROP POLICY IF EXISTS "Admins can view all orders" ON orders;
DROP POLICY IF EXISTS "Admins can update all orders" ON orders;
CREATE POLICY "Admins can view all orders" ON orders FOR SELECT USING (
  auth.uid() IN (SELECT user_id FROM profiles WHERE role = 'admin')
);
CREATE POLICY "Admins can update all orders" ON orders FOR UPDATE USING (
  auth.uid() IN (SELECT user_id FROM profiles WHERE role = 'admin')
);

-- Add trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_orders_updated_at ON orders;
CREATE TRIGGER update_orders_updated_at BEFORE UPDATE ON orders
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_profiles_updated_at ON profiles;
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON profiles
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();