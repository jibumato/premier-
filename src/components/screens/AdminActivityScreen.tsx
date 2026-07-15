"use client";

import { useState } from "react";
import { colors } from "@/lib/tokens";
import { useRouter } from "../AppRouter";
import { AppBar } from "../ui";
import { EmptyState } from "../EmptyState";
import { useAuth } from "@/lib/auth/useAuth";
import { useProfile } from "@/lib/queries/profile";
import {
  ACTIVITY_KIND_LABELS,
  useAdminActivity,
  useCleanupOldActivity,
  useDeleteActivityEvent,
  type ActivityEvent,
} from "@/lib/queries/activity";
import { isSupabaseConfigured } from "@/lib/supabase/config";

const CLEANUP_DAYS_OPTIONS = [7, 14, 30];

/**
 * 運営専用: ホームの「最近のうごき」に流れる行の一覧・個別削除・古い行の
 * 一括整理。他の運営画面と同じ作りで、削除は RLS で is_admin() に限定（0047）。
 * 内容自体（見出し文）はトリガー生成のみで、運営でも書き換えはできない。
 */
export function AdminActivityScreen() {
  const { back } = useRouter();
  const { user } = useAuth();
  const configured = isSupabaseConfigured();
  const profile = useProfile(user?.id);
  const isAdmin = Boolean(configured && profile.data?.is_admin);

  const listQuery = useAdminActivity(isAdmin);
  const cleanup = useCleanupOldActivity();
  const [cleanupDays, setCleanupDays] = useState(30);
  const [cleanupMessage, setCleanupMessage] = useState<string | null>(null);

  if (configured && profile.data && !isAdmin) {
    return (
      <div>
        <AppBar title="最近のうごきの管理" onBack={back} />
        <EmptyState icon="🔒" title="権限がありません" body="この画面は運営アカウントのみ利用できます。" />
      </div>
    );
  }

  const list = listQuery.data ?? [];

  const handleCleanup = () => {
    if (cleanup.isPending) return;
    if (!window.confirm(`${cleanupDays}日より前の行をまとめて削除します。よろしいですか？`)) return;
    setCleanupMessage(null);
    cleanup.mutate(
      { olderThanDays: cleanupDays },
      {
        onSuccess: (deleted) => setCleanupMessage(`${deleted}件削除しました。`),
        onError: (e) => setCleanupMessage(e instanceof Error ? e.message : "削除に失敗しました"),
      },
    );
  };

  return (
    <div>
      <AppBar title="最近のうごきの管理" onBack={back} />

      <div style={{ padding: "10px 22px 0" }}>
        <div style={{ fontSize: 11.5, color: colors.textMutedAlt, lineHeight: 1.7, background: colors.primaryBg5, border: `1px solid ${colors.borderSoft}`, borderRadius: 12, padding: "11px 13px" }}>
          ホームの「最近のうごき」に流れる行の一覧です。見出し文は
          <b>システムが自動生成</b>するため書き換えはできませんが、
          個別に削除したり、<b>古い行をまとめて整理</b>できます。
        </div>
      </div>

      {/* 一括整理 */}
      <div style={{ padding: "16px 22px 0" }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: colors.textPrimary, marginBottom: 10 }}>古い行の整理</div>
        <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
          <div style={{ display: "flex", gap: 6 }}>
            {CLEANUP_DAYS_OPTIONS.map((d) => (
              <button
                key={d}
                onClick={() => setCleanupDays(d)}
                style={{
                  border: `1px solid ${cleanupDays === d ? colors.primary : colors.border}`,
                  background: cleanupDays === d ? colors.primaryBg1 : colors.white,
                  color: cleanupDays === d ? colors.primary : colors.textSecondary,
                  borderRadius: 999,
                  padding: "6px 13px",
                  fontSize: 12,
                  fontWeight: 600,
                  fontFamily: "inherit",
                  cursor: "pointer",
                }}
              >
                {d}日より前
              </button>
            ))}
          </div>
          <button
            onClick={handleCleanup}
            disabled={cleanup.isPending || !configured}
            style={{
              border: "none",
              background: colors.primary,
              color: colors.white,
              fontFamily: "inherit",
              fontSize: 12,
              fontWeight: 700,
              padding: "8px 16px",
              borderRadius: 999,
              cursor: cleanup.isPending ? "default" : "pointer",
              opacity: cleanup.isPending || !configured ? 0.55 : 1,
            }}
          >
            {cleanup.isPending ? "削除中…" : "まとめて削除"}
          </button>
        </div>
        {cleanupMessage && (
          <div style={{ fontSize: 11.5, color: cleanup.isError ? "#C0453F" : colors.positive, marginTop: 8 }}>
            {cleanupMessage}
          </div>
        )}
      </div>

      {/* list */}
      <div style={{ padding: "20px 22px 30px" }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: colors.textPrimary, marginBottom: 13 }}>
          直近 {list.length}件
        </div>

        {listQuery.isPending && isAdmin ? (
          <div style={{ padding: "40px 0", textAlign: "center", fontSize: 13, color: colors.textMutedAlt }}>読み込み中…</div>
        ) : list.length === 0 ? (
          <EmptyState icon="📡" title="まだうごきがありません" body="併せの新規募集やレビューが投稿されるとここに表示されます。" />
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {list.map((a) => (
              <ActivityRow key={a.id} activity={a} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function formatDate(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleString("ja-JP", { month: "numeric", day: "numeric", hour: "2-digit", minute: "2-digit" });
}

function ActivityRow({ activity }: { activity: ActivityEvent }) {
  const del = useDeleteActivityEvent();

  const handleDelete = () => {
    if (del.isPending) return;
    if (!window.confirm("この行を削除しますか？")) return;
    del.mutate({ id: activity.id });
  };

  return (
    <div style={{ display: "flex", gap: 10, alignItems: "flex-start", border: `1px solid ${colors.borderSoft}`, borderRadius: 12, padding: "11px 13px" }}>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
          <span style={{ fontSize: 9.5, fontWeight: 700, padding: "3px 8px", borderRadius: 999, color: colors.pinkText, background: colors.pinkBg1 }}>
            {ACTIVITY_KIND_LABELS[activity.kind]}
          </span>
          <span style={{ fontSize: 10.5, color: colors.textMutedSoft }}>{formatDate(activity.createdAt)}</span>
        </div>
        <div style={{ fontSize: 12.5, color: colors.textSecondary, marginTop: 6, lineHeight: 1.6 }}>
          {activity.headline}
        </div>
        {del.isError && (
          <div style={{ fontSize: 11, color: "#C0453F", marginTop: 6 }}>
            {del.error instanceof Error ? del.error.message : "削除に失敗しました"}
          </div>
        )}
      </div>
      <button
        onClick={handleDelete}
        disabled={del.isPending}
        style={{
          flex: "0 0 auto",
          border: "1px solid #E7C6C4",
          background: colors.white,
          color: "#C0453F",
          borderRadius: 999,
          padding: "5px 11px",
          fontSize: 11,
          fontWeight: 600,
          fontFamily: "inherit",
          cursor: del.isPending ? "default" : "pointer",
          opacity: del.isPending ? 0.5 : 1,
        }}
      >
        削除
      </button>
    </div>
  );
}
