
-- Link 20 diverse products to both retailers (Agarwal and UrbanBuy) with retail pricing
-- Retail pricing is 25-30% higher than wholesale price

WITH selected_products AS (
  SELECT 
    wp.product_id,
    wp.price as wholesale_price,
    p.category
  FROM wholesaler_products wp
  JOIN products p ON p.id = wp.product_id
  WHERE wp.wholesaler_id = 'd892e81a-cb53-47de-a89c-85c6c776b204'
    AND wp.is_available = true
  ORDER BY p.created_at DESC
  LIMIT 20
)
INSERT INTO retailer_products (retailer_id, product_id, price, stock_quantity, is_available)
SELECT 
  r.id as retailer_id,
  sp.product_id,
  ROUND(sp.wholesale_price * 1.28, 2) as retail_price,  -- 28% markup
  CASE 
    WHEN sp.wholesale_price < 100 THEN 80
    WHEN sp.wholesale_price < 200 THEN 60
    WHEN sp.wholesale_price < 300 THEN 40
    ELSE 25
  END as stock_quantity,
  true as is_available
FROM selected_products sp
CROSS JOIN (
  SELECT id FROM retailers WHERE id IN (
    'a01bf23c-362f-499a-955d-e3b35ab1b104',  -- Agarwal
    'b94a5b86-9412-4840-946b-f745d1ddfecc'   -- UrbanBuy
  )
) r
WHERE NOT EXISTS (
  SELECT 1 FROM retailer_products rp 
  WHERE rp.product_id = sp.product_id 
  AND rp.retailer_id = r.id
);
