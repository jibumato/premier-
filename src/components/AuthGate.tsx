"use client";

import type { ReactNode } from "react";
import { useAuth } from "@/lib/auth/useAuth";
import { useProfile } from "@/lib/queries/profile";
import { useRouter } from "./AppRouter";
import { isPublicScreen } from "@/lib/auth/publicScreens";
import { LoginScreen } from "./LoginScreen";
import { SuspendedScreen } from "./SuspendedScreen";

/**
 * Auth boundary for the app content. In prototype mode (no Supabase project
 * connected) it is a no-op passthrough — the click-through prototype behaves
 * exactly as before.
 *
 * Once Supabase is configured we run a **hybrid** model: a signed-out visitor
 * can freely browse *public* screens (ホーム・検索・併せ詳細・知恵袋・イベント・
 * 談話室 …) to see what the service offers, and only hits `LoginScreen` when
 * they reach a screen that needs an account (応募・投稿・DM・マイページ・作成・
 * 運営 …). See `publicScreens.ts` for the exact split. Actions on public
 * screens route the visitor to the `login` screen at the moment they act.
 * A successful sign-in/up flips `user` via onAuthStateChange and the intended
 * screen appears automatically.
 *
 * A signed-in but suspended account (運営による処罰・0049) sees `SuspendedScreen`
 * instead of the app — this is the enforcement point for account suspension.
 */
export function AuthGate({ children }: { children: ReactNode }) {
  const { user, loading, configured } = useAuth();
  const { screen } = useRouter();
  const profile = useProfile(configured ? user?.id : undefined);

  if (!configured) return <>{children}</>;
  if (loading) return null; // brief flash while the session is resolved
  if (user && profile.data?.is_suspended) {
    return <SuspendedScreen reason={profile.data.suspension_reason} />;
  }
  // 未ログインでも公開画面はそのまま見せる。登録が必要な画面だけログインに差し替える。
  if (!user && !isPublicScreen(screen)) return <LoginScreen />;
  return <>{children}</>;
}
