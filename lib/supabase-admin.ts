import { createClient } from "@supabase/supabase-js";
import { withTimeout } from "./timeout";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseSecretKey = process.env.SUPABASE_SECRET_KEY!;

const customFetch = (input: RequestInfo | URL, init?: RequestInit) => {
  return withTimeout(
    fetch(input, init),
    5000,
    "Supabase database request timed out"
  );
};

export const supabaseAdmin = createClient(supabaseUrl, supabaseSecretKey, {
  global: {
    fetch: customFetch
  }
});