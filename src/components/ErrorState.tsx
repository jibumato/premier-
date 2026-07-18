"use client";

import { colors } from "@/lib/tokens";

/**
 * 一覧の読み込み失敗時に出す状態。EmptyState（データが0件）とは意図的に見た目を
 * 分ける——同じ表示だと「募集が本当にないのか、電波が悪くて読めていないだけ
 * なのか」が区別できず、スタジオ・イベント会場など電波の弱い場所で誤解を招く。
 */
export function ErrorState({ onRetry }: { onRetry: () => void }) {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        textAlign: "center",
        padding: "40px 30px",
        gap: 10,
      }}
    >
      <div
        style={{
          width: 60,
          height: 60,
          borderRadius: "50%",
          background: "#FBEBEA",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: 26,
          lineHeight: 1,
        }}
      >
        📡
      </div>
      <div style={{ fontSize: 14, fontWeight: 700, color: colors.textPrimary }}>読み込めませんでした</div>
      <p style={{ margin: 0, fontSize: 12, color: colors.textMutedAlt, lineHeight: 1.8, maxWidth: 260 }}>
        通信状況が不安定な可能性があります。もう一度お試しください。
      </p>
      <button
        onClick={onRetry}
        style={{
          marginTop: 6,
          border: "none",
          background: colors.primary,
          color: colors.white,
          fontFamily: "inherit",
          fontSize: 12.5,
          fontWeight: 700,
          padding: "9px 22px",
          borderRadius: 999,
          cursor: "pointer",
        }}
      >
        再試行
      </button>
    </div>
  );
}
