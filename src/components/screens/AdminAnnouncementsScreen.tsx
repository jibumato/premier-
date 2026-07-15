"use client";

import { useState } from "react";
import type { CSSProperties } from "react";
import { colors } from "@/lib/tokens";
import { useRouter } from "../AppRouter";
import { AppBar } from "../ui";
import { EmptyState } from "../EmptyState";
import { useAuth } from "@/lib/auth/useAuth";
import { useProfile } from "@/lib/queries/profile";
import {
  ANNOUNCEMENT_CATEGORY_LABELS,
  useAnnouncements,
  useCreateAnnouncement,
  useDeleteAnnouncement,
  useUpdateAnnouncement,
} from "@/lib/queries/announcements";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import type { Announcement, AnnouncementCategory } from "@/lib/types";

const CATEGORIES: AnnouncementCategory[] = ["news", "update", "maintenance"];

const inputStyle: CSSProperties = {
  width: "100%",
  boxSizing: "border-box",
  minWidth: 0,
  marginTop: 6,
  border: `1px solid ${colors.border}`,
  borderRadius: 11,
  padding: "11px 13px",
  fontSize: 13,
  fontFamily: "inherit",
  color: "#26222F",
  background: colors.white,
  outline: "none",
};

/**
 * 運営専用: お知らせ（announcements）の投稿・編集・削除。ピックアップ管理等と
 * 同じ作りで、書き込みは RLS で is_admin() に限定（0048）。UI 側でも is_admin で
 * 出し分ける。投稿するとホーム最新1件・「お知らせ・更新履歴」画面に即反映される。
 */
export function AdminAnnouncementsScreen() {
  const { back } = useRouter();
  const { user } = useAuth();
  const configured = isSupabaseConfigured();
  const profile = useProfile(user?.id);
  const isAdmin = Boolean(configured && profile.data?.is_admin);

  const listQuery = useAnnouncements();
  const create = useCreateAnnouncement();

  const [category, setCategory] = useState<AnnouncementCategory>("news");
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [error, setError] = useState<string | null>(null);

  if (configured && profile.data && !isAdmin) {
    return (
      <div>
        <AppBar title="お知らせの管理" onBack={back} />
        <EmptyState icon="🔒" title="権限がありません" body="この画面は運営アカウントのみ利用できます。" />
      </div>
    );
  }

  const list = configured ? (listQuery.data ?? []) : [];
  const canPost = title.trim().length > 0 && !create.isPending;

  const handleCreate = async () => {
    if (!canPost) return;
    setError(null);
    try {
      await create.mutateAsync({ category, title: title.trim(), body: body.trim() });
      setTitle("");
      setBody("");
      setCategory("news");
    } catch (err) {
      setError(err instanceof Error ? err.message : "投稿に失敗しました");
    }
  };

  return (
    <div>
      <AppBar title="お知らせの管理" onBack={back} />

      {/* guidance */}
      <div style={{ padding: "10px 22px 0" }}>
        <div style={{ fontSize: 11.5, color: colors.textMutedAlt, lineHeight: 1.7, background: colors.primaryBg5, border: `1px solid ${colors.borderSoft}`, borderRadius: 12, padding: "11px 13px" }}>
          ここで投稿したお知らせは、<b>ホームの最新1件</b>と「お知らせ・更新履歴」画面に
          すぐ反映されます。SQLでの操作は不要です。
        </div>
      </div>

      {/* create form */}
      <div style={{ padding: "16px 22px 0" }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: colors.textPrimary, marginBottom: 10 }}>新しいお知らせ</div>
        <div style={{ display: "flex", gap: 8 }}>
          {CATEGORIES.map((c) => {
            const on = category === c;
            return (
              <button
                key={c}
                type="button"
                onClick={() => setCategory(c)}
                style={{
                  fontSize: 12,
                  fontWeight: 600,
                  color: on ? colors.white : "#4A4458",
                  background: on ? colors.primary : colors.white,
                  border: `1px solid ${on ? colors.primary : colors.border}`,
                  borderRadius: 999,
                  padding: "7px 14px",
                  cursor: "pointer",
                  fontFamily: "inherit",
                }}
              >
                {ANNOUNCEMENT_CATEGORY_LABELS[c]}
              </button>
            );
          })}
        </div>
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="タイトル"
          style={inputStyle}
        />
        <textarea
          value={body}
          onChange={(e) => setBody(e.target.value)}
          placeholder="本文（任意）"
          rows={4}
          style={{ ...inputStyle, resize: "none", lineHeight: 1.7 }}
        />
        <button
          onClick={handleCreate}
          disabled={!canPost || !configured}
          style={{
            width: "100%",
            marginTop: 10,
            border: "none",
            background: colors.primary,
            color: colors.white,
            fontFamily: "inherit",
            fontSize: 13,
            fontWeight: 700,
            padding: "12px 0",
            borderRadius: 12,
            cursor: canPost ? "pointer" : "default",
            opacity: !canPost || !configured ? 0.55 : 1,
          }}
        >
          {create.isPending ? "投稿中…" : "投稿する"}
        </button>
        {error && <div style={{ fontSize: 11.5, color: "#C0453F", marginTop: 8 }}>{error}</div>}
        {!configured && (
          <div style={{ fontSize: 11.5, color: colors.textMutedAlt, marginTop: 8 }}>
            プレビュー環境（未接続）では投稿できません。
          </div>
        )}
      </div>

      {/* list */}
      <div style={{ padding: "20px 22px 30px" }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: colors.textPrimary, marginBottom: 13 }}>
          投稿済み {list.length}件
        </div>

        {configured && listQuery.isPending ? (
          <div style={{ padding: "40px 0", textAlign: "center", fontSize: 13, color: colors.textMutedAlt }}>読み込み中…</div>
        ) : list.length === 0 ? (
          <EmptyState icon="📣" title="まだお知らせがありません" body="上のフォームから投稿してください。" />
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {list.map((a) => (
              <AnnouncementRow key={a.key} announcement={a} />
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
  return d.toLocaleString("ja-JP", { year: "numeric", month: "numeric", day: "numeric", hour: "2-digit", minute: "2-digit" });
}

function AnnouncementRow({ announcement }: { announcement: Announcement }) {
  const update = useUpdateAnnouncement();
  const del = useDeleteAnnouncement();

  const [editing, setEditing] = useState(false);
  const [category, setCategory] = useState<AnnouncementCategory>(announcement.category);
  const [title, setTitle] = useState(announcement.title);
  const [body, setBody] = useState(announcement.body);
  const [error, setError] = useState<string | null>(null);

  const busy = update.isPending || del.isPending;

  const handleSave = async () => {
    if (busy || !title.trim()) return;
    setError(null);
    try {
      await update.mutateAsync({ id: announcement.key, patch: { category, title: title.trim(), body: body.trim() } });
      setEditing(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "更新に失敗しました");
    }
  };

  const handleDelete = () => {
    if (busy) return;
    if (!window.confirm("このお知らせを削除しますか？")) return;
    setError(null);
    del.mutate({ id: announcement.key }, { onError: (e) => setError(e instanceof Error ? e.message : "削除に失敗しました") });
  };

  if (editing) {
    return (
      <div style={{ border: `1px solid ${colors.primary}`, borderRadius: 14, padding: "13px 14px", background: colors.primaryBg5 }}>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          {CATEGORIES.map((c) => {
            const on = category === c;
            return (
              <button
                key={c}
                type="button"
                onClick={() => setCategory(c)}
                style={{
                  fontSize: 11.5,
                  fontWeight: 600,
                  color: on ? colors.white : "#4A4458",
                  background: on ? colors.primary : colors.white,
                  border: `1px solid ${on ? colors.primary : colors.border}`,
                  borderRadius: 999,
                  padding: "6px 12px",
                  cursor: "pointer",
                  fontFamily: "inherit",
                }}
              >
                {ANNOUNCEMENT_CATEGORY_LABELS[c]}
              </button>
            );
          })}
        </div>
        <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="タイトル" style={inputStyle} />
        <textarea value={body} onChange={(e) => setBody(e.target.value)} placeholder="本文" rows={4} style={{ ...inputStyle, resize: "none", lineHeight: 1.7 }} />
        <div style={{ display: "flex", gap: 8, marginTop: 10 }}>
          <button
            onClick={handleSave}
            disabled={busy || !title.trim()}
            style={{ flex: 1, border: "none", background: colors.primary, color: colors.white, fontFamily: "inherit", fontSize: 12.5, fontWeight: 700, padding: "10px 0", borderRadius: 11, cursor: "pointer", opacity: busy || !title.trim() ? 0.55 : 1 }}
          >
            {update.isPending ? "保存中…" : "保存"}
          </button>
          <button
            onClick={() => {
              setEditing(false);
              setCategory(announcement.category);
              setTitle(announcement.title);
              setBody(announcement.body);
            }}
            disabled={busy}
            style={{ flex: "0 0 auto", border: `1px solid ${colors.border}`, background: colors.white, color: colors.textSecondary, fontFamily: "inherit", fontSize: 12.5, fontWeight: 700, padding: "10px 16px", borderRadius: 11, cursor: "pointer" }}
          >
            取消
          </button>
        </div>
        {error && <div style={{ fontSize: 11, color: "#C0453F", marginTop: 8 }}>{error}</div>}
      </div>
    );
  }

  return (
    <div style={{ border: `1px solid ${colors.borderSoft}`, borderRadius: 14, padding: "13px 14px", background: colors.white }}>
      <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
        <span style={{ fontSize: 9.5, fontWeight: 700, padding: "3px 8px", borderRadius: 999, color: colors.primary, background: colors.primaryBg1 }}>
          {ANNOUNCEMENT_CATEGORY_LABELS[announcement.category]}
        </span>
        <span style={{ fontSize: 10.5, color: colors.textMutedSoft, marginLeft: "auto" }}>{formatDate(announcement.publishedAt)}</span>
      </div>
      <div style={{ fontSize: 13.5, fontWeight: 700, color: colors.textPrimary, marginTop: 8 }}>{announcement.title}</div>
      {announcement.body && (
        <p style={{ margin: "6px 0 0", fontSize: 12, lineHeight: 1.8, color: colors.textSecondary, whiteSpace: "pre-wrap", overflowWrap: "anywhere" }}>
          {announcement.body}
        </p>
      )}
      <div style={{ display: "flex", gap: 6, marginTop: 11 }}>
        <button
          onClick={() => setEditing(true)}
          disabled={busy}
          style={{ border: `1px solid ${colors.border}`, background: colors.white, color: colors.textSecondary, borderRadius: 999, padding: "5px 13px", fontSize: 11, fontWeight: 600, fontFamily: "inherit", cursor: "pointer" }}
        >
          編集
        </button>
        <button
          onClick={handleDelete}
          disabled={busy}
          style={{ border: "1px solid #E7C6C4", background: colors.white, color: "#C0453F", borderRadius: 999, padding: "5px 13px", fontSize: 11, fontWeight: 600, fontFamily: "inherit", cursor: "pointer" }}
        >
          削除
        </button>
      </div>
      {error && <div style={{ fontSize: 11, color: "#C0453F", marginTop: 8 }}>{error}</div>}
    </div>
  );
}
