-- Phase 1: Stock Management System for B2B and B2C Orders

-- Function to update stocks when B2B order (retailer_to_wholesaler) is confirmed
CREATE OR REPLACE FUNCTION public.handle_b2b_order_confirmation()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  item RECORD;
  wholesaler_record RECORD;
  retailer_record RECORD;
  existing_retailer_product RECORD;
BEGIN
  -- Only proceed if order is being confirmed and it's a B2B order
  IF NEW.status = 'confirmed' 
     AND OLD.status = 'pending' 
     AND NEW.order_type = 'retailer_to_wholesaler' THEN
    
    -- Get wholesaler and retailer records
    SELECT w.id INTO wholesaler_record
    FROM wholesalers w
    WHERE w.user_id = NEW.seller_id;
    
    SELECT r.id INTO retailer_record
    FROM retailers r
    WHERE r.user_id = NEW.buyer_id;
    
    -- Loop through order items and update stocks
    FOR item IN 
      SELECT oi.product_id, oi.quantity, oi.unit_price
      FROM order_items oi
      WHERE oi.order_id = NEW.id
    LOOP
      -- First, check if wholesaler has enough stock
      IF NOT EXISTS (
        SELECT 1 FROM wholesaler_products
        WHERE product_id = item.product_id 
          AND wholesaler_id = wholesaler_record.id
          AND stock_quantity >= item.quantity
      ) THEN
        RAISE EXCEPTION 'Insufficient stock for product % at wholesaler', item.product_id;
      END IF;
      
      -- Decrease wholesaler stock
      UPDATE wholesaler_products
      SET 
        stock_quantity = stock_quantity - item.quantity,
        updated_at = NOW()
      WHERE product_id = item.product_id 
        AND wholesaler_id = wholesaler_record.id;
      
      -- Check if retailer already has this product
      SELECT id, stock_quantity, price INTO existing_retailer_product
      FROM retailer_products
      WHERE product_id = item.product_id 
        AND retailer_id = retailer_record.id;
      
      IF existing_retailer_product.id IS NOT NULL THEN
        -- Update existing retailer product (increase stock)
        UPDATE retailer_products
        SET 
          stock_quantity = stock_quantity + item.quantity,
          updated_at = NOW()
        WHERE id = existing_retailer_product.id;
      ELSE
        -- Create new retailer product entry with 20% markup
        INSERT INTO retailer_products (
          retailer_id, 
          product_id, 
          price, 
          stock_quantity, 
          is_available
        ) VALUES (
          retailer_record.id,
          item.product_id,
          item.unit_price * 1.20, -- Default 20% markup over wholesale price
          item.quantity,
          true
        );
      END IF;
    END LOOP;
    
    -- Create notification for retailer
    INSERT INTO notifications (
      user_id,
      type,
      title,
      message,
      related_order_id
    ) VALUES (
      NEW.buyer_id,
      'order_confirmed',
      'Order Approved',
      'Your product request #' || NEW.order_number || ' has been approved. Products added to your inventory.',
      NEW.id
    );
  END IF;
  
  RETURN NEW;
END;
$$;

-- Function to update retailer stock when customer order is confirmed
CREATE OR REPLACE FUNCTION public.handle_customer_order_confirmation()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  item RECORD;
  retailer_record RECORD;
BEGIN
  -- Only proceed if order is being confirmed and it's a B2C order
  IF NEW.status = 'confirmed' 
     AND OLD.status = 'pending' 
     AND NEW.order_type = 'customer_to_retailer' THEN
    
    -- Get retailer record
    SELECT r.id INTO retailer_record
    FROM retailers r
    WHERE r.user_id = NEW.seller_id;
    
    -- Loop through order items and update retailer stock
    FOR item IN 
      SELECT oi.product_id, oi.quantity
      FROM order_items oi
      WHERE oi.order_id = NEW.id
    LOOP
      -- Check if retailer has enough stock
      IF NOT EXISTS (
        SELECT 1 FROM retailer_products
        WHERE product_id = item.product_id 
          AND retailer_id = retailer_record.id
          AND stock_quantity >= item.quantity
      ) THEN
        RAISE EXCEPTION 'Insufficient stock for product % at retailer', item.product_id;
      END IF;
      
      -- Decrease retailer stock
      UPDATE retailer_products
      SET 
        stock_quantity = stock_quantity - item.quantity,
        updated_at = NOW()
      WHERE product_id = item.product_id 
        AND retailer_id = retailer_record.id;
    END LOOP;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Create trigger for B2B order confirmation
DROP TRIGGER IF EXISTS on_b2b_order_confirmed ON orders;
CREATE TRIGGER on_b2b_order_confirmed
  AFTER UPDATE ON orders
  FOR EACH ROW
  EXECUTE FUNCTION handle_b2b_order_confirmation();

-- Create trigger for customer order confirmation
DROP TRIGGER IF EXISTS on_customer_order_confirmed ON orders;
CREATE TRIGGER on_customer_order_confirmed
  AFTER UPDATE ON orders
  FOR EACH ROW
  EXECUTE FUNCTION handle_customer_order_confirmation();

-- Add constraints to prevent negative stock (if not already exists)
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'check_wholesaler_stock_positive'
  ) THEN
    ALTER TABLE wholesaler_products 
    ADD CONSTRAINT check_wholesaler_stock_positive 
    CHECK (stock_quantity >= 0);
  END IF;
END $$;

DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'check_retailer_stock_positive'
  ) THEN
    ALTER TABLE retailer_products 
    ADD CONSTRAINT check_retailer_stock_positive 
    CHECK (stock_quantity >= 0);
  END IF;
END $$;

-- Update RLS policy for B2B orders - retailers can create B2B orders
DROP POLICY IF EXISTS "Retailers can create B2B orders" ON orders;
CREATE POLICY "Retailers can create B2B orders"
ON orders
FOR INSERT
TO authenticated
WITH CHECK (
  auth.uid() = buyer_id 
  AND order_type = 'retailer_to_wholesaler'
  AND has_role(auth.uid(), 'retailer')
);

-- Wholesalers can update B2B order status (approve/reject)
DROP POLICY IF EXISTS "Wholesalers can update B2B order status" ON orders;
CREATE POLICY "Wholesalers can update B2B order status"
ON orders
FOR UPDATE
TO authenticated
USING (
  auth.uid() = seller_id 
  AND order_type = 'retailer_to_wholesaler'
  AND has_role(auth.uid(), 'wholesaler')
);

-- Retailers can view their B2B orders
DROP POLICY IF EXISTS "Retailers can view their B2B orders" ON orders;
CREATE POLICY "Retailers can view their B2B orders"
ON orders
FOR SELECT
TO authenticated
USING (
  auth.uid() = buyer_id 
  AND order_type = 'retailer_to_wholesaler'
  AND has_role(auth.uid(), 'retailer')
);

-- Wholesalers can view B2B orders placed to them
DROP POLICY IF EXISTS "Wholesalers can view B2B orders" ON orders;
CREATE POLICY "Wholesalers can view B2B orders"
ON orders
FOR SELECT
TO authenticated
USING (
  auth.uid() = seller_id 
  AND order_type = 'retailer_to_wholesaler'
  AND has_role(auth.uid(), 'wholesaler')
);