"use client";

import { useState } from "react";
import { colors } from "@/lib/tokens";
import { useRouter } from "../AppRouter";
import { AppBar } from "../ui";
import { EmptyState } from "../EmptyState";
import { useAuth } from "@/lib/auth/useAuth";
import { useProfile } from "@/lib/queries/profile";
import {
  useAdminSearchProfiles,
  useAdminUserConversations,
  useAdminUserReports,
  useReinstateUser,
  useSuspendUser,
  useViewConversationMessages,
  type AdminConversation,
  type AdminMessage,
  type AdminProfileResult,
} from "@/lib/queries/moderation";
import { isSupabaseConfigured } from "@/lib/supabase/config";

/**
 * 運営専用: 違反アカウントへの対応（検索・通報確認・停止/解除）。
 * 停止中はログインしてもアプリの中身に入れず、専用画面のみ表示される
 * （AuthGate 参照）。書き込みは RLS ではなく SECURITY DEFINER 関数
 * （is_admin() 限定）経由（0049）。
 */
export function AdminUsersScreen() {
  const { back } = useRouter();
  const { user } = useAuth();
  const configured = isSupabaseConfigured();
  const profile = useProfile(user?.id);
  const isAdmin = Boolean(configured && profile.data?.is_admin);

  const [query, setQuery] = useState("");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const searchQuery = useAdminSearchProfiles(query, isAdmin);

  if (configured && profile.data && !isAdmin) {
    return (
      <div>
        <AppBar title="アカウント対応" onBack={back} />
        <EmptyState icon="🔒" title="権限がありません" body="この画面は運営アカウントのみ利用できます。" />
      </div>
    );
  }

  const results = searchQuery.data ?? [];

  return (
    <div>
      <AppBar title="アカウント対応" onBack={back} />

      <div style={{ padding: "10px 22px 0" }}>
        <div style={{ fontSize: 11.5, color: colors.textMutedAlt, lineHeight: 1.7, background: colors.primaryBg5, border: `1px solid ${colors.borderSoft}`, borderRadius: 12, padding: "11px 13px" }}>
          規約違反などがあったアカウントを検索し、届いている通報を確認したうえで
          <b>利用停止</b>にできます。停止中はログインしてもアプリを使えなくなります。
        </div>
      </div>

      <div style={{ padding: "16px 22px 0" }}>
        <input
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setExpandedId(null);
          }}
          placeholder="ハンドル名・表示名で検索"
          style={{
            width: "100%",
            boxSizing: "border-box",
            border: `1px solid ${colors.border}`,
            borderRadius: 11,
            padding: "11px 13px",
            fontSize: 13,
            fontFamily: "inherit",
            color: "#26222F",
            background: colors.white,
            outline: "none",
          }}
        />
      </div>

      <div style={{ padding: "16px 22px 30px" }}>
        {query.trim().length === 0 ? (
          <EmptyState icon="🔍" title="ユーザーを検索してください" body="ハンドル名または表示名の一部を入力すると候補が出ます。" />
        ) : searchQuery.isPending ? (
          <div style={{ padding: "40px 0", textAlign: "center", fontSize: 13, color: colors.textMutedAlt }}>読み込み中…</div>
        ) : results.length === 0 ? (
          <EmptyState icon="🙅" title="該当するユーザーがいません" body="検索語を変えてお試しください。" />
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {results.map((r) => (
              <UserRow
                key={r.id}
                result={r}
                expanded={expandedId === r.id}
                onToggle={() => setExpandedId((cur) => (cur === r.id ? null : r.id))}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function UserRow({
  result,
  expanded,
  onToggle,
}: {
  result: AdminProfileResult;
  expanded: boolean;
  onToggle: () => void;
}) {
  const reportsQuery = useAdminUserReports(result.id, expanded);
  const suspend = useSuspendUser();
  const reinstate = useReinstateUser();
  const [reason, setReason] = useState("");
  const [error, setError] = useState<string | null>(null);

  const busy = suspend.isPending || reinstate.isPending;

  const handleSuspend = async () => {
    if (!reason.trim() || busy) return;
    if (!window.confirm(`${result.displayName}さんのアカウントを停止します。よろしいですか？`)) return;
    setError(null);
    try {
      await suspend.mutateAsync({ userId: result.id, reason: reason.trim() });
      setReason("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "停止に失敗しました");
    }
  };

  const handleReinstate = async () => {
    if (busy) return;
    if (!window.confirm(`${result.displayName}さんの停止を解除しますか？`)) return;
    setError(null);
    try {
      await reinstate.mutateAsync({ userId: result.id });
    } catch (err) {
      setError(err instanceof Error ? err.message : "解除に失敗しました");
    }
  };

  return (
    <div
      style={{
        border: `1px solid ${result.isSuspended ? "#E7C6C4" : colors.borderSoft}`,
        borderRadius: 14,
        padding: "13px 14px",
        background: result.isSuspended ? "#FBEBEA" : colors.white,
      }}
    >
      <button
        onClick={onToggle}
        style={{ display: "flex", alignItems: "center", gap: 10, width: "100%", border: "none", background: "none", padding: 0, cursor: "pointer", fontFamily: "inherit", textAlign: "left" }}
      >
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 7, flexWrap: "wrap" }}>
            <span style={{ fontSize: 13.5, fontWeight: 700, color: colors.textPrimary }}>{result.displayName}</span>
            <span style={{ fontSize: 11, color: colors.textMutedAlt }}>@{result.handle}</span>
            {result.isAdmin && (
              <span style={{ fontSize: 9.5, fontWeight: 700, padding: "2px 7px", borderRadius: 999, color: colors.primary, background: colors.primaryBg1 }}>
                運営
              </span>
            )}
            {result.isSuspended && (
              <span style={{ fontSize: 9.5, fontWeight: 700, padding: "2px 7px", borderRadius: 999, color: "#C0453F", background: "#FBEBEA" }}>
                停止中
              </span>
            )}
          </div>
          <div style={{ fontSize: 11, color: colors.textMutedAlt, marginTop: 4 }}>
            宛通報 {result.reportCount}件
          </div>
        </div>
        <span style={{ fontSize: 12, color: colors.textMutedAlt }}>{expanded ? "閉じる ▲" : "詳細 ▾"}</span>
      </button>

      {expanded && (
        <div style={{ marginTop: 12, paddingTop: 12, borderTop: `1px solid ${colors.borderSofter}` }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: colors.textSecondary, marginBottom: 8 }}>
            届いている通報（{result.reportCount}件）
          </div>
          {reportsQuery.isPending ? (
            <div style={{ fontSize: 12, color: colors.textMutedAlt }}>読み込み中…</div>
          ) : (reportsQuery.data ?? []).length === 0 ? (
            <div style={{ fontSize: 12, color: colors.textMutedAlt }}>通報はありません。</div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 12 }}>
              {(reportsQuery.data ?? []).map((rep) => (
                <div key={rep.id} style={{ border: `1px solid ${colors.borderSoft}`, borderRadius: 10, padding: "9px 11px" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: 10.5, color: colors.textMutedSoft }}>
                    <span>{rep.reporterName} さんより</span>
                    <span>{new Date(rep.createdAt).toLocaleDateString("ja-JP")}</span>
                  </div>
                  <div style={{ fontSize: 12, fontWeight: 700, color: colors.textPrimary, marginTop: 4 }}>{rep.reason}</div>
                  {rep.detail && (
                    <p style={{ margin: "4px 0 0", fontSize: 11.5, lineHeight: 1.7, color: colors.textSecondary, whiteSpace: "pre-wrap" }}>
                      {rep.detail}
                    </p>
                  )}
                </div>
              ))}
            </div>
          )}

          <MessageReviewSection userId={result.id} userName={result.displayName} enabled={expanded} />

          {result.isSuspended ? (
            <div>
              {result.suspensionReason && (
                <div style={{ fontSize: 11.5, color: colors.textSecondary, marginBottom: 10, lineHeight: 1.7 }}>
                  停止理由: {result.suspensionReason}
                </div>
              )}
              <button
                onClick={handleReinstate}
                disabled={busy}
                style={{ border: `1px solid ${colors.border}`, background: colors.white, color: colors.textSecondary, borderRadius: 999, padding: "7px 15px", fontSize: 12, fontWeight: 700, fontFamily: "inherit", cursor: busy ? "default" : "pointer", opacity: busy ? 0.5 : 1 }}
              >
                {reinstate.isPending ? "解除中…" : "停止を解除する"}
              </button>
            </div>
          ) : result.isAdmin ? (
            <div style={{ fontSize: 11.5, color: colors.textMutedAlt }}>運営アカウントは停止できません。</div>
          ) : (
            <div>
              <textarea
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="停止理由（本人にも表示されます）"
                rows={3}
                style={{ width: "100%", boxSizing: "border-box", border: `1px solid ${colors.border}`, borderRadius: 10, padding: "9px 11px", fontSize: 12, fontFamily: "inherit", lineHeight: 1.7, resize: "none", outline: "none" }}
              />
              <button
                onClick={handleSuspend}
                disabled={busy || !reason.trim()}
                style={{ marginTop: 8, border: "1px solid #E7C6C4", background: "#FBEBEA", color: "#C0453F", borderRadius: 999, padding: "7px 15px", fontSize: 12, fontWeight: 700, fontFamily: "inherit", cursor: busy || !reason.trim() ? "default" : "pointer", opacity: busy || !reason.trim() ? 0.5 : 1 }}
              >
                {suspend.isPending ? "停止中…" : "このアカウントを停止する"}
              </button>
            </div>
          )}
          {error && <div style={{ fontSize: 11, color: "#C0453F", marginTop: 8 }}>{error}</div>}
        </div>
      )}
    </div>
  );
}

/**
 * 通報対応のためのメッセージ確認。DM/グループ本文は messages への RLS では
 * なく SECURITY DEFINER 関数経由でのみ取得し（is_admin() 限定）、取得のたびに
 * 監査ログが1行残る（0057）。閲覧できるのは通報のあるユーザーの会話だけ。
 * 実運用の前提としてプライバシーポリシー/規約での開示・同意が必要。
 */
function MessageReviewSection({ userId, userName, enabled }: { userId: string; userName: string; enabled: boolean }) {
  const [open, setOpen] = useState(false);
  const convosQuery = useAdminUserConversations(userId, enabled && open);
  const convos = convosQuery.data ?? [];

  return (
    <div style={{ marginTop: 14, paddingTop: 12, borderTop: `1px solid ${colors.borderSofter}` }}>
      <button
        onClick={() => setOpen((v) => !v)}
        style={{ display: "flex", alignItems: "center", gap: 6, border: "none", background: "none", padding: 0, cursor: "pointer", fontFamily: "inherit", fontSize: 12, fontWeight: 700, color: colors.textSecondary }}
      >
        メッセージの確認（通報対応）{open ? " ▲" : " ▾"}
      </button>

      {open && (
        <div style={{ marginTop: 10 }}>
          <div style={{ fontSize: 11, color: "#8A5A20", background: "#FBF3E4", border: "1px solid #EBD9BC", borderRadius: 10, padding: "9px 11px", lineHeight: 1.7, marginBottom: 10 }}>
            ⚠️ 会話の確認は<b>監査ログに記録</b>されます（誰が・いつ・どの会話を・理由）。
            通報対応など正当な目的の場合のみ確認してください。閲覧できるのは通報のあるユーザーの会話に限られます。
          </div>

          {convosQuery.isPending ? (
            <div style={{ fontSize: 12, color: colors.textMutedAlt }}>読み込み中…</div>
          ) : convosQuery.isError ? (
            <div style={{ fontSize: 12, color: colors.textMutedAlt }}>
              会話を取得できませんでした（通報のあるユーザーのみ確認できます）。
            </div>
          ) : convos.length === 0 ? (
            <div style={{ fontSize: 12, color: colors.textMutedAlt }}>会話がありません。</div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {convos.map((c) => (
                <AdminConversationRow key={c.conversationId} convo={c} userName={userName} />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function AdminConversationRow({ convo, userName }: { convo: AdminConversation; userName: string }) {
  const view = useViewConversationMessages();
  const [showReason, setShowReason] = useState(false);
  const [reason, setReason] = useState("");
  const [messages, setMessages] = useState<AdminMessage[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleView = async () => {
    if (reason.trim().length < 3 || view.isPending) return;
    setError(null);
    try {
      const msgs = await view.mutateAsync({ conversationId: convo.conversationId, reason: reason.trim() });
      setMessages(msgs);
    } catch (err) {
      setError(err instanceof Error ? err.message : "取得に失敗しました");
    }
  };

  return (
    <div style={{ border: `1px solid ${colors.borderSoft}`, borderRadius: 10, padding: "9px 11px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: 8 }}>
        <span style={{ fontSize: 12, fontWeight: 700, color: colors.textPrimary, minWidth: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
          {userName} ↔ {convo.otherUserName ?? "（退会ユーザー）"}
        </span>
        <span style={{ fontSize: 10.5, color: colors.textMutedSoft, flex: "0 0 auto" }}>{convo.messageCount}件</span>
      </div>

      {messages ? (
        <div style={{ marginTop: 8, display: "flex", flexDirection: "column", gap: 7, maxHeight: 260, overflowY: "auto" }}>
          {messages.length === 0 ? (
            <div style={{ fontSize: 11.5, color: colors.textMutedAlt }}>メッセージはありません。</div>
          ) : (
            messages.map((m) => (
              <div key={m.id} style={{ fontSize: 11.5, lineHeight: 1.7 }}>
                <div style={{ display: "flex", justifyContent: "space-between", gap: 8, color: colors.textMutedSoft, fontSize: 10 }}>
                  <span style={{ fontWeight: 700, color: colors.textSecondary }}>{m.senderName}</span>
                  <span>{new Date(m.createdAt).toLocaleString("ja-JP", { month: "numeric", day: "numeric", hour: "2-digit", minute: "2-digit" })}</span>
                </div>
                {m.body && <div style={{ color: colors.textPrimary, whiteSpace: "pre-wrap", overflowWrap: "anywhere" }}>{m.body}</div>}
                {m.imageUrl && <div style={{ color: colors.textMutedAlt, fontSize: 10.5 }}>🖼 画像を送信</div>}
              </div>
            ))
          )}
        </div>
      ) : !showReason ? (
        <button
          onClick={() => setShowReason(true)}
          style={{ marginTop: 8, border: `1px solid ${colors.border}`, background: colors.white, color: colors.textSecondary, borderRadius: 999, padding: "5px 13px", fontSize: 11, fontWeight: 600, fontFamily: "inherit", cursor: "pointer" }}
        >
          この会話を確認する
        </button>
      ) : (
        <div style={{ marginTop: 8 }}>
          <textarea
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="確認する理由（例: ●●さんからの嫌がらせ通報の対応。ログに残ります）"
            rows={2}
            style={{ width: "100%", boxSizing: "border-box", border: `1px solid ${colors.border}`, borderRadius: 9, padding: "8px 10px", fontSize: 11.5, fontFamily: "inherit", lineHeight: 1.6, resize: "none", outline: "none" }}
          />
          <button
            onClick={handleView}
            disabled={reason.trim().length < 3 || view.isPending}
            style={{ marginTop: 6, border: "none", background: colors.primary, color: colors.white, borderRadius: 999, padding: "6px 14px", fontSize: 11, fontWeight: 700, fontFamily: "inherit", cursor: reason.trim().length < 3 || view.isPending ? "default" : "pointer", opacity: reason.trim().length < 3 || view.isPending ? 0.5 : 1 }}
          >
            {view.isPending ? "取得中…" : "確認する（記録されます）"}
          </button>
        </div>
      )}
      {error && <div style={{ fontSize: 10.5, color: "#C0453F", marginTop: 6 }}>{error}</div>}
    </div>
  );
}
