import { createClient as initSupabase } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const isReady = supabaseUrl && supabaseAnonKey && supabaseUrl.startsWith('http');

export function createClient() {
  return isReady
    ? initSupabase(supabaseUrl, supabaseAnonKey)
    : (new Proxy({}, {
        get: () => () => ({ data: null, error: null })
      }) as any);
}