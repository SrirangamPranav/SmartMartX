-- Fix the handle_new_user trigger function to use correct metadata field
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  INSERT INTO public.profiles (id, full_name, email_verified, auth_provider)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', 'User'),
    NEW.email_confirmed_at IS NOT NULL,
    CASE 
      WHEN NEW.raw_app_meta_data->>'provider' = 'google' THEN 'google'::auth_provider
      WHEN NEW.raw_app_meta_data->>'provider' = 'facebook' THEN 'facebook'::auth_provider
      ELSE 'email'::auth_provider
    END
  );
  RETURN NEW;
END;
$function$;