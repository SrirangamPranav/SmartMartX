
-- First, remove the incorrectly added products
DELETE FROM retailer_products 
WHERE retailer_id IN (
  'a01bf23c-362f-499a-955d-e3b35ab1b104',  -- Agarwal
  'b94a5b86-9412-4840-946b-f745d1ddfecc'   -- UrbanBuy
);

-- Get 35 diverse products from wholesaler (5 common + 15 for Agarwal + 15 for UrbanBuy)
WITH available_products AS (
  SELECT 
    wp.product_id,
    wp.price as wholesale_price,
    p.category,
    ROW_NUMBER() OVER (ORDER BY p.created_at DESC) as rn
  FROM wholesaler_products wp
  JOIN products p ON p.id = wp.product_id
  WHERE wp.wholesaler_id = 'd892e81a-cb53-47de-a89c-85c6c776b204'
    AND wp.is_available = true
  LIMIT 35
),
-- 5 common products (rows 1-5)
common_products AS (
  SELECT product_id, wholesale_price FROM available_products WHERE rn <= 5
),
-- 15 unique products for Agarwal (rows 6-20)
agarwal_unique AS (
  SELECT product_id, wholesale_price FROM available_products WHERE rn BETWEEN 6 AND 20
),
-- 15 unique products for UrbanBuy (rows 21-35)
urbanbuy_unique AS (
  SELECT product_id, wholesale_price FROM available_products WHERE rn BETWEEN 21 AND 35
)
-- Insert common products to both retailers
INSERT INTO retailer_products (retailer_id, product_id, price, stock_quantity, is_available)
-- Common products for Agarwal (30% markup)
SELECT 
  'a01bf23c-362f-499a-955d-e3b35ab1b104'::uuid,
  product_id,
  ROUND(wholesale_price * 1.30, 2),
  CASE 
    WHEN wholesale_price < 100 THEN 80
    WHEN wholesale_price < 200 THEN 60
    WHEN wholesale_price < 300 THEN 40
    ELSE 25
  END,
  true
FROM common_products

UNION ALL

-- Common products for UrbanBuy (20% markup)
SELECT 
  'b94a5b86-9412-4840-946b-f745d1ddfecc'::uuid,
  product_id,
  ROUND(wholesale_price * 1.20, 2),
  CASE 
    WHEN wholesale_price < 100 THEN 75
    WHEN wholesale_price < 200 THEN 55
    WHEN wholesale_price < 300 THEN 35
    ELSE 20
  END,
  true
FROM common_products

UNION ALL

-- Unique products for Agarwal (30% markup)
SELECT 
  'a01bf23c-362f-499a-955d-e3b35ab1b104'::uuid,
  product_id,
  ROUND(wholesale_price * 1.30, 2),
  CASE 
    WHEN wholesale_price < 100 THEN 80
    WHEN wholesale_price < 200 THEN 60
    WHEN wholesale_price < 300 THEN 40
    ELSE 25
  END,
  true
FROM agarwal_unique

UNION ALL

-- Unique products for UrbanBuy (20% markup)
SELECT 
  'b94a5b86-9412-4840-946b-f745d1ddfecc'::uuid,
  product_id,
  ROUND(wholesale_price * 1.20, 2),
  CASE 
    WHEN wholesale_price < 100 THEN 75
    WHEN wholesale_price < 200 THEN 55
    WHEN wholesale_price < 300 THEN 35
    ELSE 20
  END,
  true
FROM urbanbuy_unique;
