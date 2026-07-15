"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { formatRelativeTime } from "@/lib/format";

export interface LoungePost {
  key: string;
  authorId: string;
  authorName: string;
  authorAvatarUrl: string | null;
  body: string;
  time: string;
}

/** ブロックしたユーザー・自動非表示（0050）を除いた談話室の投稿一覧、新着順。 */
export function useLoungePosts(filter?: { blockedUserIds: string[]; hiddenLoungeIds: string[] }, limit?: number) {
  return useQuery({
    queryKey: ["lounge_posts", filter?.blockedUserIds ?? [], filter?.hiddenLoungeIds ?? [], limit ?? null],
    enabled: isSupabaseConfigured(),
    queryFn: async (): Promise<LoungePost[]> => {
      const supabase = getSupabaseBrowserClient();
      let query = supabase
        .from("lounge_posts")
        .select("id, author_id, body, created_at")
        .order("created_at", { ascending: false });
      if (limit) query = query.limit(limit);
      const { data, error } = await query;
      if (error) throw error;
      let rows = (data ?? []) as { id: string; author_id: string; body: string; created_at: string }[];
      if (filter) {
        const blocked = new Set(filter.blockedUserIds);
        const hidden = new Set(filter.hiddenLoungeIds);
        rows = rows.filter((r) => !blocked.has(r.author_id) && !hidden.has(r.id));
      }
      if (rows.length === 0) return [];
      const authorIds = Array.from(new Set(rows.map((r) => r.author_id)));
      const { data: profs } = await supabase.from("profiles").select("id, display_name, avatar_url").in("id", authorIds);
      const byId = new Map(
        ((profs ?? []) as { id: string; display_name: string; avatar_url: string | null }[]).map((p) => [p.id, p]),
      );
      return rows.map((r) => ({
        key: r.id,
        authorId: r.author_id,
        authorName: byId.get(r.author_id)?.display_name ?? "不明",
        authorAvatarUrl: byId.get(r.author_id)?.avatar_url ?? null,
        body: r.body,
        time: formatRelativeTime(r.created_at),
      }));
    },
  });
}

/** Postgres エラーコードを利用者向けの日本語メッセージに変換する。
 * 23514 = check_violation（NGワード・リンク・300字超過など）
 * 42501 = insufficient_privilege（RLS with-check 失敗＝連投クールダウン／日次上限） */
export function friendlyLoungeError(e: unknown): string {
  const err = e as { code?: string; message?: string };
  if (err?.code === "23514") {
    return "投稿できませんでした。リンクや過度な繰り返し文字、不適切な表現が含まれていないか確認してください。";
  }
  if (err?.code === "42501") {
    return "少し間隔をあけてから投稿してください（連続投稿の制限、または1日の投稿上限に達した可能性があります）。";
  }
  return "投稿に失敗しました。時間をおいて再度お試しください。";
}

export function useCreateLoungePost() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ authorId, body }: { authorId: string; body: string }) => {
      const supabase = getSupabaseBrowserClient();
      const { error } = await supabase.from("lounge_posts").insert({ author_id: authorId, body });
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["lounge_posts"] }),
  });
}

/** 自分の投稿の削除。 */
export function useDeleteLoungePost() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ postId }: { postId: string }) => {
      const supabase = getSupabaseBrowserClient();
      const { data, error } = await supabase.from("lounge_posts").delete().eq("id", postId).select("id");
      if (error) throw error;
      if (!data || data.length === 0) {
        throw new Error("削除できませんでした");
      }
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["lounge_posts"] }),
  });
}

/** 運営による強制削除。admin_delete_lounge_post RPC は内部で is_admin() を確認する（0050）。 */
export function useAdminDeleteLoungePost() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ postId }: { postId: string }) => {
      const supabase = getSupabaseBrowserClient();
      const { error } = await supabase.rpc("admin_delete_lounge_post", { p_post_id: postId });
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["lounge_posts"] }),
  });
}
