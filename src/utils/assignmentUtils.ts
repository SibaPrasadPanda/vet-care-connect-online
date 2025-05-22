
import { supabase } from "@/integrations/supabase/client";

/**
 * Attempts to assign a single pending consultation or appointment to an available doctor.
 * This function can be called after a new consultation or appointment is created.
 * 
 * @returns {Promise<{success: boolean, message: string}>} Result of the assignment attempt
 */
export const assignSingleItem = async () => {
  try {
    console.log("Starting assignment process...");
    
    // Call the Supabase function to assign consultations and appointments
    const { data, error } = await supabase.rpc('assign_pending_to_doctors');
    
    if (error) {
      console.error("Error during assignment:", error);
      return { 
        success: false, 
        message: "Failed to assign to doctor. It will be reviewed by admin." 
      };
    }
    
    console.log("Assignment function returned:", data);
    
    // Check if any assignments were made
    if (data && typeof data === 'object' && !Array.isArray(data)) {
      const totalAssigned = (Number(data.consultations) || 0) + (Number(data.appointments) || 0);
      
      console.log(`Total assignments made: ${totalAssigned} (Consultations: ${data.consultations}, Appointments: ${data.appointments})`);
      
      if (totalAssigned > 0) {
        return { 
          success: true, 
          message: "Successfully assigned to an available doctor." 
        };
      } else {
        // Log potential reasons why no assignments were made
        checkAvailableDoctors();
        
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
 * Helper function to check if there are available doctors and log the reasons why they might not be available
 */
const checkAvailableDoctors = async () => {
  try {
    // Get current day and time
    const today = new Date();
    const currentDay = today.toLocaleString('en-US', { weekday: 'long' });
    const currentTime = today.toTimeString().substring(0, 8); // Format: HH:MM:SS
    
    console.log(`Current day: ${currentDay}, Current time: ${currentTime}`);
    
    // Fetch doctor settings
    const { data: doctors, error: doctorsError } = await supabase
      .from('doctor_settings')
      .select(`
        *,
        user:user_id (
          email,
          raw_user_meta_data
        )
      `);
    
    if (doctorsError) {
      console.error("Error fetching doctor settings:", doctorsError);
      return;
    }
    
    if (!doctors || doctors.length === 0) {
      console.log("No doctors found in the system.");
      return;
    }
    
    console.log(`Found ${doctors.length} doctors in the system.`);
    
    // Fetch pending consultations
    const { data: pendingConsultations, error: consultationsError } = await supabase
      .from('consultations')
      .select('*')
      .eq('status', 'pending')
      .is('doctor_id', null);
      
    if (consultationsError) {
      console.error("Error fetching pending consultations:", consultationsError);
      return;
    }
    
    console.log(`Found ${pendingConsultations?.length || 0} pending consultations.`);
    
    // Check each doctor's availability
    doctors.forEach(doctor => {
      // Handle doctor.user being potentially a SelectQueryError or null
      const doctorEmail = typeof doctor.user === 'object' && doctor.user !== null && 'email' in doctor.user 
        ? doctor.user.email 
        : 'unknown';
        
      const isAvailableDay = doctor.days_available && doctor.days_available.includes(currentDay);
      
      console.log(`\nDoctor ${doctorEmail}:`);
      console.log(`- Available days: ${doctor.days_available?.join(', ')}`);
      console.log(`- Consultation hours: ${doctor.consultation_start_time} - ${doctor.consultation_end_time}`);
      console.log(`- Appointment hours: ${doctor.appointment_start_time} - ${doctor.appointment_end_time}`);
      console.log(`- Today is ${isAvailableDay ? 'in' : 'not in'} their available days`);
      
      if (!isAvailableDay) {
        console.log(`- Not available because today (${currentDay}) is not in their days_available list.`);
        return;
      }
      
      const isWithinConsultationHours = 
        currentTime >= doctor.consultation_start_time && 
        currentTime <= doctor.consultation_end_time;
        
      console.log(`- Current time ${currentTime} is ${isWithinConsultationHours ? 'within' : 'outside'} consultation hours`);
      
      if (!isWithinConsultationHours) {
        console.log(`- Not available for consultations because current time is outside their consultation hours.`);
      }
    });
    
  } catch (error) {
    console.error("Error in checkAvailableDoctors:", error);
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
 *    - If the current time is within their consultation_start_time and consultation_end_time (for consultations)
 *    - If the current time is within their appointment_start_time and appointment_end_time (for appointments)
 *    - How many consultations they're already assigned for today
 *    - How many appointments they're already assigned for today
 * 3. If the doctor meets all criteria, it assigns pending consultations and appointments
 *    - Assigns based on creation date (oldest first)
 *    - Respects the max_consultations_per_day and max_appointments_per_day limits
 *    - For appointments, also verifies that the preferred_time is within the doctor's appointment hours
 * 4. Returns the count of newly assigned consultations and appointments
 */

/**
 * Runs a manual check on a specific consultation to see why it's not being assigned
 * 
 * @param consultationId - The ID of the consultation to check
 * @returns Details about why the consultation isn't being assigned
 */
export const diagnoseConsultationAssignment = async (consultationId: string) => {
  try {
    console.log(`Diagnosing why consultation ${consultationId} isn't being assigned...`);
    
    // Fetch the consultation
    const { data: consultation, error: consultationError } = await supabase
      .from('consultations')
      .select('*')
      .eq('id', consultationId)
      .single();
    
    if (consultationError || !consultation) {
      console.error("Error fetching consultation:", consultationError);
      return {
        success: false,
        message: "Could not find the specified consultation."
      };
    }
    
    console.log("Consultation details:", consultation);
    
    if (consultation.doctor_id) {
      return {
        success: false,
        message: "This consultation is already assigned to a doctor."
      };
    }
    
    if (consultation.status !== 'pending') {
      return {
        success: false,
        message: `This consultation has status "${consultation.status}" but needs to be "pending" to be assigned.`
      };
    }
    
    // Get current day and time
    const today = new Date();
    const currentDay = today.toLocaleString('en-US', { weekday: 'long' });
    const currentTime = today.toTimeString().substring(0, 8); // Format: HH:MM:SS
    
    // Fetch doctor settings
    const { data: doctors, error: doctorsError } = await supabase
      .from('doctor_settings')
      .select(`
        *,
        user:user_id (
          email,
          raw_user_meta_data
        )
      `);
    
    if (doctorsError || !doctors || doctors.length === 0) {
      console.error("Error fetching doctors:", doctorsError);
      return {
        success: false,
        message: "No doctors available in the system."
      };
    }
    
    let availableDoctors = 0;
    let reasons = [];
    
    for (const doctor of doctors) {
      // Handle doctor.user being potentially a SelectQueryError or null
      const doctorEmail = typeof doctor.user === 'object' && doctor.user !== null && 'email' in doctor.user 
        ? doctor.user.email 
        : 'unknown';
        
      const isAvailableDay = doctor.days_available && doctor.days_available.includes(currentDay);
      const isWithinConsultationHours = 
        currentTime >= doctor.consultation_start_time && 
        currentTime <= doctor.consultation_end_time;
      
      if (!isAvailableDay) {
        reasons.push(`Doctor ${doctorEmail} is not available on ${currentDay}.`);
        continue;
      }
      
      if (!isWithinConsultationHours) {
        reasons.push(`Doctor ${doctorEmail} is not available at ${currentTime} (outside their hours of ${doctor.consultation_start_time}-${doctor.consultation_end_time}).`);
        continue;
      }
      
      // Check if doctor has reached their daily limit
      const { count: assignedCount, error: countError } = await supabase
        .from('consultations')
        .select('*', { count: 'exact', head: true })
        .eq('doctor_id', doctor.user_id)
        .eq('status', 'in_progress')
        .gte('assigned_at', today.toISOString().split('T')[0]);
      
      if (countError) {
        console.error("Error counting doctor's consultations:", countError);
        continue;
      }
      
      if (assignedCount && assignedCount >= doctor.max_consultations_per_day) {
        reasons.push(`Doctor ${doctorEmail} has reached their daily limit of ${doctor.max_consultations_per_day} consultations.`);
        continue;
      }
      
      availableDoctors++;
      console.log(`Doctor ${doctorEmail} is available for this consultation.`);
    }
    
    // Now manually attempt to assign it
    const { data, error } = await supabase.rpc('assign_pending_to_doctors');
    
    if (error) {
      console.error("Error calling assignment function:", error);
      return {
        success: false,
        message: "Error in assignment function. Check logs for details."
      };
    }
    
    console.log("Assignment function result:", data);
    
    // Check if our consultation was assigned after this attempt
    const { data: updatedConsultation, error: updateCheckError } = await supabase
      .from('consultations')
      .select('*')
      .eq('id', consultationId)
      .single();
      
    if (!updateCheckError && updatedConsultation && updatedConsultation.doctor_id) {
      return {
        success: true,
        message: "The consultation has now been successfully assigned!"
      };
    }
    
    // Still not assigned
    if (availableDoctors === 0) {
      return {
        success: false,
        message: `No doctors are currently available. Reasons: ${reasons.join(' ')}`,
        reasons
      };
    } else {
      return {
        success: false,
        message: "There are available doctors but assignment failed. This may be a bug in the assignment function.",
        availableDoctors
      };
    }
    
  } catch (error) {
    console.error("Error diagnosing consultation assignment:", error);
    return {
      success: false,
      message: "An error occurred while diagnosing the consultation assignment."
    };
  }
};

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
