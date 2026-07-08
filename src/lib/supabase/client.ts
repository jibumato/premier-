"use client";

import { createBrowserClient } from "@supabase/ssr";
import type { Database } from "@/lib/database.types";

/**
 * Browser-side Supabase client (singleton). Reads the public env vars injected
 * at build time. Auth session is persisted in cookies via @supabase/ssr so it
 * is shared with the server client.
 *
 * Requires NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY — see
 * .env.example. Until a Supabase project is provisioned these are empty and the
 * client is created lazily (no calls are made yet in Phase 1 scaffolding).
 */
let browserClient: ReturnType<typeof createBrowserClient<Database>> | null = null;

export function getSupabaseBrowserClient() {
  if (browserClient) return browserClient;
  browserClient = createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL ?? "",
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "",
  );
  return browserClient;
}
