
-- Add AWB and courier columns to orders table
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS awb_number text;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS courier_name text;

-- Add index for faster AWB lookups
CREATE INDEX IF NOT EXISTS idx_orders_awb_number ON public.orders(awb_number) WHERE awb_number IS NOT NULL;
