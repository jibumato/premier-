"use client";

import { colors } from "@/lib/tokens";
import { events as mockEvents } from "@/lib/data";
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

      <div style={{ padding: "10px 22px 30px" }} className="pt-grid">
        {loading && (
          <div style={{ padding: "60px 22px", textAlign: "center", fontSize: 13, color: colors.textMutedAlt }}>読み込み中…</div>
        )}
        {events.map((ev) => (
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
