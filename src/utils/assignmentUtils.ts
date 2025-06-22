import { supabase } from "@/integrations/supabase/client";

export const assignSingleItem = async () => {
  try {
    const { data, error } = await supabase.rpc('assign_pending_to_doctors');
    
    if (error) {
      console.error("Error calling assign_pending_to_doctors:", error);
      return { success: false, message: "Failed to assign items to doctors." };
    }
    
    const assigned = data;
    const totalAssigned = (assigned?.consultations || 0) + (assigned?.appointments || 0);
    
    if (totalAssigned > 0) {
      return { 
        success: true, 
        message: `Successfully assigned ${assigned.consultations} consultations and ${assigned.appointments} appointments to available doctors.` 
      };
    } else {
      return { 
        success: false, 
        message: "No items were assigned. All doctors may be at capacity or unavailable." 
      };
    }
  } catch (error) {
    console.error("Unexpected error during assignment:", error);
    return { success: false, message: "An unexpected error occurred during assignment." };
  }
};

const getDoctorsWithSettings = async () => {
  try {
    // Get doctors with their settings and user metadata
    const { data: doctorSettings, error } = await supabase
      .from("doctor_settings")
      .select("*");

    if (error) {
      console.error("Error fetching doctor settings:", error);
      return [];
    }

    if (!doctorSettings || doctorSettings.length === 0) {
      console.log("No doctor settings found");
      return [];
    }

    // Get user metadata for all doctors
    const doctorIds = doctorSettings.map(ds => ds.user_id);
    const { data: { users }, error: usersError } = await supabase.auth.admin.listUsers();
    
    if (usersError) {
      console.error("Error fetching users:", usersError);
      return [];
    }

    // Combine doctor settings with user data
    const doctorsWithSettings = doctorSettings.map(settings => {
      const user = users?.find(u => u.id === settings.user_id);
      return {
        ...settings,
        user: user || null
      };
    }).filter(doctor => doctor.user && doctor.user.user_metadata?.role === 'doctor');

    console.log("Doctors with settings:", doctorsWithSettings);
    return doctorsWithSettings;
  } catch (error) {
    console.error("Unexpected error fetching doctors:", error);
    return [];
  }
};

const isDoctorAvailable = (doctor: any, forType: 'consultation' | 'appointment') => {
  const now = new Date();
  const currentDay = now.toLocaleDateString('en-US', { weekday: 'long' });
  const currentTime = now.toTimeString().slice(0, 5); // HH:MM format
  
  // Check if today is in doctor's available days
  if (!doctor.days_available.includes(currentDay)) {
    console.log(`Doctor ${doctor.user?.email || 'unknown'} not available on ${currentDay}`);
    return false;
  }
  
  // Check if current time is within doctor's working hours
  let startTime, endTime;
  if (forType === 'consultation') {
    startTime = doctor.consultation_start_time;
    endTime = doctor.consultation_end_time;
  } else {
    startTime = doctor.appointment_start_time;
    endTime = doctor.appointment_end_time;
  }
  
  if (currentTime < startTime || currentTime > endTime) {
    console.log(`Doctor ${doctor.user?.email || 'unknown'} not available at ${currentTime} for ${forType}`);
    return false;
  }
  
  return true;
};
