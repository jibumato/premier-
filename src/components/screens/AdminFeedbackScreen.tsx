"use client";

import { colors } from "@/lib/tokens";
import { useRouter } from "../AppRouter";
import { AppBar } from "../ui";
import { EmptyState } from "../EmptyState";
import { useAuth } from "@/lib/auth/useAuth";
import { useProfile } from "@/lib/queries/profile";
import {
  FEEDBACK_CATEGORY_LABELS,
  FEEDBACK_STATUS_LABELS,
  useAdminFeedback,
  useUpdateFeedbackStatus,
  type AdminFeedback,
  type FeedbackStatus,
} from "@/lib/queries/feedback";
import { isSupabaseConfigured } from "@/lib/supabase/config";

/**
 * 運営専用: ユーザーからの要望・不具合報告の一覧とステータス消し込み。
 * 本人確認の承認・ピックアップ管理と同じ作りで、閲覧・更新は RLS で
 * is_admin() に限定（0045）。UI 側でも is_admin で出し分ける。
 */
export function AdminFeedbackScreen() {
  const { back } = useRouter();
  const { user } = useAuth();
  const configured = isSupabaseConfigured();
  const profile = useProfile(user?.id);
  const isAdmin = Boolean(configured && profile.data?.is_admin);

  const listQuery = useAdminFeedback(isAdmin);

  if (configured && profile.data && !isAdmin) {
    return (
      <div>
        <AppBar title="要望の管理" onBack={back} />
        <EmptyState icon="🔒" title="権限がありません" body="この画面は運営アカウントのみ利用できます。" />
      </div>
    );
  }

  const list = listQuery.data ?? [];
  const openCount = list.filter((f) => f.status === "open").length;

  return (
    <div>
      <AppBar title="要望の管理" onBack={back} />

      <div style={{ padding: "10px 22px 0" }}>
        <div style={{ fontSize: 11.5, color: colors.textMutedAlt, lineHeight: 1.7, background: colors.primaryBg5, border: `1px solid ${colors.borderSoft}`, borderRadius: 12, padding: "11px 13px" }}>
          ユーザーから届いた要望・不具合報告です。対応したものは
          <b>ステータスを切り替えて消し込み</b>ます（未対応 → 対応中 → 完了）。
        </div>
      </div>

      <div style={{ padding: "16px 22px 30px" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 13 }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: colors.textPrimary }}>全 {list.length}件</div>
          <div style={{ fontSize: 11, color: colors.textMutedAlt }}>未対応 {openCount}件</div>
        </div>

        {listQuery.isPending && isAdmin ? (
          <div style={{ padding: "40px 0", textAlign: "center", fontSize: 13, color: colors.textMutedAlt }}>読み込み中…</div>
        ) : list.length === 0 ? (
          <EmptyState icon="📮" title="まだ要望はありません" body="ユーザーから要望が届くとここに表示されます。" />
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {list.map((f) => (
              <FeedbackRow key={f.id} feedback={f} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

const STATUS_COLORS: Record<FeedbackStatus, { fg: string; bg: string }> = {
  open: { fg: "#C0453F", bg: "#FBEBEA" },
  in_progress: { fg: "#8A6D1B", bg: "#FBF3DC" },
  done: { fg: "#2F7A4D", bg: "#E7F4EC" },
};

function formatDate(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleString("ja-JP", { month: "numeric", day: "numeric", hour: "2-digit", minute: "2-digit" });
}

function FeedbackRow({ feedback }: { feedback: AdminFeedback }) {
  const update = useUpdateFeedbackStatus();
  const sc = STATUS_COLORS[feedback.status];

  return (
    <div
      style={{
        border: `1px solid ${colors.borderSoft}`,
        borderRadius: 14,
        padding: "13px 14px",
        background: feedback.status === "done" ? colors.primaryBg5 : colors.white,
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 7, flexWrap: "wrap" }}>
        <span style={{ fontSize: 9.5, fontWeight: 700, padding: "3px 8px", borderRadius: 999, color: sc.fg, background: sc.bg }}>
          {FEEDBACK_STATUS_LABELS[feedback.status]}
        </span>
        <span style={{ fontSize: 9.5, fontWeight: 600, padding: "3px 8px", borderRadius: 999, color: colors.pinkText, background: colors.pinkBg1 }}>
          {FEEDBACK_CATEGORY_LABELS[feedback.category]}
        </span>
        <span style={{ fontSize: 10.5, color: colors.textMutedSoft, marginLeft: "auto" }}>
          {formatDate(feedback.createdAt)}
        </span>
      </div>

      <p style={{ margin: "9px 0 0", fontSize: 12.5, lineHeight: 1.8, color: colors.textSecondary, whiteSpace: "pre-wrap", overflowWrap: "anywhere" }}>
        {feedback.body}
      </p>

      <div style={{ fontSize: 10.5, color: colors.textMutedAlt, marginTop: 8 }}>
        送信者: {feedback.senderName ?? "（退会済み）"}
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 10, flexWrap: "wrap" }}>
        {(Object.keys(FEEDBACK_STATUS_LABELS) as FeedbackStatus[]).map((s) => (
          <button
            key={s}
            onClick={() => s !== feedback.status && update.mutate({ id: feedback.id, status: s })}
            disabled={update.isPending || s === feedback.status}
            style={{
              border: `1px solid ${s === feedback.status ? colors.primary : colors.border}`,
              background: s === feedback.status ? colors.primaryBg1 : colors.white,
              color: s === feedback.status ? colors.primary : colors.textSecondary,
              borderRadius: 999,
              padding: "5px 11px",
              fontSize: 11,
              fontWeight: 600,
              fontFamily: "inherit",
              cursor: update.isPending || s === feedback.status ? "default" : "pointer",
              opacity: update.isPending ? 0.5 : 1,
            }}
          >
            {FEEDBACK_STATUS_LABELS[s]}
          </button>
        ))}
      </div>
      {update.isError && (
        <div style={{ fontSize: 11, color: "#C0453F", marginTop: 8 }}>
          {update.error instanceof Error ? update.error.message : "更新に失敗しました"}
        </div>
      )}
    </div>
  );
}
