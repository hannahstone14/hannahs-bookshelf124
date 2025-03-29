
import { supabase } from '@/integrations/supabase/client';

// Constants for table names
export const BOOKS_TABLE = 'books';
export const RECOMMENDATIONS_TABLE = 'recommendations';

// Check if we're using demo credentials
export const isUsingDemoCredentials = false;

// Define Supabase response type to ensure type safety
export type SupabaseResponse<T> = {
  data: T | null;
  error: Error | null;
};

// Helper to determine if we should use localStorage fallback
export const shouldUseFallback = () => {
  try {
    return isUsingDemoCredentials || !supabase || typeof supabase.from !== 'function';
  } catch (error) {
    console.error('Error checking for Supabase availability:', error);
    return true; // If there's any error, use fallback
  }
};
