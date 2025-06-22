
import { supabase } from "@/integrations/supabase/client";

export const autoAssignToDoctorOnDashboardLoad = async (doctorId: string) => {
  try {
    console.log(`Starting auto-assignment for doctor: ${doctorId}`);

    // Get doctor settings
    const { data: doctorSettings, error: settingsError } = await supabase
      .from("doctor_settings")
      .select("*")
      .eq("user_id", doctorId)
      .single();

    if (settingsError || !doctorSettings) {
      console.error("Error fetching doctor settings:", settingsError);
      return { success: false, message: "Doctor settings not found" };
    }

    let assignedConsultations = 0;
    let assignedAppointments = 0;

    // Auto-assign consultations
    const consultationResult = await autoAssignConsultations(doctorId, doctorSettings);
    assignedConsultations = consultationResult.assigned;

    // Auto-assign appointments
    const appointmentResult = await autoAssignAppointments(doctorId, doctorSettings);
    assignedAppointments = appointmentResult.assigned;

    const totalAssigned = assignedConsultations + assignedAppointments;

    if (totalAssigned > 0) {
      return {
        success: true,
        message: `Auto-assigned ${assignedConsultations} consultations and ${assignedAppointments} appointments`,
        consultations: assignedConsultations,
        appointments: assignedAppointments
      };
    }

    return {
      success: true,
      message: "No new assignments needed",
      consultations: 0,
      appointments: 0
    };

  } catch (error) {
    console.error("Error in auto-assignment:", error);
    return { success: false, message: "Auto-assignment failed" };
  }
};

const autoAssignConsultations = async (doctorId: string, doctorSettings: any) => {
  try {
    // Check today's assigned consultations count
    const today = new Date().toISOString().split('T')[0];
    const { data: todaysConsultations, error: countError } = await supabase
      .from("consultations")
      .select("id")
      .eq("doctor_id", doctorId)
      .gte("assigned_at", `${today}T00:00:00Z`)
      .lte("assigned_at", `${today}T23:59:59Z`);

    if (countError) {
      console.error("Error counting today's consultations:", countError);
      return { assigned: 0 };
    }

    const currentCount = todaysConsultations?.length || 0;
    const availableSlots = doctorSettings.max_consultations_per_day - currentCount;

    if (availableSlots <= 0) {
      console.log("Doctor has reached daily consultation limit");
      return { assigned: 0 };
    }

    // Get unassigned consultations (oldest first)
    const { data: unassignedConsultations, error: fetchError } = await supabase
      .from("consultations")
      .select("*")
      .is("doctor_id", null)
      .is("assigned_at", null)
      .eq("status", "pending")
      .order("created_at", { ascending: true })
      .limit(availableSlots);

    if (fetchError || !unassignedConsultations?.length) {
      console.log("No unassigned consultations found");
      return { assigned: 0 };
    }

    // Assign consultations
    let assigned = 0;
    for (const consultation of unassignedConsultations) {
      const { error: assignError } = await supabase
        .from("consultations")
        .update({
          doctor_id: doctorId,
          assigned_at: new Date().toISOString()
        })
        .eq("id", consultation.id);

      if (!assignError) {
        assigned++;
        console.log(`Assigned consultation ${consultation.id} to doctor ${doctorId}`);
      } else {
        console.error("Error assigning consultation:", assignError);
      }
    }

    return { assigned };

  } catch (error) {
    console.error("Error in consultation auto-assignment:", error);
    return { assigned: 0 };
  }
};

const autoAssignAppointments = async (doctorId: string, doctorSettings: any) => {
  try {
    // Get unassigned appointments (oldest first)
    const { data: unassignedAppointments, error: fetchError } = await supabase
      .from("appointments")
      .select("*")
      .is("doctor_id", null)
      .is("assigned_at", null)
      .eq("status", "pending")
      .order("created_at", { ascending: true });

    if (fetchError || !unassignedAppointments?.length) {
      console.log("No unassigned appointments found");
      return { assigned: 0 };
    }

    let assigned = 0;

    // Process each appointment
    for (const appointment of unassignedAppointments) {
      // Check if preferred_time matches doctor's availability
      const appointmentTime = appointment.preferred_time;
      const doctorStartTime = doctorSettings.appointment_start_time;
      const doctorEndTime = doctorSettings.appointment_end_time;

      if (appointmentTime < doctorStartTime || appointmentTime > doctorEndTime) {
        continue; // Skip appointments outside doctor's hours
      }

      // Check appointments count for the preferred date
      const appointmentDate = appointment.preferred_date;
      const { data: dateAppointments, error: countError } = await supabase
        .from("appointments")
        .select("id")
        .eq("doctor_id", doctorId)
        .eq("preferred_date", appointmentDate);

      if (countError) {
        console.error("Error counting date appointments:", countError);
        continue;
      }

      const currentDateCount = dateAppointments?.length || 0;
      
      if (currentDateCount >= doctorSettings.max_appointments_per_day) {
        continue; // Skip if doctor has reached limit for this date
      }

      // Assign the appointment
      const { error: assignError } = await supabase
        .from("appointments")
        .update({
          doctor_id: doctorId,
          assigned_at: new Date().toISOString()
        })
        .eq("id", appointment.id);

      if (!assignError) {
        assigned++;
        console.log(`Assigned appointment ${appointment.id} to doctor ${doctorId} for ${appointmentDate} at ${appointmentTime}`);
      } else {
        console.error("Error assigning appointment:", assignError);
      }
    }

    return { assigned };

  } catch (error) {
    console.error("Error in appointment auto-assignment:", error);
    return { assigned: 0 };
  }
};
