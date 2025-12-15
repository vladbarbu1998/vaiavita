-- Add column to track confirmation email sent
ALTER TABLE public.orders 
ADD COLUMN IF NOT EXISTS confirmation_email_sent_at TIMESTAMP WITH TIME ZONE DEFAULT NULL;