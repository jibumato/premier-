"use client";

import { useState } from "react";
import { colors } from "@/lib/tokens";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { siteTagline } from "@/lib/data";
import { PrimaryButton } from "./ui";
import { TermsContent } from "./TermsContent";
import { PrivacyContent } from "./PrivacyContent";
import { useRouter } from "./AppRouter";

type Mode = "signIn" | "signUp";

/** Supabase 認証エラーを日本語の分かりやすい文言に変換。未知のものは実メッセージを添える。 */
function friendlyAuthError(e: unknown, mode: Mode): string {
  const err = e as { message?: string; code?: string; status?: number; name?: string };
  const rawMsg = (err?.message ?? "").toString();
  const m = rawMsg.toLowerCase();
  const code = (err?.code ?? "").toString();
  const status = err?.status;
  // "{}"/"[object Object]" のような中身の無いメッセージは空扱いにする
  const msg = rawMsg === "{}" || rawMsg === "[object Object]" ? "" : rawMsg;
  if (m.includes("already registered") || code === "user_already_exists")
    return "このメールアドレスは既に登録されています。ログインをお試しください。";
  // 確認メールの送信に失敗（送信制限 or SMTP設定不備）— 登録時に最も多い
  if (
    m.includes("rate limit") ||
    status === 429 ||
    code.includes("rate_limit") ||
    m.includes("sending") ||
    m.includes("confirmation email") ||
    m.includes("smtp") ||
    m.includes("email") && m.includes("send")
  )
    return "確認メールの送信に失敗しました。送信回数の制限に達したか、メール送信設定に問題がある可能性があります。数分おいて再度お試しください。";
  if (m.includes("invalid login") || code === "invalid_credentials")
    return "メールアドレスまたはパスワードが正しくありません。";
  if (m.includes("email not confirmed") || code === "email_not_confirmed")
    return "メールアドレスの確認が完了していません。届いた確認メールのリンクを開いてください。";
  if (m.includes("password") && (m.includes("6") || m.includes("at least")))
    return "パスワードは6文字以上で入力してください。";
  if (m.includes("password"))
    return "パスワードの条件を満たしていません。もう少し長く・複雑にしてください。";
  if (m.includes("invalid") && m.includes("email"))
    return "メールアドレスの形式が正しくありません。";
  if (m.includes("signups not allowed") || m.includes("signup is disabled") || m.includes("email logins are disabled") || m.includes("signups are disabled"))
    return "現在、新規登録を受け付けていません（運営の設定をご確認ください）。";
  const action = mode === "signUp" ? "登録" : "ログイン";
  // 登録時に中身の無いエラー = 確認メール送信まわりの失敗が濃厚
  if (!msg && mode === "signUp")
    return "登録に失敗しました。確認メールの送信でエラーが発生した可能性があります（送信制限またはメール設定）。数分おいて再度お試しください。";
  return msg ? `${action}に失敗しました：${msg}` : `${action}に失敗しました。時間をおいて再度お試しください。`;
}

/**
 * Login/signup screen. Shown two ways: (1) AuthGate swaps it in when a
 * signed-out visitor reaches a screen that needs an account, and (2) it is a
 * routable screen ("login") reached from the browse CTAs in the hybrid model.
 * A successful sign-in/up flips auth state and reveals the intended screen via
 * onAuthStateChange. Terms/privacy are shown via an in-screen overlay; a
 * "見てまわる →" link lets visitors return to browsing without registering.
 */
export function LoginScreen() {
  const { screen, nav, back } = useRouter();
  const [mode, setMode] = useState<Mode>("signIn");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [signedUpNotice, setSignedUpNotice] = useState(false);
  const [agreed, setAgreed] = useState(false);
  // Which legal doc the overlay is showing (LoginScreen lives outside the router).
  const [overlay, setOverlay] = useState<null | "terms" | "privacy">(null);

  const switchMode = () => {
    const nextMode: Mode = mode === "signIn" ? "signUp" : "signIn";
    setMode(nextMode);
    setError(null);
    setSignedUpNotice(false);
    setAgreed(false);
  };

  const submit = async () => {
    setError(null);
    if (!email.trim() || !password) {
      setError("メールアドレスとパスワードを入力してください");
      return;
    }
    if (mode === "signUp" && !agreed) {
      setError("利用規約・ガイドラインへの同意が必要です");
      return;
    }
    setSubmitting(true);
    const supabase = getSupabaseBrowserClient();
    try {
      if (mode === "signIn") {
        const { error: err } = await supabase.auth.signInWithPassword({ email, password });
        if (err) throw err;
        // ルーティングされた「login」画面（応募・参加表明・フォロー等の操作から
        // 辿り着いた場合）は、ログイン成功後に元いた画面へ戻す（＝やろうとしていた
        // 操作の場所に復帰）。AuthGateがログイン必須画面の代わりにこのコンポーネント
        // を差し込んでいるだけの場合（screenは元の目的地のまま）は、そのまま
        // onAuthStateChangeで本来の画面に切り替わるようにする。
        if (screen === "login") back();
      } else {
        // Send the email-confirmation link back to whatever origin the user
        // signed up on (localhost in dev, the production domain in prod) rather
        // than relying solely on Supabase's fixed "Site URL". The target must
        // also be allowlisted in Supabase → Authentication → Redirect URLs.
        const { error: err } = await supabase.auth.signUp({
          email,
          password,
          options: { emailRedirectTo: window.location.origin },
        });
        if (err) throw err;
        setSignedUpNotice(true);
      }
    } catch (e) {
      console.error("auth error", e);
      setError(friendlyAuthError(e, mode));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div style={{ minHeight: "100%", display: "flex", flexDirection: "column", position: "relative" }}>
      {/* 未ログインでも中を見てまわれるハイブリッド。登録せずホームへ戻れる導線。 */}
      <div style={{ position: "absolute", top: 14, right: 16, zIndex: 2 }}>
        <button
          onClick={() => nav("home", "home")}
          style={{
            background: "none",
            border: "none",
            padding: "6px 4px",
            fontFamily: "inherit",
            fontSize: 12,
            fontWeight: 700,
            color: colors.textMutedAlt,
            cursor: "pointer",
          }}
        >
          見てまわる →
        </button>
      </div>
      <div style={{ padding: "58px 26px 0" }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/logo.png"
          alt="プルミエ！"
          width={92}
          height={92}
          style={{
            width: 92,
            height: 92,
            borderRadius: "50%",
            display: "block",
            boxShadow: "0 10px 26px -12px rgba(80,60,120,.5)",
          }}
        />
        <div style={{ marginTop: 14, fontSize: 13, fontWeight: 600, color: colors.primary, letterSpacing: ".02em" }}>
          {siteTagline}
        </div>
        <h2 style={{ margin: "10px 0 0", fontSize: 23, lineHeight: 1.5, fontWeight: 700, color: colors.textPrimary }}>
          {mode === "signIn" ? "おかえりなさい" : "はじめまして"}
        </h2>
        <p style={{ margin: "12px 0 0", fontSize: 13, color: colors.textMuted, lineHeight: 1.8 }}>
          {mode === "signIn"
            ? "メールアドレスでログインしてください。"
            : "メールアドレスでアカウントを作成します。"}
        </p>
      </div>

      <div style={{ padding: "26px 22px 0", display: "flex", flexDirection: "column", gap: 14 }}>
        <div>
          <label style={{ fontSize: 12.5, fontWeight: 700, color: "#3A3548" }}>メールアドレス</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            autoComplete="email"
            style={{
              width: "100%",
              marginTop: 8,
              border: `1px solid ${colors.border}`,
              borderRadius: 13,
              padding: "13px 15px",
              fontSize: 13.5,
              fontFamily: "inherit",
              color: colors.textPrimary,
              outline: "none",
              background: colors.primaryBg5,
            }}
          />
        </div>
        <div>
          <label style={{ fontSize: 12.5, fontWeight: 700, color: "#3A3548" }}>パスワード</label>
          <div style={{ position: "relative", marginTop: 8 }}>
            <input
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="8文字以上"
              autoComplete={mode === "signIn" ? "current-password" : "new-password"}
              style={{
                width: "100%",
                border: `1px solid ${colors.border}`,
                borderRadius: 13,
                padding: "13px 62px 13px 15px",
                fontSize: 13.5,
                fontFamily: "inherit",
                color: colors.textPrimary,
                outline: "none",
                background: colors.primaryBg5,
              }}
            />
            <button
              type="button"
              onClick={() => setShowPassword((v) => !v)}
              aria-label={showPassword ? "パスワードを非表示にする" : "パスワードを表示する"}
              aria-pressed={showPassword}
              style={{
                position: "absolute",
                right: 8,
                top: "50%",
                transform: "translateY(-50%)",
                border: "none",
                background: "none",
                padding: "6px 8px",
                fontFamily: "inherit",
                fontSize: 12,
                fontWeight: 700,
                color: colors.primary,
                cursor: "pointer",
              }}
            >
              {showPassword ? "非表示" : "表示"}
            </button>
          </div>
        </div>

        {error && (
          <div style={{ fontSize: 12, color: "#C0453F", background: "#FBEBEA", borderRadius: 10, padding: "10px 12px" }}>
            {error}
          </div>
        )}
        {signedUpNotice && (
          <div
            style={{
              fontSize: 12,
              color: colors.primary,
              background: colors.primaryBg2,
              borderRadius: 10,
              padding: "10px 12px",
              lineHeight: 1.7,
            }}
          >
            確認メールを送信しました。メール内のリンクからログインを完了してください。
          </div>
        )}
      </div>

      {mode === "signUp" && (
        <div style={{ padding: "18px 22px 0" }}>
          <label style={{ display: "flex", alignItems: "flex-start", gap: 9, cursor: "pointer" }}>
            <input
              type="checkbox"
              checked={agreed}
              onChange={(e) => setAgreed(e.target.checked)}
              style={{ marginTop: 2, width: 16, height: 16, accentColor: colors.primary, flex: "0 0 auto" }}
            />
            <span style={{ fontSize: 12, lineHeight: 1.7, color: colors.textSecondary }}>
              <button
                type="button"
                onClick={() => setOverlay("terms")}
                style={{ background: "none", border: "none", padding: 0, color: colors.primary, fontWeight: 700, textDecoration: "underline", cursor: "pointer", fontFamily: "inherit", fontSize: 12 }}
              >
                利用規約
              </button>
              ・
              <button
                type="button"
                onClick={() => setOverlay("privacy")}
                style={{ background: "none", border: "none", padding: 0, color: colors.primary, fontWeight: 700, textDecoration: "underline", cursor: "pointer", fontFamily: "inherit", fontSize: 12 }}
              >
                プライバシーポリシー
              </button>
              に同意し、18歳以上であることを確認します
            </span>
          </label>
        </div>
      )}

      <div style={{ padding: "16px 22px 0" }}>
        <PrimaryButton
          onClick={submit}
          style={
            submitting || (mode === "signUp" && !agreed)
              ? { opacity: 0.6, cursor: "not-allowed" }
              : undefined
          }
        >
          {submitting ? "処理中…" : mode === "signIn" ? "ログイン" : "アカウントを作成"}
        </PrimaryButton>
      </div>

      <div style={{ padding: "16px 22px 30px", textAlign: "center", marginTop: "auto" }}>
        <button
          onClick={switchMode}
          style={{ background: "none", border: "none", fontFamily: "inherit", fontSize: 12.5, color: colors.textMutedAlt, cursor: "pointer" }}
        >
          {mode === "signIn" ? "アカウントをお持ちでない方はこちら" : "すでにアカウントをお持ちの方はこちら"}
        </button>
      </div>

      {/* legal overlay — LoginScreen lives outside the router, so the terms /
          privacy policy are shown here instead of via nav() */}
      {overlay && (
        <div
          style={{
            position: "absolute",
            inset: 0,
            background: colors.white,
            display: "flex",
            flexDirection: "column",
            zIndex: 10,
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              padding: "14px 18px",
              borderBottom: `1px solid ${colors.borderSofter}`,
            }}
          >
            <span style={{ fontSize: 14, fontWeight: 700, color: colors.textPrimary }}>
              {overlay === "terms" ? "利用規約・ガイドライン" : "プライバシーポリシー"}
            </span>
            <button
              onClick={() => setOverlay(null)}
              style={{ background: "none", border: "none", fontSize: 13, fontWeight: 700, color: colors.primary, cursor: "pointer", fontFamily: "inherit" }}
            >
              閉じる
            </button>
          </div>
          <div style={{ flex: 1, overflowY: "auto", padding: "12px 22px 24px" }}>
            {overlay === "terms" ? <TermsContent /> : <PrivacyContent />}
          </div>
        </div>
      )}
    </div>
  );
}
