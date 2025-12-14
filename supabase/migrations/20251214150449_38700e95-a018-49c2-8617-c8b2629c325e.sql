-- Remove duplicate SELECT policy
DROP POLICY IF EXISTS "Admins can view all orders" ON public.orders;

-- Verify orders table has RLS enabled
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;

-- Force RLS to apply to table owner as well (important!)
ALTER TABLE public.orders FORCE ROW LEVEL SECURITY;