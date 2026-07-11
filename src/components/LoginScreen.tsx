"use client";

import { useState } from "react";
import { colors } from "@/lib/tokens";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { PrimaryButton } from "./ui";
import { TermsContent } from "./TermsContent";
import { PrivacyContent } from "./PrivacyContent";

type Mode = "signIn" | "signUp";

/**
 * Auth gate screen shown when Supabase is configured but no session exists.
 * Not part of the screen router (no back-stack): AuthGate swaps it in/out
 * purely based on auth state, so a successful sign-in/up simply reveals the
 * app underneath once onAuthStateChange fires. Because it lives outside the
 * router, the terms are shown via an in-screen overlay rather than nav().
 */
export function LoginScreen() {
  const [mode, setMode] = useState<Mode>("signIn");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [signedUpNotice, setSignedUpNotice] = useState(false);
  const [agreed, setAgreed] = useState(false);
  // Which legal doc the overlay is showing (LoginScreen lives outside the router).
  const [overlay, setOverlay] = useState<null | "terms" | "privacy">(null);

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
      } else {
        const { error: err } = await supabase.auth.signUp({ email, password });
        if (err) throw err;
        setSignedUpNotice(true);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "エラーが発生しました");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div style={{ minHeight: "100%", display: "flex", flexDirection: "column", position: "relative" }}>
      <div style={{ padding: "70px 26px 0" }}>
        <div style={{ fontSize: 20, fontWeight: 700, letterSpacing: ".06em", color: colors.textPrimary }}>
          プルミエ<span style={{ color: colors.pink }}>！</span>
        </div>
        <h2 style={{ margin: "22px 0 0", fontSize: 23, lineHeight: 1.5, fontWeight: 700, color: colors.textPrimary }}>
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
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="8文字以上"
            autoComplete={mode === "signIn" ? "current-password" : "new-password"}
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
              に同意します
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
          onClick={() => {
            setMode((m) => (m === "signIn" ? "signUp" : "signIn"));
            setError(null);
            setSignedUpNotice(false);
            setAgreed(false);
          }}
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
