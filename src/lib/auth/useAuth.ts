"use client";

import { useEffect, useState } from "react";
import type { User } from "@supabase/supabase-js";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { isSupabaseConfigured } from "@/lib/supabase/config";

export interface AuthState {
  user: User | null;
  loading: boolean;
  /** false until a Supabase project is connected (prototype mode). */
  configured: boolean;
}

/**
 * Current auth state, driven by Supabase's session. Subscribes to
 * `onAuthStateChange` so login/logout propagate. In prototype mode (no
 * Supabase env) it returns `{ user: null, loading: false, configured: false }`
 * without any network call.
 */
export function useAuth(): AuthState {
  const configured = isSupabaseConfigured();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(configured);

  useEffect(() => {
    if (!configured) return;
    const supabase = getSupabaseBrowserClient();

    supabase.auth.getUser().then(({ data }) => {
      setUser(data.user);
      setLoading(false);
    });

    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });
    return () => sub.subscription.unsubscribe();
  }, [configured]);

  return { user, loading, configured };
}
