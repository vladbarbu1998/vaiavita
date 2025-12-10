-- Add related_products column to products table
ALTER TABLE public.products 
ADD COLUMN related_products UUID[] DEFAULT '{}'::UUID[];