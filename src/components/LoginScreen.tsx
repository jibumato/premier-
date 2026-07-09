"use client";

import { useState } from "react";
import { colors } from "@/lib/tokens";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { PrimaryButton } from "./ui";

type Mode = "signIn" | "signUp";

/**
 * Auth gate screen shown when Supabase is configured but no session exists.
 * Not part of the screen router (no back-stack): AuthGate swaps it in/out
 * purely based on auth state, so a successful sign-in/up simply reveals the
 * app underneath once onAuthStateChange fires.
 */
export function LoginScreen() {
  const [mode, setMode] = useState<Mode>("signIn");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [signedUpNotice, setSignedUpNotice] = useState(false);

  const submit = async () => {
    setError(null);
    if (!email.trim() || !password) {
      setError("メールアドレスとパスワードを入力してください");
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
    <div style={{ minHeight: "100%", display: "flex", flexDirection: "column" }}>
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

      <div style={{ padding: "22px 22px 0" }}>
        <PrimaryButton onClick={submit} style={submitting ? { opacity: 0.6, cursor: "not-allowed" } : undefined}>
          {submitting ? "処理中…" : mode === "signIn" ? "ログイン" : "アカウントを作成"}
        </PrimaryButton>
      </div>

      <div style={{ padding: "16px 22px 30px", textAlign: "center", marginTop: "auto" }}>
        <button
          onClick={() => {
            setMode((m) => (m === "signIn" ? "signUp" : "signIn"));
            setError(null);
            setSignedUpNotice(false);
          }}
          style={{ background: "none", border: "none", fontFamily: "inherit", fontSize: 12.5, color: colors.textMutedAlt, cursor: "pointer" }}
        >
          {mode === "signIn" ? "アカウントをお持ちでない方はこちら" : "すでにアカウントをお持ちの方はこちら"}
        </button>
      </div>
    </div>
  );
}
