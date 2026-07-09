"use client";

import type { ReactNode } from "react";
import { useAuth } from "@/lib/auth/useAuth";
import { LoginScreen } from "./LoginScreen";

/**
 * Auth boundary for the app content. In prototype mode (no Supabase project
 * connected) it is a no-op passthrough — the click-through prototype behaves
 * exactly as before. Once Supabase is configured, an unauthenticated visitor
 * sees `LoginScreen` instead of `children`; a successful sign-in/up flips
 * `user` via onAuthStateChange and `children` (the router's current screen)
 * appears automatically, with no explicit navigation needed.
 */
export function AuthGate({ children }: { children: ReactNode }) {
  const { user, loading, configured } = useAuth();

  if (!configured) return <>{children}</>;
  if (loading) return null; // brief flash while the session is resolved
  if (!user) return <LoginScreen />;
  return <>{children}</>;
}
