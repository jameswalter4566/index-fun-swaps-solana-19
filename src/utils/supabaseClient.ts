
import { createClient } from '@supabase/supabase-js';

// Supabase project details
const supabaseUrl = 'https://voejoqmfluaohpyrcbub.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZvZWpvcW1mbHVhb2hweXJjYnViIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDc2Mjg1MzAsImV4cCI6MjA2MzIwNDUzMH0.VDAFxA7xtx5KsveCn2vm4k6WXYBvZPLcdF_bdPTq62o';

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: localStorage,
    autoRefreshToken: true,
    persistSession: true,
  },
});
