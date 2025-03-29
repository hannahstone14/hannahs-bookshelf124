
import { createClient } from '@supabase/supabase-js';

// Try to get environment variables, fallback to empty strings if not available
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

// Check if we have the required configuration
const isSupabaseConfigured = supabaseUrl && supabaseAnonKey;

// Create the Supabase client if configured, otherwise create a mock client that logs errors
export const supabase = isSupabaseConfigured 
  ? createClient(supabaseUrl, supabaseAnonKey)
  : createMockSupabaseClient();

// Function to create a mock Supabase client
function createMockSupabaseClient() {
  console.warn(
    'Supabase is not configured. Please set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY environment variables. ' +
    'For now, using mock client that returns empty data.'
  );
  
  // Create a basic mock with empty data responses
  return {
    from: () => ({
      select: () => Promise.resolve({ data: [], error: null }),
      insert: () => Promise.resolve({ data: null, error: null }),
      update: () => Promise.resolve({ data: null, error: null }),
      delete: () => Promise.resolve({ data: null, error: null }),
      eq: () => ({ select: () => Promise.resolve({ data: null, error: null }) }),
      single: () => Promise.resolve({ data: null, error: null }),
      order: () => ({ select: () => Promise.resolve({ data: [], error: null }) })
    }),
    channel: () => ({
      on: () => ({ subscribe: () => ({ unsubscribe: () => {} }) })
    }),
    removeChannel: () => {}
  };
}
