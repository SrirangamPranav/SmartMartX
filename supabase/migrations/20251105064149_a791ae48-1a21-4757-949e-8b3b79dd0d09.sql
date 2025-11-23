-- Create retailer_products and wholesaler_products tables
CREATE TABLE public.retailer_products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  retailer_id UUID REFERENCES public.retailers(id) ON DELETE CASCADE NOT NULL,
  product_id UUID REFERENCES public.products(id) ON DELETE CASCADE NOT NULL,
  price DECIMAL(10, 2) NOT NULL,
  stock_quantity INTEGER DEFAULT 0 NOT NULL,
  is_available BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  UNIQUE(retailer_id, product_id)
);

ALTER TABLE public.retailer_products ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Customers can view available retailer products"
  ON public.retailer_products FOR SELECT
  USING (public.has_role(auth.uid(), 'customer') AND is_available = true);

CREATE POLICY "Retailers can view their own products"
  ON public.retailer_products FOR SELECT
  USING (public.has_role(auth.uid(), 'retailer') AND EXISTS (
    SELECT 1 FROM public.retailers WHERE id = retailer_id AND user_id = auth.uid()
  ));

CREATE POLICY "Retailers can manage their own products"
  ON public.retailer_products FOR ALL
  USING (public.has_role(auth.uid(), 'retailer') AND EXISTS (
    SELECT 1 FROM public.retailers WHERE id = retailer_id AND user_id = auth.uid()
  ));

CREATE TRIGGER update_retailer_products_updated_at
  BEFORE UPDATE ON public.retailer_products
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE public.wholesaler_products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  wholesaler_id UUID REFERENCES public.wholesalers(id) ON DELETE CASCADE NOT NULL,
  product_id UUID REFERENCES public.products(id) ON DELETE CASCADE NOT NULL,
  price DECIMAL(10, 2) NOT NULL,
  minimum_order_quantity INTEGER DEFAULT 1 NOT NULL,
  stock_quantity INTEGER DEFAULT 0 NOT NULL,
  is_available BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  UNIQUE(wholesaler_id, product_id)
);

ALTER TABLE public.wholesaler_products ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Retailers can view available wholesaler products"
  ON public.wholesaler_products FOR SELECT
  USING (public.has_role(auth.uid(), 'retailer') AND is_available = true);

CREATE POLICY "Wholesalers can view their own products"
  ON public.wholesaler_products FOR SELECT
  USING (public.has_role(auth.uid(), 'wholesaler') AND EXISTS (
    SELECT 1 FROM public.wholesalers WHERE id = wholesaler_id AND user_id = auth.uid()
  ));

CREATE POLICY "Wholesalers can manage their own products"
  ON public.wholesaler_products FOR ALL
  USING (public.has_role(auth.uid(), 'wholesaler') AND EXISTS (
    SELECT 1 FROM public.wholesalers WHERE id = wholesaler_id AND user_id = auth.uid()
  ));

CREATE TRIGGER update_wholesaler_products_updated_at
  BEFORE UPDATE ON public.wholesaler_products
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();