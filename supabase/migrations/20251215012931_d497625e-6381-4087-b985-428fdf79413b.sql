-- Adaugă noul status "card_paid" pentru comenzile plătite cu cardul
ALTER TYPE public.order_status ADD VALUE IF NOT EXISTS 'card_paid';