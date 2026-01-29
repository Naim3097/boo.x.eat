import { createClient, SupabaseClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://placeholder.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'placeholder-key';

// Check if we have real credentials
export const hasSupabaseConfig = 
  import.meta.env.VITE_SUPABASE_URL && 
  import.meta.env.VITE_SUPABASE_ANON_KEY;

// Create client with auth configuration
export const supabase: SupabaseClient = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
    storageKey: 'booxeat-auth',
  },
});

// Types for your database tables
export interface WaitlistEntry {
  id?: string;
  email: string;
  created_at?: string;
  source?: string;
}

export interface ContactSubmission {
  id?: string;
  name: string;
  email: string;
  message: string;
  created_at?: string;
}

// Waitlist functions
export async function addToWaitlist(email: string, source: string = 'landing') {
  const { data, error } = await supabase
    .from('waitlist')
    .insert([{ email, source }])
    .select()
    .single();

  if (error) {
    console.error('Error adding to waitlist:', error);
    throw error;
  }

  return data;
}

// Contact form functions
export async function submitContactForm(submission: Omit<ContactSubmission, 'id' | 'created_at'>) {
  const { data, error } = await supabase
    .from('contact_submissions')
    .insert([submission])
    .select()
    .single();

  if (error) {
    console.error('Error submitting contact form:', error);
    throw error;
  }

  return data;
}

export default supabase;
