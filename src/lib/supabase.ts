
import { createClient } from '@supabase/supabase-js';

// Supabase connection details
const supabaseUrl = 'https://elofhyypbxsdxlhfdefp.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVsb2ZoeXlwYnhzZHhsaGZkZWZwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDUyNTgwODUsImV4cCI6MjA2MDgzNDA4NX0.QAGzXuEFsTJ-szpl5ykatmJ3cdQNGAQ-h9koUSQUFkI';

// Create Supabase client
export const supabase = createClient(supabaseUrl, supabaseKey);
