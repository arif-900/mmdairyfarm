-- Simple order creation without edge functions
-- This allows testing orders without deploying edge functions

-- Create a simple order directly in database
CREATE OR REPLACE FUNCTION create_simple_order(
  _user_id UUID,
  _total_amount DECIMAL,
  _shipping_address TEXT,
  _phone TEXT,
  _delivery_type TEXT,
  _payment_method TEXT,
  _product_name TEXT,
  _quantity INTEGER,
  _price DECIMAL
)
RETURNS UUID AS $$
DECLARE
  _order_id UUID;
  _product_id UUID;
BEGIN
  -- Create order
  INSERT INTO orders (user_id, total_amount, shipping_address, phone, delivery_type, payment_method, status)
  VALUES (_user_id, _total_amount, _shipping_address, _phone, _delivery_type, _payment_method, 'pending')
  RETURNING id INTO _order_id;
  
  -- Get product ID
  SELECT id INTO _product_id FROM products WHERE name = _product_name LIMIT 1;
  
  -- Create order item
  INSERT INTO order_items (order_id, product_id, product_name, quantity, price_at_order)
  VALUES (_order_id, _product_id, _product_name, _quantity, _price);
  
  RETURN _order_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;