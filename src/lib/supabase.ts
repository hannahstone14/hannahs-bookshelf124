
import { createClient } from '@supabase/supabase-js';

// Use fixed demo values if environment variables aren't available
// These are public demo credentials from Supabase's documentation
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://xyzcompany.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'public-anon-key-123456789';

// Always create a real Supabase client with the provided or demo values
export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Export whether we're using real or demo credentials
export const isUsingDemoCredentials = !(import.meta.env.VITE_SUPABASE_URL && import.meta.env.VITE_SUPABASE_ANON_KEY);
