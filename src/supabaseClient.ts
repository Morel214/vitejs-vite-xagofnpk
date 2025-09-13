// src/supabaseClient.ts
import { createClient } from '@supabase/supabase-js';

export const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL as string,         // Project URL
  import.meta.env.VITE_SUPABASE_ANON_KEY as string     // anon public key
);
