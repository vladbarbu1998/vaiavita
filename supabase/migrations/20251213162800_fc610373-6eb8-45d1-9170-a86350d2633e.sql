-- Add Oblio invoice fields to orders table
ALTER TABLE public.orders 
ADD COLUMN IF NOT EXISTS oblio_invoice_number TEXT,
ADD COLUMN IF NOT EXISTS oblio_series_name TEXT,
ADD COLUMN IF NOT EXISTS oblio_invoice_link TEXT,
ADD COLUMN IF NOT EXISTS oblio_invoice_date TIMESTAMP WITH TIME ZONE;