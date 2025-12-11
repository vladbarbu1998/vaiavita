-- Add coupon_number sequential ID
ALTER TABLE public.coupons 
ADD COLUMN coupon_number SERIAL;

-- Add product_ids for multiple product selection
ALTER TABLE public.coupons 
ADD COLUMN product_ids uuid[] DEFAULT '{}'::uuid[];

-- Add allowed_email for restricting coupon to specific email
ALTER TABLE public.coupons 
ADD COLUMN allowed_email text DEFAULT NULL;

-- Add review_id to track which review generated the coupon
ALTER TABLE public.coupons 
ADD COLUMN review_id uuid REFERENCES public.reviews(id) ON DELETE SET NULL;

-- Create index for coupon_number
CREATE INDEX idx_coupons_coupon_number ON public.coupons(coupon_number);

-- Create index for allowed_email lookups
CREATE INDEX idx_coupons_allowed_email ON public.coupons(allowed_email);

-- Update existing coupons to migrate product_id to product_ids if set
UPDATE public.coupons 
SET product_ids = ARRAY[product_id] 
WHERE product_id IS NOT NULL AND (product_ids IS NULL OR product_ids = '{}');