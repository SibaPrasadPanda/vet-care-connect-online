
import { supabase } from "@/integrations/supabase/client";

export const assignSingleItem = async () => {
  try {
    const { data, error } = await supabase.rpc('assign_pending_to_doctors');
    
    if (error) {
      console.error("Error calling assign_pending_to_doctors:", error);
      return { success: false, message: "Failed to assign items to doctors." };
    }
    
    // Type assertion for the returned data
    const assigned = data as { consultations?: number; appointments?: number } | null;
    const totalAssigned = (assigned?.consultations || 0) + (assigned?.appointments || 0);
    
    if (totalAssigned > 0) {
      return { 
        success: true, 
        message: `Successfully assigned ${assigned?.consultations || 0} consultations and ${assigned?.appointments || 0} appointments to available doctors.` 
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

export const diagnoseConsultationAssignment = async (consultationId: string) => {
  try {
    // Get the specific consultation
    const { data: consultation, error: consultationError } = await supabase
      .from("consultations")
      .select("*")
      .eq("id", consultationId)
      .single();

    if (consultationError) {
      console.error("Error fetching consultation:", consultationError);
      return { 
        success: false, 
        message: "Could not find consultation with the provided ID.",
        reasons: ["Consultation ID does not exist or you don't have permission to view it."]
      };
    }

    if (!consultation) {
      return { 
        success: false, 
        message: "Consultation not found.",
        reasons: ["No consultation exists with the provided ID."]
      };
    }

    // Check if consultation is already assigned
    if (consultation.doctor_id) {
      return {
        success: true,
        message: `Consultation is already assigned to a doctor (ID: ${consultation.doctor_id}).`,
        reasons: []
      };
    }

    // Check if consultation is pending
    if (consultation.status !== 'pending') {
      return {
        success: false,
        message: `Consultation status is '${consultation.status}', not 'pending'.`,
        reasons: [`Only pending consultations can be assigned to doctors.`]
      };
    }

    // Get available doctors and check why this consultation isn't being assigned
    const doctorsWithSettings = await getDoctorsWithSettings();
    
    if (doctorsWithSettings.length === 0) {
      return {
        success: false,
        message: "No doctors found with settings configured.",
        reasons: ["No doctors have their availability settings configured."]
      };
    }

    const reasons: string[] = [];
    let availableDoctorsCount = 0;

    for (const doctor of doctorsWithSettings) {
      const isAvailableForConsultation = isDoctorAvailable(doctor, 'consultation');
      
      if (!isAvailableForConsultation) {
        reasons.push(`Doctor ${doctor.user?.email || 'unknown'} is not available for consultations at this time.`);
        continue;
      }

      // Check if doctor has reached their daily consultation limit
      const today = new Date().toISOString().split('T')[0];
      const { data: todaysConsultations, error: countError } = await supabase
        .from("consultations")
        .select("id")
        .eq("doctor_id", doctor.user_id)
        .gte("assigned_at", `${today}T00:00:00Z`)
        .lte("assigned_at", `${today}T23:59:59Z`);

      if (countError) {
        reasons.push(`Error checking consultation count for doctor ${doctor.user?.email || 'unknown'}.`);
        continue;
      }

      const currentConsultations = todaysConsultations?.length || 0;
      
      if (currentConsultations >= doctor.max_consultations_per_day) {
        reasons.push(`Doctor ${doctor.user?.email || 'unknown'} has reached their daily consultation limit (${doctor.max_consultations_per_day}).`);
        continue;
      }

      availableDoctorsCount++;
    }

    if (availableDoctorsCount === 0) {
      return {
        success: false,
        message: "No doctors are currently available to take this consultation.",
        reasons: reasons
      };
    }

    return {
      success: false,
      message: `${availableDoctorsCount} doctor(s) should be available, but assignment may have failed due to timing or other factors.`,
      reasons: reasons.length > 0 ? reasons : ["Try running the assignment process again."]
    };

  } catch (error) {
    console.error("Unexpected error during consultation diagnosis:", error);
    return { 
      success: false, 
      message: "An unexpected error occurred during diagnosis.",
      reasons: ["Please try again or contact support if the issue persists."]
    };
  }
};

const getDoctorsWithSettings = async (): Promise<any[]> => {
  try {
    // Get doctors with their settings
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

    // Get user metadata for all doctors - using admin.listUsers() with proper error handling
    let users: any[] = [];
    try {
      const { data: usersData, error: usersError } = await supabase.auth.admin.listUsers();
      
      if (usersError) {
        console.error("Error fetching users:", usersError);
        return [];
      }
      
      users = usersData?.users || [];
    } catch (adminError) {
      console.error("Admin listUsers not available, trying alternative approach:", adminError);
      // Alternative: We can't get user details without admin access, so we'll work with just the settings
      return doctorSettings.map(settings => ({
        ...settings,
        user: { id: settings.user_id, email: 'doctor@example.com' } // Placeholder
      }));
    }

    // Combine doctor settings with user data
    const doctorsWithSettings = doctorSettings.map(settings => {
      const user = users.find((u: any) => u.id === settings.user_id);
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
