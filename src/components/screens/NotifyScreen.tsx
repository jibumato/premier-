"use client";

import { useEffect } from "react";
import { colors } from "@/lib/tokens";
import { notifications as mockNotifications } from "@/lib/data";
import { useRouter } from "../AppRouter";
import { ImageSlot } from "../ImageSlot";
import { ChevronLeftIcon, ChevronRightIcon } from "../icons";
import { useAuth } from "@/lib/auth/useAuth";
import { useMarkNotificationsRead, useNotifications } from "@/lib/queries/notifications";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { EmptyState } from "../EmptyState";
import { Omikuji } from "../Omikuji";

export function NotifyScreen() {
  const { back, nav, openAwase, openProfile } = useRouter();
  const { user } = useAuth();
  const configured = isSupabaseConfigured();
  const notifsQuery = useNotifications(user?.id);
  const markRead = useMarkNotificationsRead();
  // Real notifications once connected and loaded; the handoff's mock list
  // otherwise — same Notification shape either way.
  const notifications = configured ? (notifsQuery.data ?? []) : mockNotifications;
  const loading = configured && notifsQuery.isPending && !notifsQuery.data;
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
      {loading && (
        <div style={{ padding: "60px 22px", textAlign: "center", fontSize: 13, color: colors.textMutedAlt }}>読み込み中…</div>
      )}
      {isEmpty && (
        <EmptyState
          icon="🔔"
          title="新しいおしらせはありません"
          body="応募・メッセージ・フォローなどがあると、ここに通知が届きます。"
        />
      )}
      <div style={{ display: "flex", flexDirection: "column" }}>
        {notifications.map((n) => {
          // 通知の種別に応じた遷移先。応募関連は該当の併せ詳細へ
          // （主催者はそこから「応募者を見る」で承認画面に進める）。
          // 本人確認の承認/却下（badge）はマイページでバッジ・結果を確認できるように。
          const goTo =
            n.kind === "application" && n.entityId
              ? () => openAwase(n.entityId!)
              : n.kind === "badge"
                ? () => nav("profile", "mypage")
                : n.kind === "follow" && n.entityId
                  ? () => openProfile(n.entityId!)
                  : null;
          const inner = (
            <>
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
              {goTo && (
                <div style={{ flex: "0 0 auto", alignSelf: "center" }}>
                  <ChevronRightIcon />
                </div>
              )}
            </>
          );
          const rowStyle: React.CSSProperties = {
            display: "flex",
            gap: 12,
            padding: "15px 22px",
            borderBottom: "1px solid #F1EFF6",
            background: n.unread ? colors.primaryBg5 : colors.white,
            width: "100%",
            textAlign: "left",
            fontFamily: "inherit",
            alignItems: "flex-start",
          };
          return goTo ? (
            <button key={n.key} onClick={goTo} style={{ ...rowStyle, border: "none", cursor: "pointer" }}>
              {inner}
            </button>
          ) : (
            <div key={n.key} style={rowStyle}>
              {inner}
            </div>
          );
        })}
      </div>

      {/* 遊び心: 通知一覧の一番下にひっそり置いた併せ運おみくじ（1日1回） */}
      <Omikuji />
      <div style={{ height: 22 }} />
    </div>
  );
}
