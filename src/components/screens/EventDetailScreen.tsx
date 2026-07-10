"use client";

import { useState } from "react";
import { colors } from "@/lib/tokens";
import { useRouter } from "../AppRouter";
import { ImageSlot } from "../ImageSlot";
import { AppBar, PrimaryButton, SectionHeading } from "../ui";
import { CheckIcon } from "../icons";
import { useAuth } from "@/lib/auth/useAuth";
import { useEvent, useIsGoing, useRsvpEvent } from "@/lib/queries/events";
import { isSupabaseConfigured } from "@/lib/supabase/config";

const mockInfo = [
  { label: "日程", value: "8/17(日) 10:00〜16:00" },
  { label: "会場", value: "東京ビッグサイト" },
  { label: "エリア", value: "東京" },
  { label: "参加費", value: "前売 ¥2,000" },
];

export function EventDetailScreen() {
  const { back, nav, selectedEventId } = useRouter();
  const { user } = useAuth();
  const configured = isSupabaseConfigured();

  const eventQuery = useEvent(selectedEventId);
  const isGoingQuery = useIsGoing(selectedEventId, user?.id);
  const rsvp = useRsvpEvent();
  const [mockGoing, setMockGoing] = useState(false);

  const real = configured && selectedEventId ? eventQuery.data : undefined;
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
    "夏の大型コスプレイベント。屋内・屋外の撮影エリアあり、更衣室・荷物預かり完備。当日は会場での併せ集合もこのアプリで調整できます。参加表明をすると、同じイベントの併せ募集がホームに優先表示されます。";

  const handleRsvp = () => {
    if (real && user && selectedEventId) {
      rsvp.mutate({ eventId: selectedEventId, userId: user.id });
    } else {
      setMockGoing(true);
    }
  };

  return (
    <div>
      <AppBar title="イベントの詳細" onBack={back} />

      <div style={{ padding: "6px 22px 0", position: "relative" }}>
        <div style={{ height: 180 }}>
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
