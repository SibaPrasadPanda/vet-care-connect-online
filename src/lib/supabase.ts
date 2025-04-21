
import { createClient } from '@supabase/supabase-js';

// Hard-coded values from the Supabase connection
// These are public values that are safe to include in client-side code
const supabaseUrl = 'https://tzjkwfzvaqwlgbfwprgz.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InR6amt3Znp2YXF3bGdiZndwcmd6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3MTMyNTI0MjMsImV4cCI6MjAyODgyODQyM30.hsPisEq_exMDrNdIYMWVDsoQ2MPkYDhc6M0bnbR7EB0';

// Create Supabase client
export const supabase = createClient(supabaseUrl, supabaseKey);
