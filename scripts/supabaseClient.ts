/**
 * Supabase client for the Phase-1 data-pipeline scripts (import / analyze).
 *
 * These run in plain Node (via tsx), outside Next.js, so they load env from
 * .env.local themselves. The anon key works because the `tweets` table uses the
 * project's allow-all RLS convention; a service-role key is preferred if set.
 */
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { config } from "dotenv";
import { resolve } from "node:path";

config({ path: resolve(process.cwd(), ".env.local") });
config({ path: resolve(process.cwd(), ".env") });

export const TWEETS_TABLE = "tweets";

export function getSupabase(): SupabaseClient {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key =
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !key) {
    throw new Error(
      "Missing Supabase env. Set NEXT_PUBLIC_SUPABASE_URL and " +
        "NEXT_PUBLIC_SUPABASE_ANON_KEY (or SUPABASE_SERVICE_ROLE_KEY) in .env.local."
    );
  }

  return createClient(url, key, { auth: { persistSession: false } });
}

/** Split an array into fixed-size chunks (for batched DB writes). */
export function chunk<T>(items: T[], size: number): T[][] {
  const out: T[][] = [];
  for (let i = 0; i < items.length; i += size) out.push(items.slice(i, i + size));
  return out;
}
