
-- Drop the problematic policies
DROP POLICY IF EXISTS "Users can view their own consultations" ON consultations;
DROP POLICY IF EXISTS "Doctors can view all consultations" ON consultations;
DROP POLICY IF EXISTS "Users can insert their own consultations" ON consultations;
DROP POLICY IF EXISTS "Doctors can update consultations" ON consultations;
DROP POLICY IF EXISTS "Users can view their own appointments" ON appointments;
DROP POLICY IF EXISTS "Doctors can view all appointments" ON appointments;
DROP POLICY IF EXISTS "Users can insert their own appointments" ON appointments;
DROP POLICY IF EXISTS "Doctors can update appointments" ON appointments;

-- Create a security definer function to check user role
CREATE OR REPLACE FUNCTION public.get_user_role()
RETURNS TEXT AS $$
BEGIN
  RETURN auth.jwt() ->> 'user_metadata' ->> 'role';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- Create new policies for consultations that don't query auth.users directly
CREATE POLICY "Users can view their own consultations" ON consultations
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Doctors can view all consultations" ON consultations
    FOR SELECT USING (public.get_user_role() = 'doctor');

CREATE POLICY "Users can insert their own consultations" ON consultations
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Doctors can update consultations" ON consultations
    FOR UPDATE USING (public.get_user_role() = 'doctor');

-- Create new policies for appointments that don't query auth.users directly
CREATE POLICY "Users can view their own appointments" ON appointments
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Doctors can view all appointments" ON appointments
    FOR SELECT USING (public.get_user_role() = 'doctor');

CREATE POLICY "Users can insert their own appointments" ON appointments
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Doctors can update appointments" ON appointments
    FOR UPDATE USING (public.get_user_role() = 'doctor');
