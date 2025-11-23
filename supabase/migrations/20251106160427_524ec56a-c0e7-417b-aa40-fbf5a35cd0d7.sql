-- Create function to automatically create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, email_verified, auth_provider)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', 'User'),
    NEW.email_confirmed_at IS NOT NULL,
    CASE 
      WHEN NEW.app_metadata->>'provider' = 'google' THEN 'google'::auth_provider
      WHEN NEW.app_metadata->>'provider' = 'facebook' THEN 'facebook'::auth_provider
      ELSE 'email'::auth_provider
    END
  );
  RETURN NEW;
END;
$$;

-- Create trigger to call the function on user signup
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();