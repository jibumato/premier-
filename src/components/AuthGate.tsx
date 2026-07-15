"use client";

import type { ReactNode } from "react";
import { useAuth } from "@/lib/auth/useAuth";
import { useProfile } from "@/lib/queries/profile";
import { LoginScreen } from "./LoginScreen";
import { SuspendedScreen } from "./SuspendedScreen";

/**
 * Auth boundary for the app content. In prototype mode (no Supabase project
 * connected) it is a no-op passthrough — the click-through prototype behaves
 * exactly as before. Once Supabase is configured, an unauthenticated visitor
 * sees `LoginScreen` instead of `children`; a successful sign-in/up flips
 * `user` via onAuthStateChange and `children` (the router's current screen)
 * appears automatically, with no explicit navigation needed.
 *
 * A signed-in but suspended account (運営による処罰・0049) sees `SuspendedScreen`
 * instead of the app — this is the enforcement point for account suspension.
 */
export function AuthGate({ children }: { children: ReactNode }) {
  const { user, loading, configured } = useAuth();
  const profile = useProfile(configured ? user?.id : undefined);

  if (!configured) return <>{children}</>;
  if (loading) return null; // brief flash while the session is resolved
  if (!user) return <LoginScreen />;
  if (profile.data?.is_suspended) return <SuspendedScreen reason={profile.data.suspension_reason} />;
  return <>{children}</>;
}
