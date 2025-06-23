
-- Add prescription column to appointments table
ALTER TABLE public.appointments 
ADD COLUMN prescription TEXT;

-- Add a comment to describe the column
COMMENT ON COLUMN public.appointments.prescription IS 'Prescription text written by the doctor for the appointment';
