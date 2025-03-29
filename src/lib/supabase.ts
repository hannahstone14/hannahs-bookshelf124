
import { supabase } from '@/integrations/supabase/client';

// Constants for table names
export const BOOKS_TABLE = 'books';
export const RECOMMENDATIONS_TABLE = 'recommendations';

// Always use localStorage - forcing to true to prevent any data issues
export const isUsingDemoCredentials = true;

// Test book identifiers to be filtered throughout the app
export const TEST_BOOK_PATTERNS = ['Sample Book', 'hk', 'ver'];

// Helper function to identify test books consistently
export const isTestBook = (book: any): boolean => {
  if (!book || !book.title) return false;
  
  return TEST_BOOK_PATTERNS.some(pattern => 
    typeof book.title === 'string' && 
    (book.title === pattern || book.title.includes(pattern))
  );
};

// Define Supabase response type to ensure type safety
// This type matches the structure returned by Supabase client methods
export type SupabaseResponse<T> = {
  data: T | null;
  error: Error | null;
};

// Helper to determine if we should use localStorage fallback
export const shouldUseFallback = () => {
  try {
    // Always use local storage to prevent data sync issues
    return true;
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
