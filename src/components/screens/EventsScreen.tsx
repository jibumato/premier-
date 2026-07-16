"use client";

import { useState } from "react";
import { colors } from "@/lib/tokens";
import { AREA_ORDER, areaOf, events as mockEvents } from "@/lib/data";
import { useRouter } from "../AppRouter";
import { AppBar } from "../ui";
import { CalendarIcon, PinIcon } from "../icons";
import { ImageSlot } from "../ImageSlot";
import { WorkCover } from "../WorkCover";
import { useEvents } from "@/lib/queries/events";
import { isSupabaseConfigured } from "@/lib/supabase/config";

export function EventsScreen() {
  const { back, nav, openEvent } = useRouter();
  const configured = isSupabaseConfigured();

  const eventsQuery = useEvents();
  const real = configured ? eventsQuery.data : undefined;
  const events = configured ? (eventsQuery.data ?? []) : mockEvents;
  const loading = configured && eventsQuery.isPending && !eventsQuery.data;

  const [area, setArea] = useState("すべて");

  // 実際にイベントが存在するエリアだけを、既定の並び順でチップに出す
  // （該当のないエリアは表示しない）。先頭は常に「すべて」。軽い計算なので毎回算出。
  const presentAreas = new Set(events.map((ev) => areaOf(ev.region)));
  const areaChips = ["すべて", ...AREA_ORDER.filter((a) => presentAreas.has(a))];

  const shownEvents = area === "すべて" ? events : events.filter((ev) => areaOf(ev.region) === area);

  const handleOpen = (key: string) => {
    if (real) {
      openEvent(key);
    } else {
      nav("eventDetail");
    }
  };

  return (
    <div>
      <AppBar title="イベントカレンダー" onBack={back} />

      {/* エリア絞り込みチップ（該当イベントのあるエリアのみ・単一選択） */}
      {areaChips.length > 2 && (
        <div className="noscroll" style={{ display: "flex", gap: 8, overflowX: "auto", padding: "12px 18px 2px" }}>
          {areaChips.map((a) => {
            const active = a === area;
            return (
              <button
                key={a}
                onClick={() => setArea(a)}
                style={{
                  fontSize: 12,
                  color: active ? colors.white : "#4A4458",
                  background: active ? colors.primary : colors.white,
                  border: `1px solid ${active ? colors.primary : colors.border}`,
                  padding: "8px 13px",
                  borderRadius: 999,
                  whiteSpace: "nowrap",
                  fontWeight: active ? 600 : 400,
                  cursor: "pointer",
                  fontFamily: "inherit",
                }}
              >
                {a}
              </button>
            );
          })}
        </div>
      )}

      <div style={{ padding: "10px 22px 30px" }} className="pt-grid">
        {loading && (
          <div style={{ padding: "60px 22px", textAlign: "center", fontSize: 13, color: colors.textMutedAlt }}>読み込み中…</div>
        )}
        {!loading && shownEvents.length === 0 && (
          <div style={{ padding: "48px 22px", textAlign: "center", fontSize: 12.5, color: colors.textMutedAlt, lineHeight: 1.8 }}>
            このエリアのイベントはまだありません。
          </div>
        )}
        {shownEvents.map((ev) => (
          <button
            key={ev.key}
            onClick={() => handleOpen(ev.key)}
            style={{
              display: "flex",
              gap: 14,
              alignItems: "center",
              border: `1px solid ${colors.borderSoft}`,
              borderRadius: 16,
              padding: 14,
              background: colors.white,
              cursor: "pointer",
              fontFamily: "inherit",
              textAlign: "left",
              width: "100%",
            }}
          >
            {/* thumbnail — 許諾済みの画像 or イベント名から生成したデザイン */}
            <div style={{ flex: "0 0 64px", width: 64, height: 64, borderRadius: 14, overflow: "hidden" }}>
              {ev.imageUrl ? (
                <ImageSlot radius={14} src={ev.imageUrl} />
              ) : (
                <WorkCover name={ev.name} radius={14} showName={false} />
              )}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <span style={{ fontSize: 14, fontWeight: 700, color: colors.textPrimary }}>{ev.name}</span>
                <span
                  style={{
                    fontSize: 9.5,
                    color: colors.pinkText,
                    background: colors.pinkBg1,
                    padding: "2px 7px",
                    borderRadius: 999,
                    whiteSpace: "nowrap",
                  }}
                >
                  {ev.tag}
                </span>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 4, marginTop: 6, fontSize: 11, color: "#877FA0" }}>
                <CalendarIcon size={12} />
                {ev.date}
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 4, marginTop: 4, fontSize: 11, color: "#877FA0" }}>
                <PinIcon />
                {ev.venue}
              </div>
              <div style={{ fontSize: 11, color: colors.primary, fontWeight: 600, marginTop: 6 }}>
                {ev.going.toLocaleString()}人が参加予定
              </div>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
