-- Create customer_addresses table for multiple delivery addresses
CREATE TABLE public.customer_addresses (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  label TEXT NOT NULL, -- Home, Office, Custom
  address_line1 TEXT NOT NULL,
  address_line2 TEXT,
  city TEXT NOT NULL,
  state TEXT NOT NULL,
  postal_code TEXT NOT NULL,
  country TEXT NOT NULL DEFAULT 'India',
  latitude NUMERIC,
  longitude NUMERIC,
  is_default BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.customer_addresses ENABLE ROW LEVEL SECURITY;

-- Customers can view their own addresses
CREATE POLICY "Customers can view their own addresses"
ON public.customer_addresses
FOR SELECT
USING (auth.uid() = user_id);

-- Customers can create their own addresses
CREATE POLICY "Customers can create their own addresses"
ON public.customer_addresses
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Customers can update their own addresses
CREATE POLICY "Customers can update their own addresses"
ON public.customer_addresses
FOR UPDATE
USING (auth.uid() = user_id);

-- Customers can delete their own addresses
CREATE POLICY "Customers can delete their own addresses"
ON public.customer_addresses
FOR DELETE
USING (auth.uid() = user_id);

-- Trigger for updated_at
CREATE TRIGGER update_customer_addresses_updated_at
BEFORE UPDATE ON public.customer_addresses
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Add foreign key constraint for cart_items to products table
ALTER TABLE public.cart_items
DROP CONSTRAINT IF EXISTS cart_items_product_id_fkey,
ADD CONSTRAINT cart_items_product_id_fkey
  FOREIGN KEY (product_id)
  REFERENCES public.products(id)
  ON DELETE CASCADE;

-- Add foreign key constraint for cart_items seller_id to profiles table
ALTER TABLE public.cart_items
DROP CONSTRAINT IF EXISTS cart_items_seller_id_fkey,
ADD CONSTRAINT cart_items_seller_id_fkey
  FOREIGN KEY (seller_id)
  REFERENCES public.profiles(id)
  ON DELETE CASCADE;