"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { colors } from "@/lib/tokens";
import { useAuth } from "@/lib/auth/useAuth";
import { useProfile } from "@/lib/queries/profile";
import { useRouter } from "./AppRouter";
import { isPublicView } from "@/lib/auth/publicScreens";
import { LoginScreen } from "./LoginScreen";
import { SuspendedScreen } from "./SuspendedScreen";
import { CheckIcon } from "./icons";

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
  const { screen, selectedProfileId } = useRouter();
  const profile = useProfile(configured ? user?.id : undefined);

  // ログイン画面から本来の画面へ切り替わるだけだと「ログインできたのか」が
  // 分かりにくいため、未ログイン→ログイン済みに変わった瞬間だけ短いトーストを
  // 出す（セッション復元時の初回表示では出さない。ページ読込直後にログイン済み
  // だった場合と、フォーム送信でいま実際にログインした場合を区別するため）。
  const initializedRef = useRef(false);
  const wasSignedInRef = useRef(false);
  const [showLoggedInToast, setShowLoggedInToast] = useState(false);
  useEffect(() => {
    if (!configured || loading) return;
    if (!initializedRef.current) {
      initializedRef.current = true;
      wasSignedInRef.current = Boolean(user);
      return;
    }
    if (!wasSignedInRef.current && user) {
      setShowLoggedInToast(true);
      const t = setTimeout(() => setShowLoggedInToast(false), 2200);
      wasSignedInRef.current = true;
      return () => clearTimeout(t);
    }
    wasSignedInRef.current = Boolean(user);
  }, [user, loading, configured]);

  if (!configured) return <>{children}</>;
  if (loading) return null; // brief flash while the session is resolved
  if (user && profile.data?.is_suspended) {
    return <SuspendedScreen reason={profile.data.suspension_reason} />;
  }
  // 未ログインでも公開画面はそのまま見せる。登録が必要な画面だけログインに差し替える。
  if (!user && !isPublicView(screen, selectedProfileId)) return <LoginScreen />;
  return (
    <>
      {children}
      {showLoggedInToast && (
        <div
          role="status"
          style={{
            position: "fixed",
            top: 16,
            left: "50%",
            transform: "translateX(-50%)",
            zIndex: 200,
            display: "flex",
            alignItems: "center",
            gap: 8,
            background: colors.textPrimary,
            color: colors.white,
            fontSize: 12.5,
            fontWeight: 700,
            padding: "10px 18px",
            borderRadius: 999,
            boxShadow: "0 12px 26px -12px rgba(0,0,0,.5)",
          }}
        >
          <CheckIcon size={16} color={colors.white} />
          ログインしました
        </div>
      )}
    </>
  );
}
