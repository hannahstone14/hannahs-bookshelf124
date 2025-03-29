
import { supabase } from '@/integrations/supabase/client';

// Constants for table names
export const BOOKS_TABLE = 'books';
export const RECOMMENDATIONS_TABLE = 'recommendations';

// Check if we're using demo credentials
export const isUsingDemoCredentials = false;

// Helper to determine if we should use localStorage fallback
export const shouldUseFallback = () => {
  return isUsingDemoCredentials || !supabase || typeof supabase.from !== 'function';
};
