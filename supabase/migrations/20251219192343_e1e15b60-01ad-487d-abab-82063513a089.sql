-- Add billing_address column to orders table
-- This will be used for invoices (Oblio)
-- shipping_address will be used only for delivery (locker/courier/pickup location)

ALTER TABLE public.orders 
ADD COLUMN billing_address jsonb NULL;

-- Add comment for clarity
COMMENT ON COLUMN public.orders.billing_address IS 'Customer billing address for invoices. Separate from shipping_address which is used for delivery.';
COMMENT ON COLUMN public.orders.shipping_address IS 'Delivery address (locker, courier). For pickup orders this may be null or contain the pickup location details.';