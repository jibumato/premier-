"use client";

import { useState } from "react";
import { colors } from "@/lib/tokens";
import { useRouter } from "../AppRouter";
import { ImageSlot } from "../ImageSlot";
import { WorkCover } from "../WorkCover";
import { AppBar, PrimaryButton, SectionHeading } from "../ui";
import { CheckIcon } from "../icons";
import { useAuth } from "@/lib/auth/useAuth";
import { useEvent, useIsGoing, useRsvpEvent, useEventAttendees } from "@/lib/queries/events";
import { useModerationFilter } from "@/lib/queries/moderation";
import { isSupabaseConfigured } from "@/lib/supabase/config";

const mockInfo = [
  { label: "日程", value: "8/17(日) 10:00〜16:00" },
  { label: "会場", value: "東京ビッグサイト" },
  { label: "エリア", value: "東京" },
  { label: "参加費", value: "前売 ¥2,000" },
];

export function EventDetailScreen() {
  const { back, nav, openProfile, selectedEventId } = useRouter();
  const { user } = useAuth();
  const configured = isSupabaseConfigured();

  const eventQuery = useEvent(selectedEventId);
  const isGoingQuery = useIsGoing(selectedEventId, user?.id);
  const rsvp = useRsvpEvent();
  const [mockGoing, setMockGoing] = useState(false);
  // 参加予定の顔ぶれ（ログイン中のみ・非公開/ブロック/停止は除外）。人数は公開。
  const moderation = useModerationFilter(user?.id);
  const attendeesQuery = useEventAttendees(selectedEventId, user?.id, moderation.data?.blockedUserIds ?? []);
  const attendees = attendeesQuery.data ?? [];

  const real = configured && selectedEventId ? eventQuery.data : undefined;
  const loading = configured && Boolean(selectedEventId) && eventQuery.isPending && !eventQuery.data;
  const going = real ? Boolean(isGoingQuery.data) : mockGoing;

  const name = real?.name ?? "ホロサマ 2025";
  const goingCount = real ? real.going.toLocaleString() : "1,240";
  const info = real
    ? [
        { label: "日程", value: real.date },
        { label: "会場", value: real.venue },
        { label: "エリア", value: real.region },
        { label: "参加費", value: real.feeText ?? "無料" },
      ]
    : mockInfo;
  const bodyText =
    real?.body ||
    "コスプレ参加可のイベントです。当日の併せ集合や日程調整はプルミエ！のメッセージ・日程調整機能が使えます。参加表明をすると、あなたが参加予定であることが人数に反映されます。";

  const handleRsvp = () => {
    if (configured && !user) {
      // 接続済みだが未ログイン → 参加表明には登録が必要
      nav("login");
      return;
    }
    if (real && user && selectedEventId) {
      rsvp.mutate({ eventId: selectedEventId, userId: user.id });
    } else {
      setMockGoing(true);
    }
  };

  if (loading) {
    return (
      <div>
        <AppBar title="イベントの詳細" onBack={back} />
        <div style={{ padding: "60px 22px", textAlign: "center", fontSize: 13, color: colors.textMutedAlt }}>読み込み中…</div>
      </div>
    );
  }

  return (
    <div>
      <AppBar title="イベントの詳細" onBack={back} />

      <div style={{ padding: "6px 22px 0", position: "relative" }}>
        <div style={{ height: 180 }}>
          {/* 許諾を得た公式画像があればそれを、無ければイベント名から生成した
              デザイン（権利リスクなし）を表示する */}
          {real?.imageUrl ? (
            <ImageSlot radius={18} src={real.imageUrl} />
          ) : (
            <WorkCover name={name} radius={18} showName={false} />
          )}
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
          大型イベント
        </span>
      </div>

      <div style={{ padding: "18px 22px 0" }}>
        <h2 style={{ margin: 0, fontSize: 21, fontWeight: 700, color: colors.textPrimary }}>{name}</h2>
        <div style={{ fontSize: 12.5, color: colors.primary, fontWeight: 600, marginTop: 8 }}>
          {goingCount}人が参加予定
        </div>
      </div>

      <div style={{ padding: "18px 22px 0" }}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
          {info.map((it) => (
            <div key={it.label} style={{ border: `1px solid ${colors.borderSoft}`, borderRadius: 14, padding: "13px 14px" }}>
              <div style={{ fontSize: 10.5, color: colors.textMutedAlt }}>{it.label}</div>
              <div style={{ fontSize: 13, fontWeight: 700, color: colors.textPrimary, marginTop: 5 }}>{it.value}</div>
            </div>
          ))}
        </div>
      </div>

      <div style={{ padding: "24px 22px 0" }}>
        <SectionHeading size={15}>イベント概要</SectionHeading>
        <p style={{ margin: "12px 0 0", fontSize: 13, lineHeight: 1.9, color: colors.textSecondary }}>
          {bodyText}
        </p>
      </div>

      {/* 参加予定のユーザー — 人数は上部で公開。顔ぶれ（名前・アイコン）は
          ログイン中のユーザーにだけ表示し、非公開アカウント・ブロック相手・停止中は
          除外する（つきまとい対策。人物検索と同じ方針）。 */}
      <div style={{ padding: "24px 22px 0" }}>
        <SectionHeading size={15}>参加予定のユーザー</SectionHeading>
        {!configured ? (
          <div style={{ display: "flex", gap: 10, marginTop: 13 }}>
            {[0, 1, 2, 3, 4].map((i) => (
              <div key={i} style={{ width: 46, height: 46, borderRadius: "50%", overflow: "hidden", flex: "0 0 auto" }}>
                <ImageSlot circle />
              </div>
            ))}
          </div>
        ) : !user ? (
          <div
            style={{
              marginTop: 12,
              border: `1px dashed ${colors.border}`,
              borderRadius: 14,
              padding: "16px 14px",
              background: colors.primaryBg5,
              textAlign: "center",
            }}
          >
            <p style={{ margin: 0, fontSize: 12.5, color: colors.textSecondary, lineHeight: 1.8 }}>
              参加予定の顔ぶれは、ログインすると見られます。
              <br />
              <span style={{ fontSize: 11, color: colors.textMutedSoft }}>
                ※ 非公開アカウントの人は表示されません。
              </span>
            </p>
            <button
              onClick={() => nav("login")}
              style={{
                marginTop: 12,
                border: "none",
                background: colors.primary,
                color: colors.white,
                fontFamily: "inherit",
                fontSize: 12.5,
                fontWeight: 700,
                padding: "10px 22px",
                borderRadius: 12,
                cursor: "pointer",
              }}
            >
              ログイン / 登録
            </button>
          </div>
        ) : attendees.length === 0 ? (
          <p style={{ margin: "12px 0 0", fontSize: 12.5, color: colors.textMutedAlt, lineHeight: 1.8 }}>
            まだ参加表明した人がいません。いちばん乗りで参加表明してみましょう。
          </p>
        ) : (
          <div className="noscroll" style={{ display: "flex", gap: 14, overflowX: "auto", padding: "13px 2px 2px" }}>
            {attendees.map((p) => (
              <button
                key={p.id}
                onClick={() => openProfile(p.id)}
                style={{
                  flex: "0 0 auto",
                  width: 58,
                  border: "none",
                  background: "none",
                  padding: 0,
                  cursor: "pointer",
                  fontFamily: "inherit",
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  gap: 5,
                }}
              >
                <div style={{ position: "relative", width: 46, height: 46 }}>
                  <div style={{ width: 46, height: 46, borderRadius: "50%", overflow: "hidden" }}>
                    <ImageSlot circle src={p.avatarUrl ?? undefined} />
                  </div>
                  {p.isVerified && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src="/verified-badge.png"
                      alt="本人確認済"
                      width={15}
                      height={15}
                      style={{ position: "absolute", right: -2, bottom: -2, display: "block" }}
                    />
                  )}
                </div>
                <span
                  style={{
                    fontSize: 10.5,
                    color: colors.textSecondary,
                    maxWidth: 58,
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                    textAlign: "center",
                  }}
                >
                  {p.displayName}
                </span>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* going state */}
      <div style={{ padding: "24px 22px 30px" }}>
        {going ? (
          <div
            style={{
              border: `1px solid ${colors.borderSoft}`,
              borderRadius: 16,
              padding: "18px 16px",
              background: colors.primaryBg5,
              textAlign: "center",
            }}
          >
            <div
              style={{
                width: 52,
                height: 52,
                margin: "0 auto",
                borderRadius: "50%",
                background: "linear-gradient(155deg,#F2EDFB,#F7EEF6)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <CheckIcon size={26} />
            </div>
            <div style={{ fontSize: 14, fontWeight: 700, color: colors.textPrimary, marginTop: 12 }}>
              参加表明しました！
            </div>
            <p style={{ margin: "6px 0 14px", fontSize: 12, color: colors.textMutedAlt, lineHeight: 1.8 }}>
              このイベントの併せ募集をホームでチェックしましょう。
            </p>
            <PrimaryButton onClick={() => nav("search", "search")} style={{ fontSize: 13, padding: 13 }}>
              このイベントの併せを探す
            </PrimaryButton>
          </div>
        ) : (
          <PrimaryButton onClick={handleRsvp}>参加表明する</PrimaryButton>
        )}
      </div>
    </div>
  );
}
