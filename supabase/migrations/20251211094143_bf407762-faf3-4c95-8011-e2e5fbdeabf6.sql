-- Add product_number column with auto-increment
ALTER TABLE public.products 
ADD COLUMN product_number SERIAL;

-- Create unique index for product_number
CREATE UNIQUE INDEX idx_products_product_number ON public.products(product_number);