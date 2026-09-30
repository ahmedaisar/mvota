import { createClient, type SupabaseClient } from '@supabase/supabase-js';

const url = import.meta.env.NEXT_PUBLIC_SUPABASE_URL;
const anonKey = import.meta.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

/** Non-null when the app was built without Supabase env — the app fails loudly instead of running against localStorage. */
export const supabaseConfigError: string | null =
  !url || !anonKey
    ? 'Missing NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY. Run `vercel env pull .env.development.local --environment=production` locally, or set them in the Vercel dashboard for production.'
    : null;

let client: SupabaseClient | null = null;

export function getDb(): SupabaseClient {
  if (supabaseConfigError) throw new Error(supabaseConfigError);
  client ??= createClient(url!, anonKey!);
  return client;
}
