-- Add specifications column to products table
-- This will store structured specification data as JSONB
ALTER TABLE public.products 
ADD COLUMN IF NOT EXISTS specifications jsonb DEFAULT '{}';

-- Add a comment to describe the structure
COMMENT ON COLUMN public.products.specifications IS 'Structured product specifications: ingredients, weight, usage, etc.';