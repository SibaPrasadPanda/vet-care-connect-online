
-- Add prescription column to consultations table
ALTER TABLE public.consultations 
ADD COLUMN prescription TEXT;

-- Add a comment to describe the column
COMMENT ON COLUMN public.consultations.prescription IS 'Prescription text written by the doctor for the consultation';
