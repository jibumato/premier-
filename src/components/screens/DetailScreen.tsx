"use client";

import { useState } from "react";
import { colors } from "@/lib/tokens";
import { detailRoles } from "@/lib/data";
import { useRouter } from "../AppRouter";
import { ImageSlot } from "../ImageSlot";
import { SectionHeading, PrimaryButton } from "../ui";
import { ChevronLeftIcon, FlagIcon, ShareIcon } from "../icons";
import { useAuth } from "@/lib/auth/useAuth";
import { useApply, useAwase, useAwaseRoles } from "@/lib/queries/awase";
import { useAwaseAchievementCount } from "@/lib/queries/profile";
import { isSupabaseConfigured } from "@/lib/supabase/config";

const mockInfoGrid = [
  { label: "日程", value: "7/26(日) 13:00〜" },
  { label: "場所", value: "都内スタジオ" },
  { label: "募集人数", value: "あと2名（4/6）" },
  { label: "費用", value: "スタジオ代 割り勘" },
];

export function DetailScreen() {
  const { back, nav, openProfile, openReport, selectedAwaseId } = useRouter();
  const { user } = useAuth();
  const configured = isSupabaseConfigured();

  const awaseQuery = useAwase(selectedAwaseId);
  const rolesQuery = useAwaseRoles(selectedAwaseId);
  const apply = useApply();

  const real = configured && selectedAwaseId ? awaseQuery.data : undefined;
  const roles = real ? (rolesQuery.data ?? []) : detailRoles;

  const title = real?.title ?? "魔法学園シリーズ 生徒会併せ";
  const workName = real?.works?.name ?? "葬送のフリーレン";
  const worldTag = real?.world_tags?.[0] ?? "透明感";
  const hostName = real?.profiles?.display_name ?? "澪 / mio";
  const hostVerified = real?.profiles?.is_verified ?? true;
  const hostAchievements = useAwaseAchievementCount(real?.host_id);
  const hostAchievementCount = real ? (hostAchievements.data ?? 0) : 36;
  const infoGrid = real
    ? [
        { label: "日程", value: real.event_date },
        { label: "場所", value: real.place ?? "未定" },
        { label: "募集人数", value: real.capacity ? `定員${real.capacity}名` : "募集中" },
        { label: "費用", value: real.fee_text ?? "応相談" },
      ]
    : mockInfoGrid;
  const bodyText =
    real?.body ||
    "生徒会メンバーで併せをします◎ 透明感のある世界観で、自然光メインのスタジオ撮影予定。カメラマンさん1名にも入っていただけると嬉しいです。初めての方も歓迎、当日は和やかに進めます。";

  const handleApply = () => {
    if (real && user) {
      apply.mutate({ awaseId: real.id, applicantId: user.id });
    }
    nav("applied");
  };

  const [copied, setCopied] = useState(false);
  const handleShare = async () => {
    if (typeof window === "undefined") return;
    const url = window.location.href;
    const shareData = { title: `${title}｜プルミエ！`, text: `${title}（${workName}）`, url };
    try {
      if (navigator.share) {
        await navigator.share(shareData);
      } else if (navigator.clipboard) {
        await navigator.clipboard.writeText(url);
        setCopied(true);
        window.setTimeout(() => setCopied(false), 1800);
      }
    } catch {
      // user cancelled the share sheet — nothing to do
    }
  };

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
          onClick={handleShare}
          style={{ background: "none", border: "none", cursor: "pointer", padding: 0 }}
          aria-label="共有"
        >
          <ShareIcon />
        </button>
      </div>

      {copied && (
        <div
          style={{
            position: "fixed",
            left: "50%",
            bottom: 90,
            transform: "translateX(-50%)",
            background: "rgba(38,34,47,.92)",
            color: colors.white,
            fontSize: 12.5,
            fontWeight: 600,
            padding: "10px 18px",
            borderRadius: 999,
            zIndex: 50,
            whiteSpace: "nowrap",
          }}
        >
          リンクをコピーしました
        </div>
      )}

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
          {title}
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
            {workName}
          </span>
          {worldTag && (
            <span
              style={{
                fontSize: 11.5,
                color: "#4A4458",
                border: `1px solid ${colors.border}`,
                padding: "6px 12px",
                borderRadius: 999,
              }}
            >
              {worldTag}
            </span>
          )}
        </div>
      </div>

      {/* host card */}
      <div style={{ padding: "18px 22px 0" }}>
        <button
          onClick={() => (real ? openProfile(real.host_id) : nav("profile", "mypage"))}
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
            <div style={{ fontSize: 13.5, fontWeight: 700, color: colors.textPrimary }}>主催・{hostName}</div>
            <div style={{ fontSize: 11, color: colors.textMutedAlt, marginTop: 2 }}>
              {hostVerified ? "本人確認済" : "本人確認前"} · 併せ実績 {hostAchievementCount}回
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
          {bodyText}
        </p>
      </div>

      {/* roles */}
      <div style={{ padding: "22px 22px 26px" }}>
        <SectionHeading size={15}>募集キャラ</SectionHeading>
        <div style={{ display: "flex", flexDirection: "column", gap: 9, marginTop: 13 }}>
          {roles.map((ro) => {
            const confirmed = ro.status === "確定";
            // カメラマン専用プロフィール画面は実データ未接続のため、当面は遷移
            // させない（役割は一覧表示のみ）。接続時にここへ導線を戻す。
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
        <PrimaryButton onClick={handleApply} style={{ marginTop: 22 }}>
          この併せに応募する
        </PrimaryButton>
        <button
          onClick={() =>
            real
              ? openReport({ type: "awase", id: real.id, userId: real.host_id })
              : nav("report")
          }
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 6,
            width: "100%",
            marginTop: 14,
            border: "none",
            background: "none",
            color: colors.textMutedAlt,
            fontFamily: "inherit",
            fontSize: 12,
            padding: 8,
            cursor: "pointer",
          }}
        >
          <FlagIcon size={14} color={colors.textMutedAlt} />
          この募集を通報する
        </button>
      </div>
    </div>
  );
}
