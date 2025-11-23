-- Update tracking number generation to be shorter
CREATE OR REPLACE FUNCTION public.generate_tracking_number()
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  new_id TEXT;
BEGIN
  -- Generate TRK followed by 6 random alphanumeric characters
  new_id := 'TRK' || UPPER(substring(md5(random()::text || clock_timestamp()::text) from 1 for 6));
  RETURN new_id;
END;
$function$;

-- Create function to generate shorter order numbers
CREATE OR REPLACE FUNCTION public.generate_order_number()
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  new_id TEXT;
BEGIN
  -- Generate ORD followed by 6 random alphanumeric characters
  new_id := 'ORD' || UPPER(substring(md5(random()::text || clock_timestamp()::text) from 1 for 6));
  RETURN new_id;
END;
$function$;

-- Update orders table to use the new function as default
ALTER TABLE public.orders 
ALTER COLUMN order_number SET DEFAULT generate_order_number();