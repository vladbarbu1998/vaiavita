-- Remove FORCE RLS which might be blocking inserts
ALTER TABLE public.orders NO FORCE ROW LEVEL SECURITY;
ALTER TABLE public.order_items NO FORCE ROW LEVEL SECURITY;

-- Ensure the anon role can use the INSERT policy
GRANT INSERT ON public.orders TO anon;
GRANT INSERT ON public.order_items TO anon;
GRANT USAGE ON SCHEMA public TO anon;