"use client";

import { useEffect } from "react";

/**
 * /a/<id>（共有用URL）から SPA 本体（/?awase=<id>）へ転送する。
 * このページ自体はクローラーに OGP メタを返すのが役目で、人間の閲覧者は
 * すぐアプリへ移動する。JS が切られていても手動リンクで辿れる。
 */
export function AwaseRedirect({ id }: { id: string }) {
  const target = `/?awase=${encodeURIComponent(id)}`;

  useEffect(() => {
    window.location.replace(target);
  }, [target]);

  return (
    <div
      style={{
        minHeight: "100dvh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: 14,
        background: "linear-gradient(135deg, #8B79C4, #6D5DAB)",
        color: "#fff",
        fontFamily: '"Zen Kaku Gothic New", -apple-system, sans-serif',
        padding: 24,
        textAlign: "center",
      }}
    >
      <div style={{ fontSize: 26, fontWeight: 700, letterSpacing: ".06em" }}>プルミエ！</div>
      <div style={{ fontSize: 13, opacity: 0.9 }}>併せページを開いています…</div>
      <a href={target} style={{ color: "#fff", fontSize: 12.5, textDecoration: "underline" }}>
        自動で移動しない場合はこちら
      </a>
    </div>
  );
}
