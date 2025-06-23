
-- Update the appointments table to support the new 'assigned' status
-- We don't need to alter the table structure since it already uses text for status
-- But we should update any existing 'pending' appointments that have been assigned to doctors
UPDATE public.appointments 
SET status = 'assigned' 
WHERE status = 'pending' AND doctor_id IS NOT NULL;
