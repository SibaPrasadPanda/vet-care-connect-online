
import { supabase } from "@/integrations/supabase/client";
import { DoctorSettings, ConsultationAssignmentResult } from "./types";

export const autoAssignConsultations = async (
  doctorId: string, 
  doctorSettings: DoctorSettings
): Promise<ConsultationAssignmentResult> => {
  try {
    console.log("Starting consultation assignment for doctor:", doctorId);

    // Check today's assigned consultations count
    const today = new Date().toISOString().split('T')[0];
    console.log("Checking consultations for today:", today);
    
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
    console.log(`Doctor has ${currentCount} consultations assigned today, max allowed: ${doctorSettings.max_consultations_per_day}`);
    
    const availableSlots = doctorSettings.max_consultations_per_day - currentCount;

    if (availableSlots <= 0) {
      console.log("Doctor has reached daily consultation limit");
      return { assigned: 0 };
    }

    // Get unassigned consultations (oldest first)
    console.log("Fetching unassigned consultations...");
    const { data: unassignedConsultations, error: fetchError } = await supabase
      .from("consultations")
      .select("*")
      .filter("doctor_id", "is", null)
      .eq("status", "pending")
      .order("created_at", { ascending: true })
      .limit(availableSlots);

    console.log("Unassigned consultations query result:", { data: unassignedConsultations, error: fetchError });

    if (fetchError) {
      console.error("Error fetching unassigned consultations:", fetchError);
      return { assigned: 0 };
    }

    if (!unassignedConsultations?.length) {
      console.log("No unassigned consultations found");
      return { assigned: 0 };
    }

    console.log(`Found ${unassignedConsultations.length} unassigned consultations`);

    // Assign consultations
    let assigned = 0;
    for (const consultation of unassignedConsultations) {
      console.log(`Attempting to assign consultation ${consultation.id}`);
      
      const { error: assignError } = await supabase
        .from("consultations")
        .update({
          doctor_id: doctorId,
          assigned_at: new Date().toISOString(),
          status: "in_progress"
        })
        .eq("id", consultation.id);

      if (!assignError) {
        assigned++;
        console.log(`Successfully assigned consultation ${consultation.id} to doctor ${doctorId}`);
      } else {
        console.error("Error assigning consultation:", assignError);
      }
    }

    console.log(`Total consultations assigned: ${assigned}`);
    return { assigned };

  } catch (error) {
    console.error("Error in consultation auto-assignment:", error);
    return { assigned: 0 };
  }
};
