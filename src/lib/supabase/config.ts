/**
 * True when the Supabase public env vars are present at build time.
 *
 * Used as a guard so the app keeps running as a pure clickable prototype
 * before a Supabase project is provisioned: auth/data code paths are skipped
 * (no network calls, no errors) until NEXT_PUBLIC_SUPABASE_URL /
 * NEXT_PUBLIC_SUPABASE_ANON_KEY are set. Once set, the same code goes live.
 */
export function isSupabaseConfigured(): boolean {
  return Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  );
}
