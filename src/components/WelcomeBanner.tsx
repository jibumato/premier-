"use client";

import { useEffect, useState } from "react";
import { colors } from "@/lib/tokens";
import { useRouter } from "./AppRouter";

/** localStorage key. Bump the suffix to re-show the banner to everyone after a
 * major relaunch (e.g. "_v2"). */
const DISMISS_KEY = "pt_welcome_dismissed_v1";

/**
 * First-visit welcome banner shown at the top of Home. Greets new users, gives
 * a one-line pitch, and points them at the first useful action (整える
 * プロフィール). Dismissible with × and remembered in localStorage, so it does
 * not nag returning users. Starts hidden and reveals only after the
 * localStorage check, avoiding a flash for people who already dismissed it.
 */
export function WelcomeBanner() {
  const { nav } = useRouter();
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    try {
      if (localStorage.getItem(DISMISS_KEY) !== "1") setVisible(true);
    } catch {
      // localStorage unavailable (private mode etc.) — just show it.
      setVisible(true);
    }
  }, []);

  if (!visible) return null;

  const dismiss = () => {
    try {
      localStorage.setItem(DISMISS_KEY, "1");
    } catch {
      /* ignore */
    }
    setVisible(false);
  };

  return (
    <div style={{ padding: "12px 22px 0" }}>
      <div
        style={{
          position: "relative",
          borderRadius: 18,
          padding: "18px 18px 16px",
          background: `linear-gradient(135deg, ${colors.primary} 0%, ${colors.primaryGradientLight} 55%, ${colors.pink} 130%)`,
          color: colors.white,
          overflow: "hidden",
          boxShadow: "0 14px 30px -16px rgba(80,60,120,.55)",
        }}
      >
        {/* soft decorative glow */}
        <div
          aria-hidden
          style={{
            position: "absolute",
            right: -30,
            top: -30,
            width: 120,
            height: 120,
            borderRadius: "50%",
            background: "rgba(255,255,255,.16)",
          }}
        />

        {/* close */}
        <button
          onClick={dismiss}
          aria-label="閉じる"
          style={{
            position: "absolute",
            right: 10,
            top: 10,
            width: 26,
            height: 26,
            borderRadius: "50%",
            border: "none",
            background: "rgba(255,255,255,.22)",
            color: colors.white,
            fontSize: 15,
            lineHeight: 1,
            cursor: "pointer",
            fontFamily: "inherit",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          ×
        </button>

        <div style={{ position: "relative", display: "flex", alignItems: "center", gap: 13 }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/logo.png"
            alt=""
            width={48}
            height={48}
            style={{
              width: 48,
              height: 48,
              borderRadius: "50%",
              display: "block",
              flex: "0 0 48px",
              boxShadow: "0 4px 12px -4px rgba(0,0,0,.3)",
            }}
          />
          <div style={{ minWidth: 0 }}>
            <div style={{ fontSize: 15.5, fontWeight: 700, letterSpacing: ".02em" }}>
              プルミエ！へようこそ🎉
            </div>
            <p style={{ margin: "5px 0 0", fontSize: 12, lineHeight: 1.7, color: "rgba(255,255,255,.92)" }}>
              好きな作品で、いっしょに“併せ”をつくる仲間を見つけよう。
              まずはプロフィールを整えるところから。
            </p>
          </div>
        </div>

        <div style={{ position: "relative", display: "flex", gap: 8, marginTop: 14 }}>
          <button
            onClick={() => nav("profile", "mypage")}
            style={{
              flex: 1,
              border: "none",
              background: colors.white,
              color: colors.primary,
              fontFamily: "inherit",
              fontSize: 12.5,
              fontWeight: 700,
              padding: "10px 0",
              borderRadius: 11,
              cursor: "pointer",
            }}
          >
            プロフィールを整える
          </button>
          <button
            onClick={() => nav("search", "search")}
            style={{
              flex: 1,
              border: "1px solid rgba(255,255,255,.6)",
              background: "transparent",
              color: colors.white,
              fontFamily: "inherit",
              fontSize: 12.5,
              fontWeight: 700,
              padding: "10px 0",
              borderRadius: 11,
              cursor: "pointer",
            }}
          >
            併せをさがす
          </button>
        </div>
      </div>
    </div>
  );
}
