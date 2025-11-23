-- Create enums first
CREATE TYPE public.app_role AS ENUM ('customer', 'retailer', 'wholesaler');
CREATE TYPE public.product_category AS ENUM ('electronics', 'clothing', 'food', 'home', 'beauty', 'sports', 'books', 'toys', 'other');
CREATE TYPE public.order_status AS ENUM ('pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled');
CREATE TYPE public.order_type AS ENUM ('customer_to_retailer', 'retailer_to_wholesaler');