"use client";

import { colors } from "@/lib/tokens";
import { detailRoles } from "@/lib/data";
import { useRouter } from "../AppRouter";
import { ImageSlot } from "../ImageSlot";
import { SectionHeading, PrimaryButton } from "../ui";
import { ChevronLeftIcon, ShareIcon } from "../icons";

const infoGrid = [
  { label: "日程", value: "7/26(日) 13:00〜" },
  { label: "場所", value: "都内スタジオ" },
  { label: "募集人数", value: "あと2名（4/6）" },
  { label: "費用", value: "スタジオ代 割り勘" },
];

export function DetailScreen() {
  const { back, nav } = useRouter();

  return (
    <div>
      {/* app bar */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          padding: "10px 18px 8px",
        }}
      >
        <button
          onClick={back}
          style={{ background: "none", border: "none", cursor: "pointer", padding: 0 }}
          aria-label="戻る"
        >
          <ChevronLeftIcon size={24} />
        </button>
        <div style={{ fontSize: 14, fontWeight: 600, color: colors.textPrimaryAlt }}>募集の詳細</div>
        <button
          style={{ background: "none", border: "none", cursor: "pointer", padding: 0 }}
          aria-label="共有"
        >
          <ShareIcon />
        </button>
      </div>

      {/* hero */}
      <div style={{ position: "relative", padding: "6px 22px 0" }}>
        <div style={{ height: 194 }}>
          <ImageSlot radius={18} />
        </div>
        <span
          style={{
            position: "absolute",
            left: 34,
            top: 18,
            fontSize: 11,
            fontWeight: 600,
            color: colors.white,
            background: "rgba(109,93,171,.92)",
            padding: "6px 12px",
            borderRadius: 999,
          }}
        >
          募集中
        </span>
        <span
          style={{
            position: "absolute",
            right: 34,
            top: 18,
            fontSize: 11,
            fontWeight: 600,
            color: colors.pinkText,
            background: "rgba(255,255,255,.92)",
            padding: "6px 12px",
            borderRadius: 999,
          }}
        >
          女性限定
        </span>
      </div>

      {/* title + tags */}
      <div style={{ padding: "18px 22px 0" }}>
        <h2 style={{ margin: 0, fontSize: 21, lineHeight: 1.4, fontWeight: 700, color: colors.textPrimary }}>
          魔法学園シリーズ 生徒会併せ
        </h2>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginTop: 12 }}>
          <span
            style={{
              fontSize: 11.5,
              color: colors.primary,
              background: colors.primaryBg1,
              padding: "6px 12px",
              borderRadius: 999,
              fontWeight: 500,
            }}
          >
            葬送のフリーレン
          </span>
          <span
            style={{
              fontSize: 11.5,
              color: "#4A4458",
              border: `1px solid ${colors.border}`,
              padding: "6px 12px",
              borderRadius: 999,
            }}
          >
            透明感
          </span>
        </div>
      </div>

      {/* host card */}
      <div style={{ padding: "18px 22px 0" }}>
        <button
          onClick={() => nav("profile", "mypage")}
          style={{
            width: "100%",
            display: "flex",
            alignItems: "center",
            gap: 12,
            border: `1px solid ${colors.borderSoft}`,
            borderRadius: 16,
            padding: "12px 14px",
            background: colors.primaryBg5,
            cursor: "pointer",
            fontFamily: "inherit",
            textAlign: "left",
          }}
        >
          <div style={{ width: 44, height: 44, borderRadius: "50%", overflow: "hidden", flex: "0 0 auto" }}>
            <ImageSlot circle />
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 13.5, fontWeight: 700, color: colors.textPrimary }}>主催・澪 / mio</div>
            <div style={{ fontSize: 11, color: colors.textMutedAlt, marginTop: 2 }}>
              本人確認済 · 併せ実績 36回
            </div>
          </div>
          <span style={{ fontSize: 11.5, color: colors.primary, fontWeight: 600, whiteSpace: "nowrap" }}>
            プロフ →
          </span>
        </button>
      </div>

      {/* info grid */}
      <div style={{ padding: "20px 22px 0" }}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
          {infoGrid.map((it) => (
            <div
              key={it.label}
              style={{ border: `1px solid ${colors.borderSoft}`, borderRadius: 14, padding: "13px 14px" }}
            >
              <div style={{ fontSize: 10.5, color: colors.textMutedAlt }}>{it.label}</div>
              <div style={{ fontSize: 13, fontWeight: 700, color: colors.textPrimary, marginTop: 5 }}>
                {it.value}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* body */}
      <div style={{ padding: "24px 22px 0" }}>
        <SectionHeading size={15}>募集内容</SectionHeading>
        <p style={{ margin: "12px 0 0", fontSize: 13, lineHeight: 1.9, color: colors.textSecondary }}>
          生徒会メンバーで併せをします◎ 透明感のある世界観で、自然光メインのスタジオ撮影予定。カメラマンさん1名にも入っていただけると嬉しいです。初めての方も歓迎、当日は和やかに進めます。
        </p>
      </div>

      {/* roles */}
      <div style={{ padding: "22px 22px 26px" }}>
        <SectionHeading size={15}>募集キャラ</SectionHeading>
        <div style={{ display: "flex", flexDirection: "column", gap: 9, marginTop: 13 }}>
          {detailRoles.map((ro) => {
            const confirmed = ro.status === "確定";
            return (
              <div
                key={ro.key}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 12,
                  border: `1px solid ${colors.borderSoft}`,
                  borderRadius: 14,
                  padding: "11px 13px",
                  background: confirmed ? colors.primaryBg5 : colors.white,
                }}
              >
                <div
                  style={{
                    width: 38,
                    height: 38,
                    borderRadius: "50%",
                    overflow: "hidden",
                    flex: "0 0 auto",
                    background: colors.primaryBg1,
                  }}
                >
                  <ImageSlot circle />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: colors.textPrimary }}>{ro.char}</div>
                  <div style={{ fontSize: 11, color: colors.textMutedAlt, marginTop: 2 }}>{ro.who}</div>
                </div>
                <span
                  style={{
                    fontSize: 11,
                    fontWeight: 600,
                    color: confirmed ? colors.primary : colors.pinkText,
                    background: confirmed ? colors.primaryBg1 : colors.pinkBg1,
                    padding: "5px 11px",
                    borderRadius: 999,
                    whiteSpace: "nowrap",
                  }}
                >
                  {ro.status}
                </span>
              </div>
            );
          })}
        </div>
        <PrimaryButton onClick={() => nav("applied")} style={{ marginTop: 22 }}>
          この併せに応募する
        </PrimaryButton>
      </div>
    </div>
  );
}
