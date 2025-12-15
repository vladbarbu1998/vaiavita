-- Drop the existing check constraint
ALTER TABLE public.coupons DROP CONSTRAINT IF EXISTS coupons_scope_check;

-- Add the updated check constraint that includes 'order_total'
ALTER TABLE public.coupons ADD CONSTRAINT coupons_scope_check 
CHECK (scope IN ('all', 'product', 'products', 'category', 'order_total'));