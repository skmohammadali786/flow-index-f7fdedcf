-- Improved handle_new_user function with better security practices
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  sanitized_name text;
BEGIN
  -- Validate NEW.id exists
  IF NEW.id IS NULL THEN
    RAISE EXCEPTION 'User ID cannot be null';
  END IF;

  -- Sanitize name: trim whitespace, limit length, remove potential injection characters
  sanitized_name := COALESCE(
    LEFT(
      TRIM(
        REGEXP_REPLACE(
          COALESCE(NEW.raw_user_meta_data->>'name', ''),
          '[<>\"'';]',
          '',
          'g'
        )
      ),
      100
    ),
    ''
  );

  -- Insert profile with sanitized data
  INSERT INTO public.profiles (user_id, name)
  VALUES (NEW.id, sanitized_name);
  
  -- Insert default settings
  INSERT INTO public.user_settings (user_id)
  VALUES (NEW.id);
  
  RETURN NEW;

EXCEPTION
  WHEN unique_violation THEN
    -- Profile or settings already exist, skip silently
    RETURN NEW;
  WHEN OTHERS THEN
    -- Log error but don't block user creation
    RAISE WARNING 'Error in handle_new_user for user %: %', NEW.id, SQLERRM;
    RETURN NEW;
END;
$$;