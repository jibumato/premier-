"use client";

import { colors } from "@/lib/tokens";
import { useRouter } from "./AppRouter";

/**
 * 事業者向けの控えめな掲載導線（収益導線）。スタジオ運営・イベント主催など、
 * 掲載を検討しうる人が自然に訪れる一覧の末尾に置き、法人掲載面（収益の柱）へ
 * 送客する。一般ユーザーの邪魔にならないよう、点線＋淡色の小さなカードにする。
 */
export function CorporatePromo({ label, sub }: { label: string; sub: string }) {
  const { nav } = useRouter();
  return (
    <div style={{ padding: "8px 22px 30px" }}>
      <button
        onClick={() => nav("corporate")}
        style={{
          width: "100%",
          display: "flex",
          alignItems: "center",
          gap: 12,
          border: `1px dashed ${colors.border}`,
          background: colors.primaryBg5,
          borderRadius: 14,
          padding: "14px 16px",
          fontFamily: "inherit",
          textAlign: "left",
          cursor: "pointer",
        }}
      >
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 12.5, fontWeight: 700, color: colors.textPrimary }}>{label}</div>
          <div style={{ fontSize: 10.5, color: colors.textMutedAlt, marginTop: 3, lineHeight: 1.5 }}>{sub}</div>
        </div>
        <span style={{ fontSize: 11.5, color: colors.primary, fontWeight: 700, whiteSpace: "nowrap" }}>掲載案内 →</span>
      </button>
    </div>
  );
}
