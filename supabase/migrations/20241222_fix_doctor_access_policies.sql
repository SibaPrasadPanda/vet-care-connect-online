
-- Enable RLS on consultations table if not already enabled
ALTER TABLE consultations ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view their own consultations" ON consultations;
DROP POLICY IF EXISTS "Doctors can view all consultations" ON consultations;
DROP POLICY IF EXISTS "Users can insert their own consultations" ON consultations;
DROP POLICY IF EXISTS "Doctors can update consultations" ON consultations;

-- Create new policies for consultations
CREATE POLICY "Users can view their own consultations" ON consultations
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Doctors can view all consultations" ON consultations
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM auth.users 
            WHERE auth.users.id = auth.uid() 
            AND auth.users.raw_user_meta_data->>'role' = 'doctor'
        )
    );

CREATE POLICY "Users can insert their own consultations" ON consultations
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Doctors can update consultations" ON consultations
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM auth.users 
            WHERE auth.users.id = auth.uid() 
            AND auth.users.raw_user_meta_data->>'role' = 'doctor'
        )
    );

-- Enable RLS on appointments table if not already enabled
ALTER TABLE appointments ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view their own appointments" ON appointments;
DROP POLICY IF EXISTS "Doctors can view all appointments" ON appointments;
DROP POLICY IF EXISTS "Users can insert their own appointments" ON appointments;
DROP POLICY IF EXISTS "Doctors can update appointments" ON appointments;

-- Create new policies for appointments
CREATE POLICY "Users can view their own appointments" ON appointments
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Doctors can view all appointments" ON appointments
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM auth.users 
            WHERE auth.users.id = auth.uid() 
            AND auth.users.raw_user_meta_data->>'role' = 'doctor'
        )
    );

CREATE POLICY "Users can insert their own appointments" ON appointments
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Doctors can update appointments" ON appointments
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM auth.users 
            WHERE auth.users.id = auth.uid() 
            AND auth.users.raw_user_meta_data->>'role' = 'doctor'
        )
    );
