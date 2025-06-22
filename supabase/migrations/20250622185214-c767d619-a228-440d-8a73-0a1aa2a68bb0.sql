
-- Update the get_user_role function to properly handle type casting
CREATE OR REPLACE FUNCTION public.get_user_role()
RETURNS TEXT AS $$
BEGIN
  RETURN COALESCE(
    (auth.jwt() -> 'user_metadata' ->> 'role')::text,
    ''
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;
