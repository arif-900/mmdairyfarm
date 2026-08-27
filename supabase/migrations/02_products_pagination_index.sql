-- Performance indexes for server-side pagination, category filtering, and name search
CREATE INDEX IF NOT EXISTS idx_products_active_category_name 
ON public.products (is_active, category_id, name);

CREATE INDEX IF NOT EXISTS idx_products_active_created_desc 
ON public.products (is_active, created_at DESC);
