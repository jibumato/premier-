"use client";

import { colors } from "@/lib/tokens";
import { useRouter } from "./AppRouter";
import { SectionHeading } from "./ui";

/**
 * 「安心して参加できる仕組み」セクション。既に実装済みの安全機能（本人確認バッジ・
 * レビュー・通報/ブロック・知恵袋）を新規ユーザーに一枚で伝え、参加のハードルを下げる。
 * 知恵袋カードのみ実導線（nav("qa")）、他は説明カード。
 */
export function SafetySection() {
  const { nav } = useRouter();

  const cards: { icon: string; title: string; body: string; onClick?: () => void }[] = [
    { icon: "/safety-verify.png", title: "本人確認バッジ", body: "確認済みの人は名前の横にバッジ。なりすまし対策に。" },
    { icon: "/safety-review.png", title: "レビュー制度", body: "参加後にお互いを評価。信頼できる仲間が見つかる。" },
    { icon: "/safety-report.png", title: "通報・ブロック", body: "不快な相手はすぐブロック。運営がしっかり対応します。" },
    { icon: "/safety-qa.png", title: "困ったら知恵袋", body: "使い方やマナーを気軽に質問できます。", onClick: () => nav("qa") },
  ];

  return (
    <div style={{ padding: "28px 0 0" }}>
      <div style={{ padding: "0 22px" }}>
        <SectionHeading accent={colors.primary}>安心して参加できる制度</SectionHeading>
      </div>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: 10,
          padding: "14px 22px 0",
        }}
      >
        {cards.map((c) => {
          const inner = (
            <>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={c.icon} alt="" width={40} height={40} style={{ display: "block" }} />
              <div style={{ fontSize: 12.5, fontWeight: 700, color: colors.textPrimary, marginTop: 8 }}>{c.title}</div>
              <div style={{ fontSize: 10.5, color: colors.textMutedAlt, lineHeight: 1.6, marginTop: 4 }}>{c.body}</div>
              {c.onClick && (
                <div style={{ fontSize: 10.5, fontWeight: 700, color: colors.primary, marginTop: 7 }}>知恵袋を見る →</div>
              )}
            </>
          );
          const style: React.CSSProperties = {
            border: `1px solid ${colors.borderSoft}`,
            borderRadius: 16,
            padding: "14px 14px 15px",
            background: colors.white,
            textAlign: "left",
            fontFamily: "inherit",
          };
          return c.onClick ? (
            <button key={c.title} onClick={c.onClick} style={{ ...style, cursor: "pointer" }}>
              {inner}
            </button>
          ) : (
            <div key={c.title} style={style}>
              {inner}
            </div>
          );
        })}
      </div>
    </div>
  );
}
