
-- Update order_items foreign key to SET NULL when product is deleted
-- (keeps historical order data but removes product reference)
ALTER TABLE public.order_items 
DROP CONSTRAINT order_items_product_id_fkey;

ALTER TABLE public.order_items 
ADD CONSTRAINT order_items_product_id_fkey 
FOREIGN KEY (product_id) REFERENCES public.products(id) ON DELETE SET NULL;

-- Update coupons foreign key to SET NULL when product is deleted
ALTER TABLE public.coupons 
DROP CONSTRAINT coupons_product_id_fkey;

ALTER TABLE public.coupons 
ADD CONSTRAINT coupons_product_id_fkey 
FOREIGN KEY (product_id) REFERENCES public.products(id) ON DELETE SET NULL;
