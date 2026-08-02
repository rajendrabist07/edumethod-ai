import { createClient } from '@supabase/supabase-js'
import { withTimeout } from './timeout'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://placeholder-project.supabase.co"
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "placeholder-anon-key"

const customFetch = (input: RequestInfo | URL, init?: RequestInit) => {
  return withTimeout(
    fetch(input, init),
    5000,
    "Supabase database request timed out"
  );
};

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  global: {
    fetch: customFetch
  }
})
