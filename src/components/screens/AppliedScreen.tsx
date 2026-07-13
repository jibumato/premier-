"use client";

import { colors } from "@/lib/tokens";
import { useRouter } from "../AppRouter";
import { PrimaryButton } from "../ui";
import { CheckIcon } from "../icons";
import { useAuth } from "@/lib/auth/useAuth";
import { useAwase } from "@/lib/queries/awase";
import { useGetOrCreateConversation } from "@/lib/queries/messages";
import { isSupabaseConfigured } from "@/lib/supabase/config";

export function AppliedScreen() {
  const { back, nav, openChat, selectedAwaseId } = useRouter();
  const { user } = useAuth();
  const configured = isSupabaseConfigured();

  const awaseQuery = useAwase(selectedAwaseId);
  const getOrCreateConversation = useGetOrCreateConversation();

  const real = configured && selectedAwaseId ? awaseQuery.data : undefined;
  const loading = configured && Boolean(selectedAwaseId) && awaseQuery.isPending && !awaseQuery.data;
  const hostName = real?.profiles?.display_name ?? "澪";

  const handleMessage = async () => {
    if (real && user) {
      const conversationId = await getOrCreateConversation.mutateAsync({
        userId: user.id,
        otherUserId: real.host_id,
        awaseId: real.id,
      });
      openChat(conversationId);
      return;
    }
    nav("chat");
  };

  if (loading) {
    return (
      <div style={{ padding: "70px 30px 0", textAlign: "center", fontSize: 13, color: colors.textMutedAlt }}>読み込み中…</div>
    );
  }

  return (
    <div style={{ padding: "70px 30px 0", textAlign: "center" }}>
      <div
        style={{
          width: 96,
          height: 96,
          margin: "0 auto",
          borderRadius: "50%",
          background: "linear-gradient(155deg,#F2EDFB,#F7EEF6)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <CheckIcon />
      </div>
      <h2 style={{ margin: "26px 0 0", fontSize: 23, lineHeight: 1.5, fontWeight: 700, color: colors.textPrimary }}>
        応募しました！
      </h2>
      <p style={{ margin: "14px 0 0", fontSize: 13, color: colors.textMuted, lineHeight: 1.9 }}>
        主催の{hostName}さんに応募が届きました。
        <br />
        メッセージで日程や持ち物をすり合わせましょう。
      </p>
      <PrimaryButton onClick={handleMessage} style={{ marginTop: 30 }}>
        主催者にメッセージを送る
      </PrimaryButton>
      <button
        onClick={() => nav("home", "home")}
        style={{
          width: "100%",
          marginTop: 11,
          border: `1px solid ${colors.border}`,
          background: colors.white,
          color: colors.primary,
          fontFamily: "inherit",
          fontSize: 14,
          fontWeight: 600,
          padding: 14,
          borderRadius: 14,
          cursor: "pointer",
        }}
      >
        ホームに戻る
      </button>
      <button
        onClick={back}
        style={{
          width: "100%",
          marginTop: 11,
          border: "none",
          background: "none",
          color: colors.textMutedAlt,
          fontFamily: "inherit",
          fontSize: 13,
          fontWeight: 500,
          padding: 6,
          cursor: "pointer",
        }}
      >
        募集の詳細に戻る
      </button>
    </div>
  );
}
