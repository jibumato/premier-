"use client";

import { useEffect } from "react";
import { colors } from "@/lib/tokens";
import { notifications as mockNotifications } from "@/lib/data";
import { useRouter } from "../AppRouter";
import { ImageSlot } from "../ImageSlot";
import { ChevronLeftIcon } from "../icons";
import { useAuth } from "@/lib/auth/useAuth";
import { useMarkNotificationsRead, useNotifications } from "@/lib/queries/notifications";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { EmptyState } from "../EmptyState";

export function NotifyScreen() {
  const { back } = useRouter();
  const { user } = useAuth();
  const configured = isSupabaseConfigured();
  const notifsQuery = useNotifications(user?.id);
  const markRead = useMarkNotificationsRead();
  // Real notifications once connected and loaded; the handoff's mock list
  // otherwise — same Notification shape either way.
  const notifications = configured && notifsQuery.data ? notifsQuery.data : mockNotifications;
  const isEmpty = configured && notifsQuery.data?.length === 0;

  // Opening this screen clears the unread state (bell badge), same as reading a DM thread.
  useEffect(() => {
    if (configured && user) markRead.mutate(user.id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [configured, user?.id]);

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
      {isEmpty && (
        <EmptyState
          icon="🔔"
          title="新しいおしらせはありません"
          body="応募・メッセージ・フォローなどがあると、ここに通知が届きます。"
        />
      )}
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
