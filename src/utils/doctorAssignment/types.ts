
export interface DoctorSettings {
  user_id: string;
  max_consultations_per_day: number;
  max_appointments_per_day: number;
  consultation_start_time: string;
  consultation_end_time: string;
  appointment_start_time: string;
  appointment_end_time: string;
  days_available: string[];
}

export interface AssignmentResult {
  success: boolean;
  message: string;
  consultations?: number;
  appointments?: number;
}

export interface ConsultationAssignmentResult {
  assigned: number;
}

export interface AppointmentAssignmentResult {
  assigned: number;
}
