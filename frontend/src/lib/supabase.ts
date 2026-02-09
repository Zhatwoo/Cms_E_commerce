import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? '';
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? '';

/**
 * Browser Supabase client. Use for optional client-side Supabase (e.g. realtime).
 * Auth is handled via the backend API and cookies; this client uses the anon key only.
 */
export const supabase =
  supabaseUrl && supabaseKey
    ? createClient(supabaseUrl, supabaseKey)
    : (null as unknown as ReturnType<typeof createClient>);
