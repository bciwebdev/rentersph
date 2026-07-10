import { createClient as initSupabase } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder-anon-key';

// This fixes the actions.ts error by exporting a valid callable function
export function createClient() {
  return initSupabase(supabaseUrl, supabaseAnonKey);
}