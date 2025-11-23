
-- Insert products for Pranav Traders wholesaler
-- First insert all products, then link them to wholesaler

-- Electronics
INSERT INTO products (name, description, category, base_price) VALUES
('Boat Earbuds', 'Wireless bluetooth earbuds with premium sound quality', 'electronics', 350),
('USB Type-C Cable', 'Fast charging 1.5m cable with data transfer', 'electronics', 50),
('Power Bank 10000mAh', 'Portable charger with dual USB ports', 'electronics', 650),
-- Clothing
('Cotton T-Shirts (Plain)', 'Round neck, assorted colors, comfortable fit', 'clothing', 180),
('Denim Jeans', 'Classic fit, multiple sizes available', 'clothing', 650),
('Cotton Socks (Pack of 3)', 'Ankle length, assorted colors', 'clothing', 120),
-- Food
('Parle-G Biscuits', 'Family pack 500g, India''s favorite biscuit', 'food', 50),
-- Home
('Steel Utensil Set', '5-piece cookware set, premium quality', 'home', 1200),
('LED Bulb 9W', 'Energy saving white light, long lasting', 'home', 65),
('Plastic Storage Containers (Set)', '4-piece airtight containers for kitchen', 'home', 260),
-- Beauty
('Himalaya Face Wash', 'Neem & turmeric 100ml, natural ingredients', 'beauty', 95),
('Hair Oil 200ml', 'Coconut enriched, for healthy hair', 'beauty', 125),
('Soap Bar (Pack of 4)', 'Glycerin soap assorted fragrances', 'beauty', 140),
-- Sports
('Yoga Mat', 'Non-slip 6mm thick, perfect for workouts', 'sports', 400),
('Badminton Shuttlecock', 'Pack of 10 feather shuttles, tournament quality', 'sports', 220),
('Sports Water Bottle', '1L BPA-free plastic, leak-proof', 'sports', 140),
-- Books
('Camlin Exam Pad', '70 GSM ruled sheets 100 pages, quality paper', 'books', 80),
('Story Books Collection', 'Set of 5 children''s books, colorful illustrations', 'books', 350),
-- Toys
('Building Blocks Set', '100-piece plastic blocks, educational toy', 'toys', 450),
('Toy Cars (Pack of 5)', 'Die-cast metal cars, assorted models', 'toys', 260),
('Soft Plush Teddy Bear', 'Medium size 30cm, soft and cuddly', 'toys', 320),
-- Other
('Stationery Kit', 'Pens, pencils, erasers combo pack', 'other', 140),
('Cleaning Cloth (Pack of 10)', 'Microfiber multipurpose cleaning cloths', 'other', 175),
('Phone Accessories Kit', 'Screen guard, case, stand - complete kit', 'other', 210);

-- Now link all newly inserted products to the wholesaler
-- Using a subquery to get the product IDs by name and link them
INSERT INTO wholesaler_products (wholesaler_id, product_id, price, stock_quantity, minimum_order_quantity, is_available)
SELECT 
  'd892e81a-cb53-47de-a89c-85c6c776b204',
  p.id,
  CASE p.name
    WHEN 'Boat Earbuds' THEN 250
    WHEN 'USB Type-C Cable' THEN 35
    WHEN 'Power Bank 10000mAh' THEN 450
    WHEN 'Cotton T-Shirts (Plain)' THEN 120
    WHEN 'Denim Jeans' THEN 450
    WHEN 'Cotton Socks (Pack of 3)' THEN 80
    WHEN 'Parle-G Biscuits' THEN 35
    WHEN 'Steel Utensil Set' THEN 850
    WHEN 'LED Bulb 9W' THEN 45
    WHEN 'Plastic Storage Containers (Set)' THEN 180
    WHEN 'Himalaya Face Wash' THEN 65
    WHEN 'Hair Oil 200ml' THEN 85
    WHEN 'Soap Bar (Pack of 4)' THEN 95
    WHEN 'Yoga Mat' THEN 280
    WHEN 'Badminton Shuttlecock' THEN 150
    WHEN 'Sports Water Bottle' THEN 95
    WHEN 'Camlin Exam Pad' THEN 55
    WHEN 'Story Books Collection' THEN 250
    WHEN 'Building Blocks Set' THEN 320
    WHEN 'Toy Cars (Pack of 5)' THEN 180
    WHEN 'Soft Plush Teddy Bear' THEN 220
    WHEN 'Stationery Kit' THEN 95
    WHEN 'Cleaning Cloth (Pack of 10)' THEN 120
    WHEN 'Phone Accessories Kit' THEN 145
  END,
  CASE p.name
    WHEN 'Boat Earbuds' THEN 100
    WHEN 'USB Type-C Cable' THEN 500
    WHEN 'Power Bank 10000mAh' THEN 75
    WHEN 'Cotton T-Shirts (Plain)' THEN 300
    WHEN 'Denim Jeans' THEN 150
    WHEN 'Cotton Socks (Pack of 3)' THEN 400
    WHEN 'Parle-G Biscuits' THEN 800
    WHEN 'Steel Utensil Set' THEN 50
    WHEN 'LED Bulb 9W' THEN 600
    WHEN 'Plastic Storage Containers (Set)' THEN 200
    WHEN 'Himalaya Face Wash' THEN 300
    WHEN 'Hair Oil 200ml' THEN 250
    WHEN 'Soap Bar (Pack of 4)' THEN 400
    WHEN 'Yoga Mat' THEN 100
    WHEN 'Badminton Shuttlecock' THEN 150
    WHEN 'Sports Water Bottle' THEN 200
    WHEN 'Camlin Exam Pad' THEN 300
    WHEN 'Story Books Collection' THEN 80
    WHEN 'Building Blocks Set' THEN 120
    WHEN 'Toy Cars (Pack of 5)' THEN 150
    WHEN 'Soft Plush Teddy Bear' THEN 100
    WHEN 'Stationery Kit' THEN 250
    WHEN 'Cleaning Cloth (Pack of 10)' THEN 300
    WHEN 'Phone Accessories Kit' THEN 200
  END,
  CASE p.name
    WHEN 'Boat Earbuds' THEN 10
    WHEN 'USB Type-C Cable' THEN 50
    WHEN 'Power Bank 10000mAh' THEN 5
    WHEN 'Cotton T-Shirts (Plain)' THEN 20
    WHEN 'Denim Jeans' THEN 10
    WHEN 'Cotton Socks (Pack of 3)' THEN 30
    WHEN 'Parle-G Biscuits' THEN 50
    WHEN 'Steel Utensil Set' THEN 5
    WHEN 'LED Bulb 9W' THEN 50
    WHEN 'Plastic Storage Containers (Set)' THEN 20
    WHEN 'Himalaya Face Wash' THEN 25
    WHEN 'Hair Oil 200ml' THEN 20
    WHEN 'Soap Bar (Pack of 4)' THEN 30
    WHEN 'Yoga Mat' THEN 10
    WHEN 'Badminton Shuttlecock' THEN 15
    WHEN 'Sports Water Bottle' THEN 20
    WHEN 'Camlin Exam Pad' THEN 40
    WHEN 'Story Books Collection' THEN 10
    WHEN 'Building Blocks Set' THEN 10
    WHEN 'Toy Cars (Pack of 5)' THEN 15
    WHEN 'Soft Plush Teddy Bear' THEN 12
    WHEN 'Stationery Kit' THEN 25
    WHEN 'Cleaning Cloth (Pack of 10)' THEN 30
    WHEN 'Phone Accessories Kit' THEN 20
  END,
  true
FROM products p
WHERE p.name IN (
  'Boat Earbuds', 'USB Type-C Cable', 'Power Bank 10000mAh',
  'Cotton T-Shirts (Plain)', 'Denim Jeans', 'Cotton Socks (Pack of 3)',
  'Parle-G Biscuits', 'Steel Utensil Set', 'LED Bulb 9W',
  'Plastic Storage Containers (Set)', 'Himalaya Face Wash', 'Hair Oil 200ml',
  'Soap Bar (Pack of 4)', 'Yoga Mat', 'Badminton Shuttlecock',
  'Sports Water Bottle', 'Camlin Exam Pad', 'Story Books Collection',
  'Building Blocks Set', 'Toy Cars (Pack of 5)', 'Soft Plush Teddy Bear',
  'Stationery Kit', 'Cleaning Cloth (Pack of 10)', 'Phone Accessories Kit'
)
AND NOT EXISTS (
  SELECT 1 FROM wholesaler_products wp 
  WHERE wp.product_id = p.id 
  AND wp.wholesaler_id = 'd892e81a-cb53-47de-a89c-85c6c776b204'
);
