-- Add missing fields for complete order tracking system
-- tracking_url for shipment tracking links
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS tracking_url text;

-- cancel_reason for storing cancellation reasons
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS cancel_reason text;

-- cancel_source to track if cancellation was manual or automatic
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS cancel_source text;

-- Email sent timestamps for tracking notification history
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS shipped_email_sent_at timestamp with time zone;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS cancelled_email_sent_at timestamp with time zone;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS payment_failed_email_sent_at timestamp with time zone;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS payment_reminder_sent_at timestamp with time zone;

-- Ecolet order ID for fetching AWB (the "orders to send" ID from Ecolet)
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS ecolet_order_id text;

-- Create index for payment reminders cron job
CREATE INDEX IF NOT EXISTS idx_orders_payment_status ON public.orders(payment_status);
CREATE INDEX IF NOT EXISTS idx_orders_payment_reminder ON public.orders(payment_status, created_at) WHERE payment_status = 'failed';