"use client";

import { colors } from "@/lib/tokens";
import { notifications } from "@/lib/data";
import { useRouter } from "../AppRouter";
import { ImageSlot } from "../ImageSlot";
import { ChevronLeftIcon } from "../icons";

export function NotifyScreen() {
  const { back } = useRouter();

  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 18px 12px" }}>
        <button
          onClick={back}
          style={{ background: "none", border: "none", cursor: "pointer", padding: 0 }}
          aria-label="戻る"
        >
          <ChevronLeftIcon size={24} />
        </button>
        <div style={{ fontSize: 16, fontWeight: 700, color: colors.textPrimary }}>おしらせ</div>
      </div>
      <div style={{ display: "flex", flexDirection: "column" }}>
        {notifications.map((n) => (
          <div
            key={n.key}
            style={{
              display: "flex",
              gap: 12,
              padding: "15px 22px",
              borderBottom: "1px solid #F1EFF6",
              background: n.unread ? colors.primaryBg5 : colors.white,
            }}
          >
            <div
              style={{
                flex: "0 0 40px",
                height: 40,
                borderRadius: "50%",
                overflow: "hidden",
                background: colors.primaryBg1,
              }}
            >
              <ImageSlot circle />
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 12.5, color: "#3A3548", lineHeight: 1.6 }}>{n.text}</div>
              <div style={{ fontSize: 10.5, color: colors.textMutedSoft, marginTop: 4 }}>{n.time}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
