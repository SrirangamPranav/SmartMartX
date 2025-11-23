
-- Insert 30 new products into products table
INSERT INTO products (name, description, category, base_price) VALUES
-- Electronics (3)
('Wireless Mouse 2.4GHz', 'Optical mouse with USB receiver for laptops and PCs', 'electronics', 180),
('Mobile Phone Stand', 'Adjustable aluminum stand for desk and table', 'electronics', 95),
('Bluetooth Speaker Mini', 'Portable 5W speaker with wireless connectivity', 'electronics', 350),
-- Clothing (3)
('Formal Shirts (Men)', 'Cotton blend formal shirts in assorted colors', 'clothing', 380),
('Leggings (Women)', 'Stretchable cotton leggings pack of 2', 'clothing', 220),
('Kids T-Shirts', 'Colorful printed t-shirts sizes 2-10 years', 'clothing', 95),
-- Food (4)
('Tata Tea Gold', '1kg pack premium quality tea leaves', 'food', 420),
('Britannia Good Day Cookies', '200g pack assorted flavors', 'food', 45),
('Maggi Noodles', 'Pack of 12 masala flavor instant noodles', 'food', 120),
('Haldiram Namkeen', '400g bhujia traditional Indian snack', 'food', 85),
-- Home (3)
('Cotton Bed Sheets', 'Double bed sheets with pillow covers', 'home', 450),
('Wall Clock Digital', 'LED display wall clock with alarm function', 'home', 280),
('Plastic Dustbin', '25L dustbin with lid in assorted colors', 'home', 145),
-- Beauty (3)
('Sunscreen Lotion SPF 50', '100ml waterproof sun protection lotion', 'beauty', 175),
('Hair Serum', 'Anti-frizz hair serum 100ml bottle', 'beauty', 145),
('Nail Polish Set', '6 colors combo pack nail polish', 'beauty', 120),
-- Sports (3)
('Resistance Bands Set', '5 resistance bands with handles and accessories', 'sports', 220),
('Table Tennis Balls', 'Pack of 6 professional quality balls', 'sports', 85),
('Cotton Sports Towel', 'Quick dry sports towel 50x100cm', 'sports', 125),
-- Books (3)
('Classmate Notebooks', 'Pack of 6 single line notebooks', 'books', 180),
('Color Pencils Set', '24 shades color pencils in storage box', 'books', 95),
('General Knowledge Book', 'Latest edition 2024 GK book', 'books', 220),
-- Toys (4)
('Puzzle Games Set', '100 pieces jigsaw puzzle for kids', 'toys', 165),
('Musical Keyboard Toy', '37 keys electronic keyboard with lights', 'toys', 480),
('Remote Control Car', 'Racing car with battery and remote', 'toys', 420),
('Doll Set', '2 dolls with accessories and outfits', 'toys', 280),
-- Other (4)
('Umbrella Folding', 'Compact windproof folding umbrella', 'other', 195),
('Wall Stickers Decorative', 'Pack of 50 decorative design stickers', 'other', 85),
('Lunch Box Steel', '3 compartments insulated lunch box', 'other', 245),
('Mobile Back Covers', 'Assorted designs pack of 10 covers', 'other', 250);

-- Link all new products to Pranav Traders wholesaler
-- Get the 30 most recently added products and link them
INSERT INTO wholesaler_products (wholesaler_id, product_id, price, stock_quantity, minimum_order_quantity, is_available)
SELECT 
  'd892e81a-cb53-47de-a89c-85c6c776b204'::uuid,
  p.id,
  p.base_price,
  CASE 
    WHEN p.base_price < 100 THEN 400
    WHEN p.base_price < 200 THEN 250
    WHEN p.base_price < 300 THEN 180
    ELSE 120
  END as stock_quantity,
  CASE 
    WHEN p.base_price < 100 THEN 30
    WHEN p.base_price < 200 THEN 20
    WHEN p.base_price < 300 THEN 15
    ELSE 10
  END as minimum_order_quantity,
  true
FROM products p
WHERE p.name IN (
  'Wireless Mouse 2.4GHz', 'Mobile Phone Stand', 'Bluetooth Speaker Mini',
  'Formal Shirts (Men)', 'Leggings (Women)', 'Kids T-Shirts',
  'Tata Tea Gold', 'Britannia Good Day Cookies', 'Maggi Noodles', 'Haldiram Namkeen',
  'Cotton Bed Sheets', 'Wall Clock Digital', 'Plastic Dustbin',
  'Sunscreen Lotion SPF 50', 'Hair Serum', 'Nail Polish Set',
  'Resistance Bands Set', 'Table Tennis Balls', 'Cotton Sports Towel',
  'Classmate Notebooks', 'Color Pencils Set', 'General Knowledge Book',
  'Puzzle Games Set', 'Musical Keyboard Toy', 'Remote Control Car', 'Doll Set',
  'Umbrella Folding', 'Wall Stickers Decorative', 'Lunch Box Steel', 'Mobile Back Covers'
)
AND NOT EXISTS (
  SELECT 1 FROM wholesaler_products wp 
  WHERE wp.product_id = p.id 
  AND wp.wholesaler_id = 'd892e81a-cb53-47de-a89c-85c6c776b204'::uuid
);
