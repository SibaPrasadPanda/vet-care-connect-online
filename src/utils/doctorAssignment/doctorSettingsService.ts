
import { supabase } from "@/integrations/supabase/client";
import { DoctorSettings } from "./types";

export const getDoctorSettings = async (doctorId: string): Promise<DoctorSettings | null> => {
  try {
    console.log(`Fetching doctor settings for: ${doctorId}`);

    const { data: doctorSettings, error: settingsError } = await supabase
      .from("doctor_settings")
      .select("*")
      .eq("user_id", doctorId)
      .single();

    if (settingsError || !doctorSettings) {
      console.error("Error fetching doctor settings:", settingsError);
      return null;
    }

    console.log("Doctor settings found:", doctorSettings);
    return doctorSettings;
  } catch (error) {
    console.error("Error in getDoctorSettings:", error);
    return null;
  }
};
