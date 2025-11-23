-- Create auth_provider enum
CREATE TYPE auth_provider AS ENUM ('email', 'google', 'facebook');

-- Add new columns to profiles table
ALTER TABLE public.profiles 
ADD COLUMN auth_provider auth_provider,
ADD COLUMN email_verified boolean DEFAULT false,
ADD COLUMN default_latitude numeric,
ADD COLUMN default_longitude numeric,
ADD COLUMN default_address text,
ADD COLUMN city text,
ADD COLUMN state text,
ADD COLUMN postal_code text,
ADD COLUMN country text;