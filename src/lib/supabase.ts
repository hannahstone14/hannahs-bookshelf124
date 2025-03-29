
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
  
  // Create a more comprehensive mock with properly typed methods
  return {
    from: (table: string) => ({
      select: (columns: string = '*') => {
        const response = Promise.resolve({ data: [], error: null });
        return {
          ...response,
          order: () => response,
          eq: () => ({
            ...response,
            single: () => Promise.resolve({ data: null, error: null })
          }),
          single: () => Promise.resolve({ data: null, error: null })
        };
      },
      insert: (data: any) => {
        const response = Promise.resolve({ data: null, error: null });
        return {
          ...response,
          select: () => ({
            ...response,
            single: () => Promise.resolve({ data: null, error: null })
          })
        };
      },
      update: (data: any) => {
        const response = Promise.resolve({ data: null, error: null });
        return {
          ...response,
          eq: () => ({
            ...response,
            select: () => ({
              ...response,
              single: () => Promise.resolve({ data: null, error: null })
            })
          })
        };
      },
      delete: () => {
        const response = Promise.resolve({ data: null, error: null });
        return {
          ...response,
          eq: () => response
        };
      },
      eq: (column: string, value: any) => {
        const response = Promise.resolve({ data: null, error: null });
        return {
          ...response,
          select: () => response
        };
      },
      order: (column: string, options: any) => {
        const response = Promise.resolve({ data: [], error: null });
        return {
          ...response,
          select: () => response
        };
      }
    }),
    // Mock the channel functionality to avoid TypeScript errors
    channel: (name: string) => {
      const channel = {
        on: (event: string, filter: any, callback: Function) => {
          console.log(`Mock channel ${name} subscribed to ${event}`);
          return {
            subscribe: () => ({ unsubscribe: () => {} })
          };
        },
        subscribe: () => {
          console.log(`Mock channel ${name} subscribed`);
          return { unsubscribe: () => {} };
        }
      };
      return channel;
    },
    removeChannel: (channel: any) => {}
  };
}
