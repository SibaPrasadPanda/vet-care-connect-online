
export type Consultation = {
  id: string;
  created_at: string;
  user_id: string;
  pet_name: string;
  symptoms: string;
  status: 'pending' | 'in_progress' | 'completed';
  attachments?: string[];
};

export type Appointment = {
  id: string;
  created_at: string;
  user_id: string;
  pet_name: string;
  reason: string;
  preferred_date: string;
  preferred_time: string;
  status: 'pending' | 'confirmed' | 'cancelled';
};

// Extend Database definitions to match Supabase
export type Tables = {
  consultations: Consultation;
  appointments: Appointment;
};
