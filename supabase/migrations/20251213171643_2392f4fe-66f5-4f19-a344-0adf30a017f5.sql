-- Add new order status for personal pickup ready
ALTER TYPE order_status ADD VALUE IF NOT EXISTS 'pregatita_ridicare';