-- Update the trigger function to NOT overwrite order_number if it's already provided
CREATE OR REPLACE FUNCTION public.generate_order_number()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO 'public'
AS $function$
BEGIN
  -- Only generate order_number if it's not already set
  IF NEW.order_number IS NULL OR NEW.order_number = '' THEN
    NEW.order_number = 'VV-' || TO_CHAR(NOW(), 'YYYYMMDD') || '-' || LPAD(FLOOR(RANDOM() * 10000)::TEXT, 4, '0');
  END IF;
  RETURN NEW;
END;
$function$;