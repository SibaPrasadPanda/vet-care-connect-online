
import { supabase } from "@/integrations/supabase/client";
import { DoctorSettings, AppointmentAssignmentResult } from "./types";

export const autoAssignAppointments = async (
  doctorId: string, 
  doctorSettings: DoctorSettings
): Promise<AppointmentAssignmentResult> => {
  try {
    console.log("Starting appointment assignment for doctor:", doctorId);

    // Get unassigned appointments (oldest first)
    console.log("Fetching unassigned appointments...");
    const { data: unassignedAppointments, error: fetchError } = await supabase
      .from("appointments")
      .select("*")
      .filter("doctor_id", "is", null)
      .eq("status", "pending")
      .order("created_at", { ascending: true });

    console.log("Unassigned appointments query result:", { data: unassignedAppointments, error: fetchError });

    if (fetchError) {
      console.error("Error fetching unassigned appointments:", fetchError);
      return { assigned: 0 };
    }

    if (!unassignedAppointments?.length) {
      console.log("No unassigned appointments found");
      return { assigned: 0 };
    }

    console.log(`Found ${unassignedAppointments.length} unassigned appointments`);

    let assigned = 0;

    // Process each appointment
    for (const appointment of unassignedAppointments) {
      console.log(`Processing appointment ${appointment.id} for ${appointment.preferred_date} at ${appointment.preferred_time}`);
      
      // Check if preferred_time matches doctor's availability
      const appointmentTime = appointment.preferred_time;
      const doctorStartTime = doctorSettings.appointment_start_time;
      const doctorEndTime = doctorSettings.appointment_end_time;

      console.log(`Checking time match: ${appointmentTime} between ${doctorStartTime} and ${doctorEndTime}`);

      if (appointmentTime < doctorStartTime || appointmentTime > doctorEndTime) {
        console.log(`Appointment time ${appointmentTime} is outside doctor's hours (${doctorStartTime}-${doctorEndTime})`);
        continue; // Skip appointments outside doctor's hours
      }

      // Check appointments count for the preferred date
      const appointmentDate = appointment.preferred_date;
      console.log(`Checking appointment count for date: ${appointmentDate}`);
      
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
      console.log(`Doctor has ${currentDateCount} appointments on ${appointmentDate}, max allowed: ${doctorSettings.max_appointments_per_day}`);
      
      if (currentDateCount >= doctorSettings.max_appointments_per_day) {
        console.log(`Doctor has reached appointment limit for ${appointmentDate}`);
        continue; // Skip if doctor has reached limit for this date
      }

      // Assign the appointment
      console.log(`Attempting to assign appointment ${appointment.id}`);
      const { error: assignError } = await supabase
        .from("appointments")
        .update({
          doctor_id: doctorId,
          assigned_at: new Date().toISOString(),
          status: "confirmed"
        })
        .eq("id", appointment.id);

      if (!assignError) {
        assigned++;
        console.log(`Successfully assigned appointment ${appointment.id} to doctor ${doctorId} for ${appointmentDate} at ${appointmentTime}`);
      } else {
        console.error("Error assigning appointment:", assignError);
      }
    }

    console.log(`Total appointments assigned: ${assigned}`);
    return { assigned };

  } catch (error) {
    console.error("Error in appointment auto-assignment:", error);
    return { assigned: 0 };
  }
};
