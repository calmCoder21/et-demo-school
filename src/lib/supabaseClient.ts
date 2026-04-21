import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,      // Keeps the user logged in
    detectSessionInUrl: true,  // CRITICAL: Tells Supabase to look for the #access_token
    autoRefreshToken: true,    // Refreshes the token automatically
  },
});
