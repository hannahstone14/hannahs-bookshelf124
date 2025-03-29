
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
  
  // Create a more comprehensive mock with properly chained methods
  return {
    from: () => ({
      select: () => ({
        order: () => ({
          data: [],
          error: null,
          then: (callback: Function) => Promise.resolve(callback({ data: [], error: null }))
        }),
        eq: () => ({
          single: () => Promise.resolve({ data: null, error: null }),
          data: null,
          error: null
        }),
        single: () => Promise.resolve({ data: null, error: null }),
        data: [],
        error: null,
        then: (callback: Function) => Promise.resolve(callback({ data: [], error: null }))
      }),
      insert: () => ({
        select: () => ({
          single: () => Promise.resolve({ data: null, error: null })
        }),
        data: null, 
        error: null,
        then: (callback: Function) => Promise.resolve(callback({ data: null, error: null }))
      }),
      update: () => ({
        eq: () => ({
          select: () => ({
            single: () => Promise.resolve({ data: null, error: null })
          }),
          data: null,
          error: null,
          then: (callback: Function) => Promise.resolve(callback({ data: null, error: null }))
        })
      }),
      delete: () => ({
        eq: () => ({
          data: null,
          error: null,
          then: (callback: Function) => Promise.resolve(callback({ data: null, error: null }))
        })
      }),
      eq: () => ({
        select: () => Promise.resolve({ data: null, error: null }),
        data: null,
        error: null
      }),
      order: () => ({
        select: () => Promise.resolve({ data: [], error: null })
      })
    }),
    channel: () => ({
      on: () => ({
        subscribe: () => ({ unsubscribe: () => {} })
      }),
      subscribe: () => ({ unsubscribe: () => {} })
    }),
    removeChannel: () => {}
  };
}
