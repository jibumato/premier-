"use client";

import { useState } from "react";
import { colors } from "@/lib/tokens";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { PrimaryButton } from "./ui";

/**
 * アカウントが運営により停止された場合に表示する画面。AuthGate から、
 * ログイン中かつ profiles.is_suspended が true のときに children の代わりに
 * 表示される（ルーターの外＝どの画面にも遷移できない）。
 */
export function SuspendedScreen({ reason }: { reason: string | null }) {
  const [signingOut, setSigningOut] = useState(false);

  const handleSignOut = async () => {
    setSigningOut(true);
    try {
      await getSupabaseBrowserClient().auth.signOut();
    } finally {
      setSigningOut(false);
    }
  };

  return (
    <div style={{ minHeight: "100%", display: "flex", flexDirection: "column", padding: "70px 26px 30px" }}>
      <div
        style={{
          width: 64,
          height: 64,
          borderRadius: "50%",
          background: "#FBEBEA",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: 28,
        }}
      >
        🚫
      </div>
      <h2 style={{ margin: "20px 0 0", fontSize: 20, fontWeight: 700, color: colors.textPrimary }}>
        アカウントが停止されています
      </h2>
      <p style={{ margin: "12px 0 0", fontSize: 13, lineHeight: 1.9, color: colors.textSecondary }}>
        利用規約・ガイドラインに反する行為が確認されたため、運営がこのアカウントの利用を停止しました。
      </p>

      {reason && (
        <div
          style={{
            marginTop: 18,
            border: `1px solid ${colors.borderSoft}`,
            borderRadius: 12,
            padding: "13px 14px",
            background: colors.primaryBg5,
          }}
        >
          <div style={{ fontSize: 11, fontWeight: 700, color: colors.textMutedAlt }}>停止理由</div>
          <p style={{ margin: "6px 0 0", fontSize: 12.5, lineHeight: 1.8, color: colors.textSecondary, whiteSpace: "pre-wrap" }}>
            {reason}
          </p>
        </div>
      )}

      <p style={{ margin: "18px 0 0", fontSize: 12, lineHeight: 1.9, color: colors.textMutedAlt }}>
        対応にご異議がある場合は、下記までお問い合わせください。
        <br />
        16typeandco@gmail.com
      </p>

      <div style={{ marginTop: "auto", paddingTop: 24 }}>
        <PrimaryButton
          onClick={handleSignOut}
          style={{ opacity: signingOut ? 0.6 : 1, cursor: signingOut ? "default" : "pointer" }}
        >
          {signingOut ? "処理中…" : "ログアウト"}
        </PrimaryButton>
      </div>
    </div>
  );
}
