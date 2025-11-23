-- Create retailers and wholesalers tables
CREATE TABLE public.retailers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL UNIQUE,
  business_name TEXT NOT NULL,
  business_address TEXT NOT NULL,
  latitude DECIMAL(10, 8),
  longitude DECIMAL(11, 8),
  delivery_radius_km DECIMAL(5, 2) DEFAULT 5.0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

ALTER TABLE public.retailers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Retailers can view their own data"
  ON public.retailers FOR SELECT
  USING (public.has_role(auth.uid(), 'retailer') AND auth.uid() = user_id);

CREATE POLICY "Customers can view active retailers"
  ON public.retailers FOR SELECT
  USING (public.has_role(auth.uid(), 'customer') AND is_active = true);

CREATE POLICY "Retailers can update their own data"
  ON public.retailers FOR UPDATE
  USING (public.has_role(auth.uid(), 'retailer') AND auth.uid() = user_id);

CREATE POLICY "Retailers can insert their own data"
  ON public.retailers FOR INSERT
  WITH CHECK (public.has_role(auth.uid(), 'retailer') AND auth.uid() = user_id);

CREATE TRIGGER update_retailers_updated_at
  BEFORE UPDATE ON public.retailers
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE public.wholesalers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL UNIQUE,
  business_name TEXT NOT NULL,
  business_address TEXT NOT NULL,
  latitude DECIMAL(10, 8),
  longitude DECIMAL(11, 8),
  service_areas TEXT[] DEFAULT '{}',
  minimum_order_value DECIMAL(10, 2) DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

ALTER TABLE public.wholesalers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Wholesalers can view their own data"
  ON public.wholesalers FOR SELECT
  USING (public.has_role(auth.uid(), 'wholesaler') AND auth.uid() = user_id);

CREATE POLICY "Retailers can view active wholesalers"
  ON public.wholesalers FOR SELECT
  USING (public.has_role(auth.uid(), 'retailer') AND is_active = true);

CREATE POLICY "Wholesalers can update their own data"
  ON public.wholesalers FOR UPDATE
  USING (public.has_role(auth.uid(), 'wholesaler') AND auth.uid() = user_id);

CREATE POLICY "Wholesalers can insert their own data"
  ON public.wholesalers FOR INSERT
  WITH CHECK (public.has_role(auth.uid(), 'wholesaler') AND auth.uid() = user_id);

CREATE TRIGGER update_wholesalers_updated_at
  BEFORE UPDATE ON public.wholesalers
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();