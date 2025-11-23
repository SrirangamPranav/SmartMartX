-- Fix search_path for security functions
CREATE OR REPLACE FUNCTION public.generate_transaction_id()
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  new_id TEXT;
BEGIN
  new_id := 'TXN' || UPPER(substring(md5(random()::text || clock_timestamp()::text) from 1 for 12));
  RETURN new_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.generate_tracking_number()
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  new_id TEXT;
BEGIN
  new_id := 'TRK' || UPPER(substring(md5(random()::text || clock_timestamp()::text) from 1 for 10));
  RETURN new_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.validate_order_status_transition(
  current_status delivery_status,
  new_status delivery_status
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Define valid transitions
  IF current_status = 'pending' AND new_status IN ('confirmed', 'cancelled') THEN
    RETURN TRUE;
  ELSIF current_status = 'confirmed' AND new_status IN ('packed', 'cancelled') THEN
    RETURN TRUE;
  ELSIF current_status = 'packed' AND new_status IN ('picked_up', 'cancelled') THEN
    RETURN TRUE;
  ELSIF current_status = 'picked_up' AND new_status IN ('in_transit', 'cancelled') THEN
    RETURN TRUE;
  ELSIF current_status = 'in_transit' AND new_status IN ('out_for_delivery', 'cancelled') THEN
    RETURN TRUE;
  ELSIF current_status = 'out_for_delivery' AND new_status IN ('delivered', 'cancelled') THEN
    RETURN TRUE;
  ELSE
    RETURN FALSE;
  END IF;
END;
$$;

CREATE OR REPLACE FUNCTION public.create_delivery_status_history()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF (TG_OP = 'INSERT') OR (OLD.current_status IS DISTINCT FROM NEW.current_status) THEN
    INSERT INTO public.delivery_status_history (
      delivery_tracking_id,
      status,
      timestamp,
      latitude,
      longitude
    ) VALUES (
      NEW.id,
      NEW.current_status,
      now(),
      NEW.current_latitude,
      NEW.current_longitude
    );
  END IF;
  RETURN NEW;
END;
$$;