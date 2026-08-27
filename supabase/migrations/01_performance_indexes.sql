-- Migration: 01_performance_indexes.sql
-- Description: Adds high-performance B-tree composite indexes for MM Dairy Farm
-- Justification: Accelerates high-frequency SELECT queries (is_active, user_id, status, created_at, key)

-- 1. Products: Fast filtering on active products & sorting by name
CREATE INDEX IF NOT EXISTS idx_products_active_name 
ON public.products (is_active, name);

-- 2. Orders: Fast customer order history lookups sorted by date
CREATE INDEX IF NOT EXISTS idx_orders_user_created 
ON public.orders (user_id, created_at DESC);

-- 3. Orders: Fast status filtering for staff and delivery dashboards
CREATE INDEX IF NOT EXISTS idx_orders_status 
ON public.orders (status);

-- 4. Subscriptions: Fast active subscription items per user
CREATE INDEX IF NOT EXISTS idx_subscription_items_user_status 
ON public.subscription_items (user_id, status);

-- 5. Addresses: Fast default address lookups for checkout & order placement
CREATE INDEX IF NOT EXISTS idx_addresses_user_default 
ON public.addresses (user_id, is_default);

-- 6. Promo Codes: Fast active promo code verification at checkout
CREATE INDEX IF NOT EXISTS idx_promo_codes_active_code 
ON public.promo_codes (is_active, code);

-- 7. App Settings: Instant key-value lookups for homepage banners and announcements
CREATE INDEX IF NOT EXISTS idx_app_settings_key 
ON public.app_settings (key);
