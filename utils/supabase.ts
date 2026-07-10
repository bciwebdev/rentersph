import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const isReady = supabaseUrl && supabaseAnonKey && supabaseUrl.startsWith('http');

export const supabase = isReady
  ? createClient(supabaseUrl, supabaseAnonKey)
  : (new Proxy({}, {
      get: () => () => ({ data: null, error: null })
    }) as any);
  