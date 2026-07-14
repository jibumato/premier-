"use client";

import { useEffect, useState } from "react";
import { colors } from "@/lib/tokens";
import { chatThread } from "@/lib/data";
import { useRouter } from "../AppRouter";
import { ImageSlot } from "../ImageSlot";
import { ChevronLeftIcon, SendIcon, StarIcon } from "../icons";
import { useAuth } from "@/lib/auth/useAuth";
import { useMessages, useSendMessage, useMarkConversationRead, useOtherReadAt } from "@/lib/queries/messages";
import { useConversationInfo } from "@/lib/queries/reviews";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { formatRelativeTime } from "@/lib/format";
import type { ChatMessage } from "@/lib/types";

export function ChatScreen() {
  const { back, nav, selectedConversationId } = useRouter();
  const { user } = useAuth();
  const configured = isSupabaseConfigured();

  const realMessages = useMessages(selectedConversationId);
  const convInfo = useConversationInfo(selectedConversationId, user?.id);
  const sendMessage = useSendMessage();
  const { mutate: markConversationRead } = useMarkConversationRead();
  const otherReadAt = useOtherReadAt(selectedConversationId, user?.id);

  // 会話を開いた時点、および開いている間に新着が届いた時点で既読にする。
  // これでメッセージ一覧の未読バッジが消える（従来は呼ばれておらず残っていた）。
  useEffect(() => {
    if (configured && selectedConversationId && user?.id) {
      markConversationRead({ conversationId: selectedConversationId, userId: user.id });
    }
  }, [configured, selectedConversationId, user?.id, realMessages.data, markConversationRead]);

  const [mockMessages, setMockMessages] = useState<ChatMessage[]>(chatThread);
  const [draft, setDraft] = useState("");

  const real = configured && selectedConversationId ? realMessages.data : undefined;
  const realInfo = configured && selectedConversationId ? convInfo.data : undefined;
  const loading = configured && Boolean(selectedConversationId) && realMessages.isPending && !realMessages.data;
  const partnerName = realInfo?.otherName ?? "かな";
  const partnerContext = realInfo?.awaseTitle ?? "魔法学園 生徒会併せ";
  const messages: ChatMessage[] = real
    ? real.map((m) => ({
        key: m.id,
        from: m.sender_id === user?.id ? "me" : "them",
        text: m.body,
        time: formatRelativeTime(m.created_at),
      }))
    : configured && selectedConversationId
      ? []
      : mockMessages;

  // 「既読」表示: 相手の last_read_at 以前に送った自分のメッセージ「すべて」に付ける。
  const otherReadMs = otherReadAt.data ? new Date(otherReadAt.data).getTime() : 0;
  const readMineKeys = new Set<string>();
  if (real && otherReadMs) {
    for (const m of real) {
      if (m.sender_id === user?.id && new Date(m.created_at).getTime() <= otherReadMs) {
        readMineKeys.add(m.id);
      }
    }
  }

  const send = () => {
    const text = draft.trim();
    if (!text) return;
    if (real && user && selectedConversationId) {
      sendMessage.mutate({ conversationId: selectedConversationId, senderId: user.id, body: text });
    } else {
      setMockMessages((m) => [...m, { key: `me-${m.length}`, from: "me", text, time: "今" }]);
    }
    setDraft("");
  };

  if (loading) {
    return (
      <div style={{ display: "flex", flexDirection: "column", minHeight: "100%" }}>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 10,
            padding: "10px 16px 10px",
            borderBottom: `1px solid ${colors.borderSofter}`,
          }}
        >
          <button
            onClick={back}
            style={{ background: "none", border: "none", cursor: "pointer", padding: 0 }}
            aria-label="戻る"
          >
            <ChevronLeftIcon size={24} />
          </button>
        </div>
        <div style={{ padding: "60px 22px", textAlign: "center", fontSize: 13, color: colors.textMutedAlt }}>読み込み中…</div>
      </div>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", minHeight: "100%" }}>
      {/* app bar with partner identity */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 10,
          padding: "10px 16px 10px",
          borderBottom: `1px solid ${colors.borderSofter}`,
          position: "sticky",
          top: 0,
          background: colors.white,
          zIndex: 2,
        }}
      >
        <button
          onClick={back}
          style={{ background: "none", border: "none", cursor: "pointer", padding: 0 }}
          aria-label="戻る"
        >
          <ChevronLeftIcon size={24} />
        </button>
        <div style={{ width: 34, height: 34, borderRadius: "50%", overflow: "hidden", flex: "0 0 auto" }}>
          <ImageSlot circle />
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 14, fontWeight: 700, color: colors.textPrimary }}>{partnerName}</div>
          <div style={{ fontSize: 10.5, color: colors.textMutedAlt }}>{partnerContext}</div>
        </div>
        <button
          onClick={() => nav("reviewWrite")}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 4,
            border: `1px solid ${colors.border}`,
            background: colors.white,
            borderRadius: 999,
            padding: "6px 11px",
            fontSize: 11,
            fontWeight: 600,
            color: colors.primary,
            cursor: "pointer",
            fontFamily: "inherit",
            whiteSpace: "nowrap",
          }}
        >
          <StarIcon size={12} color={colors.starGold} filled />
          レビュー
        </button>
      </div>

      {/* messages */}
      <div style={{ flex: 1, padding: "16px 16px 12px", display: "flex", flexDirection: "column", gap: 10 }}>
        <div style={{ textAlign: "center", fontSize: 10.5, color: colors.textMutedSoft, margin: "2px 0 6px" }}>
          7/20
        </div>
        {messages.map((m) => {
          const mine = m.from === "me";
          return (
            <div
              key={m.key}
              style={{
                display: "flex",
                justifyContent: mine ? "flex-end" : "flex-start",
                alignItems: "flex-end",
                gap: 6,
              }}
            >
              <div
                style={{
                  maxWidth: "74%",
                  fontSize: 13,
                  lineHeight: 1.6,
                  padding: "10px 13px",
                  borderRadius: 16,
                  borderBottomRightRadius: mine ? 4 : 16,
                  borderBottomLeftRadius: mine ? 16 : 4,
                  background: mine ? colors.primary : colors.primaryBg2,
                  color: mine ? colors.white : colors.textPrimary,
                }}
              >
                {m.text}
              </div>
              <span
                style={{
                  fontSize: 9.5,
                  color: colors.textMutedSoft,
                  marginBottom: 2,
                  whiteSpace: "nowrap",
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "flex-end",
                  gap: 1,
                }}
              >
                {mine && readMineKeys.has(m.key) && (
                  <span style={{ color: colors.primary, fontWeight: 700 }}>既読</span>
                )}
                {m.time}
              </span>
            </div>
          );
        })}
      </div>

      {/* composer */}
      <div
        style={{
          position: "sticky",
          bottom: 0,
          display: "flex",
          alignItems: "center",
          gap: 9,
          padding: "10px 14px 14px",
          background: colors.white,
          borderTop: `1px solid ${colors.borderSofter}`,
        }}
      >
        <input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            // IME変換確定のEnterでは送信しない（日本語入力の変換候補確定と送信を区別）。
            if (e.key === "Enter" && !e.nativeEvent.isComposing && e.keyCode !== 229) send();
          }}
          placeholder="メッセージを入力"
          style={{
            flex: 1,
            border: `1px solid ${colors.border}`,
            borderRadius: 999,
            padding: "11px 15px",
            fontSize: 13,
            fontFamily: "inherit",
            background: colors.primaryBg4,
            color: colors.textPrimary,
            outline: "none",
          }}
        />
        <button
          onClick={send}
          aria-label="送信"
          style={{
            width: 40,
            height: 40,
            borderRadius: "50%",
            border: "none",
            background: `linear-gradient(135deg, ${colors.primary}, ${colors.primaryGradientLight})`,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            cursor: "pointer",
            flex: "0 0 auto",
          }}
        >
          <SendIcon size={18} />
        </button>
      </div>
    </div>
  );
}
