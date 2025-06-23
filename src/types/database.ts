
export type Consultation = {
  id: string;
  created_at: string;
  user_id: string;
  pet_name: string;
  symptoms: string;
  status: 'pending' | 'in_progress' | 'completed';
  attachments?: string[];
  doctor_id?: string;
  assigned_at?: string;
  prescription?: string;
};

export type Appointment = {
  id: string;
  created_at: string;
  user_id: string;
  pet_name: string;
  reason: string;
  preferred_date: string;
  preferred_time: string;
  status: 'pending' | 'assigned' | 'completed' | 'cancelled';
  doctor_id?: string;
  assigned_at?: string;
  prescription?: string;
};

export type DoctorSettings = {
  id: string;
  user_id: string;
  max_consultations_per_day: number;
  max_appointments_per_day: number;
  consultation_start_time: string;
  consultation_end_time: string;
  appointment_start_time: string;
  appointment_end_time: string;
  days_available: string[];
  created_at: string;
  updated_at: string;
};

// Extend Database definitions to match Supabase
export type Tables = {
  consultations: Consultation;
  appointments: Appointment;
  doctor_settings: DoctorSettings;
};
