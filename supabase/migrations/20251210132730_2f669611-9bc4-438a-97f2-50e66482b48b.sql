-- Add product_id and category_id columns to coupons table for targeted discounts
ALTER TABLE public.coupons 
ADD COLUMN product_id uuid REFERENCES public.products(id) ON DELETE SET NULL,
ADD COLUMN category_id uuid REFERENCES public.categories(id) ON DELETE SET NULL;

-- Add a scope column to indicate if coupon is for all, product, or category
ALTER TABLE public.coupons 
ADD COLUMN scope text NOT NULL DEFAULT 'all' CHECK (scope IN ('all', 'product', 'category'));

-- Create indexes for better query performance
CREATE INDEX idx_coupons_product_id ON public.coupons(product_id) WHERE product_id IS NOT NULL;
CREATE INDEX idx_coupons_category_id ON public.coupons(category_id) WHERE category_id IS NOT NULL;