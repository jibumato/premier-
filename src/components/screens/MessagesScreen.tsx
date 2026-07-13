"use client";

import { colors } from "@/lib/tokens";
import { conversations as mockConversations } from "@/lib/data";
import { useRouter } from "../AppRouter";
import { ImageSlot } from "../ImageSlot";
import { AppBar } from "../ui";
import { useAuth } from "@/lib/auth/useAuth";
import { useConversations } from "@/lib/queries/messages";
import { useModerationFilter } from "@/lib/queries/moderation";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { EmptyState } from "../EmptyState";

export function MessagesScreen() {
  const { back, nav, openChat } = useRouter();
  const { user } = useAuth();
  const configured = isSupabaseConfigured();
  const moderation = useModerationFilter(user?.id);
  const convosQuery = useConversations(user?.id, moderation.data?.blockedUserIds);
  // Real conversations once connected and loaded; the handoff's mock list
  // otherwise — same Conversation shape either way.
  const conversations = configured ? (convosQuery.data ?? []) : mockConversations;
  const loading = configured && convosQuery.isPending && !convosQuery.data;
  const isEmpty = configured && convosQuery.data?.length === 0;

  return (
    <div>
      <AppBar title="メッセージ" onBack={back} />
      {loading && (
        <div style={{ padding: "60px 22px", textAlign: "center", fontSize: 13, color: colors.textMutedAlt }}>読み込み中…</div>
      )}
      {isEmpty && (
        <EmptyState
          icon="💬"
          title="メッセージはまだありません"
          body="併せに応募したり、募集の主催者に連絡すると、ここにやり取りが表示されます。"
          action={
            <button
              onClick={() => nav("search", "search")}
              style={{
                border: "none",
                background: colors.primary,
                color: colors.white,
                fontFamily: "inherit",
                fontSize: 13,
                fontWeight: 700,
                padding: "10px 20px",
                borderRadius: 999,
                cursor: "pointer",
              }}
            >
              併せを探す
            </button>
          }
        />
      )}
      <div style={{ display: "flex", flexDirection: "column" }}>
        {conversations.map((c) => (
          <button
            key={c.key}
            onClick={() => (configured && convosQuery.data ? openChat(c.key) : nav("chat"))}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 12,
              padding: "14px 22px",
              borderBottom: "1px solid #F1EFF6",
              background: c.unread > 0 ? colors.primaryBg5 : colors.white,
              border: "none",
              borderBottomWidth: 1,
              borderBottomStyle: "solid",
              borderBottomColor: "#F1EFF6",
              cursor: "pointer",
              fontFamily: "inherit",
              textAlign: "left",
              width: "100%",
            }}
          >
            <div
              style={{
                flex: "0 0 46px",
                height: 46,
                borderRadius: "50%",
                overflow: "hidden",
                background: colors.primaryBg1,
              }}
            >
              <ImageSlot circle />
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: 8 }}>
                <span style={{ fontSize: 13.5, fontWeight: 700, color: colors.textPrimary }}>{c.name}</span>
                <span style={{ fontSize: 10.5, color: colors.textMutedSoft, whiteSpace: "nowrap" }}>{c.time}</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8, marginTop: 4 }}>
                <span
                  style={{
                    fontSize: 12,
                    color: c.unread > 0 ? colors.textSecondary : colors.textMutedAlt,
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                    fontWeight: c.unread > 0 ? 500 : 400,
                  }}
                >
                  {c.last}
                </span>
                {c.unread > 0 && (
                  <span
                    style={{
                      flex: "0 0 auto",
                      minWidth: 18,
                      height: 18,
                      borderRadius: 999,
                      background: colors.pink,
                      color: colors.white,
                      fontSize: 10,
                      fontWeight: 700,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      padding: "0 5px",
                    }}
                  >
                    {c.unread}
                  </span>
                )}
              </div>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
