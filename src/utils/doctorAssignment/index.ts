
import { getDoctorSettings } from "./doctorSettingsService";
import { autoAssignConsultations } from "./consultationAssignment";
import { autoAssignAppointments } from "./appointmentAssignment";
import { AssignmentResult } from "./types";

export const autoAssignToDoctorOnDashboardLoad = async (doctorId: string): Promise<AssignmentResult> => {
  try {
    console.log(`Starting auto-assignment for doctor: ${doctorId}`);

    // Get doctor settings
    const doctorSettings = await getDoctorSettings(doctorId);

    if (!doctorSettings) {
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

// Export individual functions for flexibility
export { getDoctorSettings } from "./doctorSettingsService";
export { autoAssignConsultations } from "./consultationAssignment";
export { autoAssignAppointments } from "./appointmentAssignment";
export * from "./types";
