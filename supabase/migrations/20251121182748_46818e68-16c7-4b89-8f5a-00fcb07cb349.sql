-- Create enums for payment and delivery
CREATE TYPE payment_method_type AS ENUM ('card', 'upi', 'netbanking', 'cod');
CREATE TYPE payment_status AS ENUM ('pending', 'processing', 'completed', 'failed', 'refunded');
CREATE TYPE delivery_status AS ENUM ('pending', 'confirmed', 'packed', 'picked_up', 'in_transit', 'out_for_delivery', 'delivered', 'cancelled');
CREATE TYPE notification_type AS ENUM ('order_placed', 'payment_success', 'payment_failed', 'order_confirmed', 'order_packed', 'order_shipped', 'out_for_delivery', 'delivered', 'order_cancelled');

-- Payment Methods Table
CREATE TABLE public.payment_methods (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  method_type payment_method_type NOT NULL,
  card_last_four TEXT,
  card_brand TEXT,
  upi_id TEXT,
  is_default BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Payment Transactions Table
CREATE TABLE public.payment_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  transaction_id TEXT UNIQUE NOT NULL,
  order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  amount NUMERIC NOT NULL,
  payment_method_id UUID REFERENCES public.payment_methods(id),
  payment_method_type payment_method_type NOT NULL,
  status payment_status DEFAULT 'pending' NOT NULL,
  gateway_response JSONB,
  failure_reason TEXT,
  completed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Delivery Tracking Table
CREATE TABLE public.delivery_tracking (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID UNIQUE NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  delivery_partner_name TEXT NOT NULL,
  delivery_partner_phone TEXT NOT NULL,
  tracking_number TEXT UNIQUE NOT NULL,
  current_status delivery_status DEFAULT 'pending' NOT NULL,
  estimated_delivery_time TIMESTAMP WITH TIME ZONE NOT NULL,
  actual_delivery_time TIMESTAMP WITH TIME ZONE,
  current_latitude NUMERIC,
  current_longitude NUMERIC,
  delivery_notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Delivery Status History Table
CREATE TABLE public.delivery_status_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  delivery_tracking_id UUID NOT NULL REFERENCES public.delivery_tracking(id) ON DELETE CASCADE,
  status delivery_status NOT NULL,
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  location TEXT,
  latitude NUMERIC,
  longitude NUMERIC,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Notifications Table
CREATE TABLE public.notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  type notification_type NOT NULL,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  related_order_id UUID REFERENCES public.orders(id) ON DELETE CASCADE,
  related_transaction_id UUID REFERENCES public.payment_transactions(id) ON DELETE CASCADE,
  is_read BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Enable RLS
ALTER TABLE public.payment_methods ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payment_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.delivery_tracking ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.delivery_status_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- RLS Policies for payment_methods
CREATE POLICY "Users can view their own payment methods"
  ON public.payment_methods FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own payment methods"
  ON public.payment_methods FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own payment methods"
  ON public.payment_methods FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own payment methods"
  ON public.payment_methods FOR DELETE
  USING (auth.uid() = user_id);

-- RLS Policies for payment_transactions
CREATE POLICY "Users can view their own transactions"
  ON public.payment_transactions FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create transactions for their orders"
  ON public.payment_transactions FOR INSERT
  WITH CHECK (
    auth.uid() = user_id AND
    EXISTS (SELECT 1 FROM public.orders WHERE id = order_id AND buyer_id = auth.uid())
  );

CREATE POLICY "Sellers can view transactions for their orders"
  ON public.payment_transactions FOR SELECT
  USING (
    EXISTS (SELECT 1 FROM public.orders WHERE id = order_id AND seller_id = auth.uid())
  );

-- RLS Policies for delivery_tracking
CREATE POLICY "Buyers can view their delivery tracking"
  ON public.delivery_tracking FOR SELECT
  USING (
    EXISTS (SELECT 1 FROM public.orders WHERE id = order_id AND buyer_id = auth.uid())
  );

CREATE POLICY "Sellers can view and manage delivery for their orders"
  ON public.delivery_tracking FOR ALL
  USING (
    EXISTS (SELECT 1 FROM public.orders WHERE id = order_id AND seller_id = auth.uid())
  );

-- RLS Policies for delivery_status_history
CREATE POLICY "Users can view status history for their orders"
  ON public.delivery_status_history FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.delivery_tracking dt
      JOIN public.orders o ON o.id = dt.order_id
      WHERE dt.id = delivery_tracking_id 
      AND (o.buyer_id = auth.uid() OR o.seller_id = auth.uid())
    )
  );

CREATE POLICY "Sellers can insert status history for their orders"
  ON public.delivery_status_history FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.delivery_tracking dt
      JOIN public.orders o ON o.id = dt.order_id
      WHERE dt.id = delivery_tracking_id AND o.seller_id = auth.uid()
    )
  );

-- RLS Policies for notifications
CREATE POLICY "Users can view their own notifications"
  ON public.notifications FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own notifications"
  ON public.notifications FOR UPDATE
  USING (auth.uid() = user_id);

-- Security Functions
CREATE OR REPLACE FUNCTION public.generate_transaction_id()
RETURNS TEXT
LANGUAGE plpgsql
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

-- Triggers for updated_at columns
CREATE TRIGGER update_payment_methods_updated_at
  BEFORE UPDATE ON public.payment_methods
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_payment_transactions_updated_at
  BEFORE UPDATE ON public.payment_transactions
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_delivery_tracking_updated_at
  BEFORE UPDATE ON public.delivery_tracking
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Trigger to auto-create status history entry when delivery tracking status changes
CREATE OR REPLACE FUNCTION public.create_delivery_status_history()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
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

CREATE TRIGGER auto_create_delivery_status_history
  AFTER INSERT OR UPDATE ON public.delivery_tracking
  FOR EACH ROW
  EXECUTE FUNCTION public.create_delivery_status_history();

-- Indexes for performance
CREATE INDEX idx_payment_methods_user_id ON public.payment_methods(user_id);
CREATE INDEX idx_payment_transactions_user_id ON public.payment_transactions(user_id);
CREATE INDEX idx_payment_transactions_order_id ON public.payment_transactions(order_id);
CREATE INDEX idx_delivery_tracking_order_id ON public.delivery_tracking(order_id);
CREATE INDEX idx_delivery_status_history_tracking_id ON public.delivery_status_history(delivery_tracking_id);
CREATE INDEX idx_notifications_user_id ON public.notifications(user_id);
CREATE INDEX idx_notifications_is_read ON public.notifications(is_read);