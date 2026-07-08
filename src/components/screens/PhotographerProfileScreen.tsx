"use client";

import { colors } from "@/lib/tokens";
import { photoRates, photoReviews, photoWorlds, portfolioKeys } from "@/lib/data";
import { useRouter } from "../AppRouter";
import { ImageSlot } from "../ImageSlot";
import { PrimaryButton, SectionHeading } from "../ui";
import { ChevronLeftIcon, PinIcon, StarIcon, VerifiedBadge } from "../icons";

export function PhotographerProfileScreen() {
  const { back, nav } = useRouter();

  return (
    <div>
      {/* app bar */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 18px 8px" }}>
        <button onClick={back} style={{ background: "none", border: "none", cursor: "pointer", padding: 0 }} aria-label="戻る">
          <ChevronLeftIcon size={24} />
        </button>
        <div style={{ fontSize: 14, fontWeight: 600, color: colors.textPrimaryAlt }}>プロフィール</div>
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={colors.textPrimaryAlt} strokeWidth={1.7} strokeLinecap="round">
          <circle cx="12" cy="6" r="1.4" />
          <circle cx="12" cy="12" r="1.4" />
          <circle cx="12" cy="18" r="1.4" />
        </svg>
      </div>

      {/* cover + avatar (plain ring — cameraman, not gradient-ring monetized) */}
      <div style={{ position: "relative" }}>
        <div style={{ height: 150 }}>
          <ImageSlot radius={0} />
        </div>
        <div
          style={{
            position: "absolute",
            left: 22,
            bottom: -38,
            width: 88,
            height: 88,
            borderRadius: "50%",
            border: "4px solid #fff",
            overflow: "hidden",
            boxShadow: "0 8px 22px -10px rgba(60,40,90,.4)",
          }}
        >
          <ImageSlot circle />
        </div>
      </div>

      <div style={{ padding: "48px 22px 0" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <h2 style={{ margin: 0, fontSize: 21, fontWeight: 700, color: colors.textPrimary }}>yuki.films</h2>
          <VerifiedBadge size={17} />
          <span style={{ fontSize: 11, fontWeight: 600, color: colors.primary, background: colors.primaryBg1, padding: "3px 9px", borderRadius: 999 }}>
            本人確認済
          </span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 14, marginTop: 8, fontSize: 12, color: "#877FA0" }}>
          <span style={{ display: "flex", alignItems: "center", gap: 5 }}>
            <PinIcon />
            関東・オンライン相談可
          </span>
          <span style={{ display: "flex", alignItems: "center", gap: 4 }}>
            <StarIcon size={12} filled />
            5.0
          </span>
        </div>
        <p style={{ margin: "14px 0 0", fontSize: 13, lineHeight: 1.85, color: colors.textSecondary }}>
          サイバー・夜景の世界観が得意です。作品の空気感を大切に、レイヤーさんと一緒に一枚をつくります。併せへの参加も歓迎。
        </p>

        {/* role tags */}
        <div style={{ display: "flex", gap: 8, marginTop: 14 }}>
          <span style={{ fontSize: 11.5, color: "#5A4E86", background: colors.primaryBg1, padding: "6px 13px", borderRadius: 999, fontWeight: 600 }}>
            📷 カメラマン
          </span>
          <span style={{ fontSize: 11.5, color: "#4A4458", border: `1px solid ${colors.border}`, padding: "6px 13px", borderRadius: 999 }}>
            併せ参加OK
          </span>
        </div>

        <div style={{ display: "flex", gap: 9, marginTop: 16 }}>
          <button
            onClick={() => nav("chat")}
            style={{
              flex: 1,
              border: "none",
              background: colors.primary,
              color: colors.white,
              fontFamily: "inherit",
              fontSize: 13.5,
              fontWeight: 700,
              padding: 13,
              borderRadius: 14,
              cursor: "pointer",
            }}
          >
            メッセージ
          </button>
          <button
            style={{
              flex: "0 0 auto",
              border: `1px solid ${colors.border}`,
              background: colors.white,
              color: colors.primary,
              fontFamily: "inherit",
              fontSize: 13.5,
              fontWeight: 600,
              padding: "13px 18px",
              borderRadius: 14,
              cursor: "pointer",
            }}
          >
            ＋ フォロー
          </button>
        </div>
      </div>

      {/* 得意な世界観 */}
      <div style={{ padding: "28px 22px 0" }}>
        <SectionHeading size={15}>得意な世界観</SectionHeading>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginTop: 13 }}>
          {photoWorlds.map((w) => (
            <span key={w} style={{ fontSize: 12.5, color: "#4A4458", border: `1px solid ${colors.border}`, background: colors.white, padding: "7px 13px", borderRadius: 999 }}>
              {w}
            </span>
          ))}
        </div>
      </div>

      {/* 作例 */}
      <div style={{ padding: "28px 0 0" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", padding: "0 22px" }}>
          <SectionHeading size={15}>作例</SectionHeading>
          <span style={{ fontSize: 12, color: colors.primary }}>すべて見る →</span>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(2, minmax(0, 1fr))", gap: 8, marginTop: 14, padding: "0 22px" }}>
          {portfolioKeys.map((k) => (
            <div key={k} style={{ height: 140 }}>
              <ImageSlot radius={14} />
            </div>
          ))}
        </div>
      </div>

      {/* 撮影の目安 */}
      <div style={{ padding: "28px 22px 0" }}>
        <SectionHeading size={15}>撮影の目安</SectionHeading>
        <div style={{ display: "flex", flexDirection: "column", gap: 9, marginTop: 13 }}>
          {photoRates.map((r) => (
            <div
              key={r.key}
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                border: `1px solid ${colors.borderSoft}`,
                borderRadius: 14,
                padding: "13px 15px",
                background: colors.primaryBg5,
              }}
            >
              <div>
                <div style={{ fontSize: 13, fontWeight: 700, color: colors.textPrimary }}>{r.title}</div>
                <div style={{ fontSize: 11, color: colors.textMutedAlt, marginTop: 2 }}>{r.note}</div>
              </div>
              <span style={{ fontSize: 13, fontWeight: 700, color: r.accent ? colors.primary : colors.textPrimary }}>{r.price}</span>
            </div>
          ))}
        </div>
        <p style={{ margin: "11px 2px 0", fontSize: 10.5, color: "#A79FC0", lineHeight: 1.6 }}>
          ※ 金額はプロフィール上の目安です。実際の条件は個別にすり合わせてください。
        </p>
      </div>

      {/* レビュー */}
      <div style={{ padding: "28px 22px 30px" }}>
        <SectionHeading size={15}>レビュー</SectionHeading>
        <div style={{ display: "flex", flexDirection: "column", gap: 10, marginTop: 14 }}>
          {photoReviews.map((r) => (
            <div key={r.key} style={{ border: `1px solid ${colors.borderSoft}`, borderRadius: 14, padding: "13px 15px", background: colors.primaryBg5 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ fontSize: 12.5, fontWeight: 700, color: colors.textPrimary }}>{r.from}</span>
                <span style={{ fontSize: 11, color: colors.starGold, letterSpacing: 1 }}>{r.stars}</span>
              </div>
              <p style={{ margin: "7px 0 0", fontSize: 11.5, lineHeight: 1.7, color: colors.textSecondaryAlt }}>{r.text}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
