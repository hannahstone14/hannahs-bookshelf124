
import { supabase } from '@/integrations/supabase/client';

// Constants for table names
export const BOOKS_TABLE = 'books';
export const RECOMMENDATIONS_TABLE = 'recommendations';

// Updated to true to force using localStorage while we resolve Supabase connection issues
export const isUsingDemoCredentials = true;

// Define Supabase response type to ensure type safety
// This type matches the structure returned by Supabase client methods
export type SupabaseResponse<T> = {
  data: T | null;
  error: Error | null;
};

// Helper to determine if we should use localStorage fallback
export const shouldUseFallback = () => {
  try {
    // Always use local storage for now to prevent data sync issues
    return true;
    
    // The code below is preserved but not used until connection issues are resolved
    // Check connection issue
    const connectionIssue = localStorage.getItem('supabase_connection_issue');
    if (connectionIssue === 'true') {
      console.log('Using localStorage fallback due to previous connection issues');
      return true;
    }
    
    return isUsingDemoCredentials || !supabase || typeof supabase.from !== 'function';
  } catch (error) {
    console.error('Error checking for Supabase availability:', error);
    // Mark that we have a connection issue for future requests
    try {
      localStorage.setItem('supabase_connection_issue', 'true');
    } catch (e) {
      // Ignore if localStorage is not available
    }
    return true; // If there's any error, use fallback
  }
};

// Mark connection issue
export const markConnectionIssue = (hasIssue: boolean = true) => {
  try {
    localStorage.setItem('supabase_connection_issue', hasIssue ? 'true' : 'false');
  } catch (e) {
    // Ignore if localStorage is not available
  }
};
