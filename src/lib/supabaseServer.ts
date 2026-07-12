import { createClient, type SupabaseClient } from "@supabase/supabase-js";

/**
 * Server-side Supabase client for the tweet corpus (style retrieval).
 *
 * Returns null when the project isn't configured so callers can fall back to
 * the hardcoded voice examples instead of failing generation. Uses the anon
 * key (the `tweets` table has an allow-all RLS policy); a service-role key is
 * preferred if present.
 */
let cached: SupabaseClient | null | undefined;

export function getServerSupabase(): SupabaseClient | null {
  if (cached !== undefined) return cached;

  // Accept both the NEXT_PUBLIC_* names (local .env) and the plain names used
  // in the Vercel project, so retrieval works in every environment.
  const url =
    process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
  const key =
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
    process.env.SUPABASE_ANON_KEY;

  cached = url && key ? createClient(url, key, { auth: { persistSession: false } }) : null;
  return cached;
}
