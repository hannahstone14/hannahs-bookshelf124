
import { createClient } from '@supabase/supabase-js';

// Use environment variables if available, otherwise use demo values
// These are public demo credentials from Supabase's documentation
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://xyzcompany.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'public-anon-key-123456789';

// Create the Supabase client
export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Check if we're using demo credentials
export const isUsingDemoCredentials = !(import.meta.env.VITE_SUPABASE_URL && import.meta.env.VITE_SUPABASE_ANON_KEY);

// Constants for table names
export const BOOKS_TABLE = 'books';
export const RECOMMENDATIONS_TABLE = 'recommendations';

// Helper to determine if we should use localStorage fallback
export const shouldUseFallback = () => {
  return isUsingDemoCredentials || !supabase || typeof supabase.from !== 'function';
};
