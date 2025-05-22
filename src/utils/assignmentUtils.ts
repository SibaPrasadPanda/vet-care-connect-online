
import { supabase } from "@/integrations/supabase/client";

/**
 * Attempts to assign a single pending consultation or appointment to an available doctor.
 * This function can be called after a new consultation or appointment is created.
 * 
 * @returns {Promise<{success: boolean, message: string}>} Result of the assignment attempt
 */
export const assignSingleItem = async () => {
  try {
    // Call the Supabase function to assign consultations and appointments
    const { data, error } = await supabase.rpc('assign_pending_to_doctors');
    
    if (error) {
      console.error("Error during assignment:", error);
      return { 
        success: false, 
        message: "Failed to assign to doctor. It will be reviewed by admin." 
      };
    }
    
    // Check if any assignments were made
    if (data && typeof data === 'object' && !Array.isArray(data)) {
      const totalAssigned = (Number(data.consultations) || 0) + (Number(data.appointments) || 0);
      
      if (totalAssigned > 0) {
        return { 
          success: true, 
          message: "Successfully assigned to an available doctor." 
        };
      } else {
        return { 
          success: true, 
          message: "No available doctors at the moment. An admin will review and assign soon." 
        };
      }
    }
    
    return { 
      success: false, 
      message: "Pending admin review for assignment." 
    };
    
  } catch (error) {
    console.error("Unexpected error during assignment:", error);
    return { 
      success: false, 
      message: "An error occurred during assignment. Admin will review." 
    };
  }
};

/**
 * Checks if automatic assignment is enabled in the system settings
 * This is a placeholder function - you would implement this based on your system settings
 * 
 * @returns {Promise<boolean>} Whether automatic assignment is enabled
 */
export const isAutoAssignmentEnabled = async (): Promise<boolean> => {
  // This would typically check a system_settings table or similar
  // For now, we'll return true as a default
  return true;
};

/**
 * Understanding the assign_pending_to_doctors function in Supabase:
 * 
 * The database function does the following:
 * 1. Gets a list of all doctors with their availability settings
 * 2. For each doctor, it checks:
 *    - If today is in their days_available array
 *    - How many consultations they're already assigned for today
 *    - How many appointments they're already assigned for today
 * 3. If the doctor hasn't reached their daily limits, it assigns pending consultations and appointments
 *    - Assigns based on creation date (oldest first)
 *    - Respects the max_consultations_per_day and max_appointments_per_day limits
 * 4. Returns the count of newly assigned consultations and appointments
 * 
 * The function doesn't currently check the time constraints (start_time and end_time)
 * This would need to be modified in the database function.
 */

/**
 * Automatically tries to assign a newly created consultation to an available doctor.
 * This can be called right after a patient creates a consultation.
 * 
 * @param consultationId - The ID of the newly created consultation
 * @returns Whether the assignment was successful
 */
export const autoAssignConsultation = async (consultationId: string): Promise<boolean> => {
  try {
    const isEnabled = await isAutoAssignmentEnabled();
    if (!isEnabled) {
      console.log("Automatic assignment is disabled");
      return false;
    }
    
    const result = await assignSingleItem();
    return result.success;
  } catch (error) {
    console.error("Error auto-assigning consultation:", error);
    return false;
  }
};

/**
 * Automatically tries to assign a newly created appointment to an available doctor.
 * This can be called right after a patient schedules an appointment.
 * 
 * @param appointmentId - The ID of the newly created appointment
 * @returns Whether the assignment was successful
 */
export const autoAssignAppointment = async (appointmentId: string): Promise<boolean> => {
  try {
    const isEnabled = await isAutoAssignmentEnabled();
    if (!isEnabled) {
      console.log("Automatic assignment is disabled");
      return false;
    }
    
    const result = await assignSingleItem();
    return result.success;
  } catch (error) {
    console.error("Error auto-assigning appointment:", error);
    return false;
  }
};
