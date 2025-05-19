
import { createClient } from '@supabase/supabase-js';
import type { Database } from './database.types';

// In production, these would come from environment variables
// For development purposes, we'll use placeholders if they're missing
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://your-project-id.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'your-anon-key';

// Show warning in console instead of crashing the app
if (!import.meta.env.VITE_SUPABASE_URL || !import.meta.env.VITE_SUPABASE_ANON_KEY) {
  console.warn(
    'Supabase environment variables are missing. Please set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in your environment. ' +
    'The app will use placeholder values which will not work correctly.'
  );
}

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey);

export type Tables = Database['public']['Tables'];
export type IndexRecord = Tables['indexes']['Row'];
export type TokenRecord = Tables['tokens']['Row'];
