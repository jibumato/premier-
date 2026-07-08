"use client";

import { useState } from "react";
import { colors } from "@/lib/tokens";
import { chatThread } from "@/lib/data";
import { useRouter } from "../AppRouter";
import { ImageSlot } from "../ImageSlot";
import { ChevronLeftIcon, SendIcon, StarIcon } from "../icons";
import { useAuth } from "@/lib/auth/useAuth";
import { useMessages, useSendMessage } from "@/lib/queries/messages";
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

  const [mockMessages, setMockMessages] = useState<ChatMessage[]>(chatThread);
  const [draft, setDraft] = useState("");

  const real = configured && selectedConversationId ? realMessages.data : undefined;
  const realInfo = configured && selectedConversationId ? convInfo.data : undefined;
  const partnerName = realInfo?.otherName ?? "かな";
  const partnerContext = realInfo?.awaseTitle ?? "魔法学園 生徒会併せ";
  const messages: ChatMessage[] = real
    ? real.map((m) => ({
        key: m.id,
        from: m.sender_id === user?.id ? "me" : "them",
        text: m.body,
        time: formatRelativeTime(m.created_at),
      }))
    : mockMessages;

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
              <span style={{ fontSize: 9.5, color: colors.textMutedSoft, marginBottom: 2, whiteSpace: "nowrap" }}>
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
            if (e.key === "Enter") send();
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
