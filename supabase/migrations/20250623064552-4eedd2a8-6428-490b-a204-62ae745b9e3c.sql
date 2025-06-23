
-- First, let's see what status values currently exist in the appointments table
SELECT DISTINCT status FROM public.appointments;

-- Drop the existing check constraint
ALTER TABLE public.appointments DROP CONSTRAINT IF EXISTS appointments_status_check;

-- Update any non-standard status values to our expected ones
UPDATE public.appointments 
SET status = CASE 
    WHEN status = 'confirmed' AND (prescription IS NOT NULL AND prescription != '') THEN 'completed'
    WHEN status = 'confirmed' THEN 'assigned'
    WHEN status NOT IN ('pending', 'assigned', 'completed', 'cancelled') THEN 'pending'
    ELSE status
END;

-- Now add the new check constraint
ALTER TABLE public.appointments ADD CONSTRAINT appointments_status_check 
CHECK (status IN ('pending', 'assigned', 'completed', 'cancelled'));
