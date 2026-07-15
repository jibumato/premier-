"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import type { Announcement, AnnouncementCategory } from "@/lib/types";

/** 運営お知らせ / 更新履歴。新しい順。運営が Supabase から投稿する。 */
export function useAnnouncements() {
  return useQuery({
    queryKey: ["announcements"],
    enabled: isSupabaseConfigured(),
    queryFn: async (): Promise<Announcement[]> => {
      const supabase = getSupabaseBrowserClient();
      const { data, error } = await supabase
        .from("announcements")
        .select("id, category, title, body, published_at")
        .order("published_at", { ascending: false });
      if (error) throw error;
      const rows = (data ?? []) as {
        id: string;
        category: string;
        title: string;
        body: string;
        published_at: string;
      }[];
      return rows.map((r) => ({
        key: r.id,
        category: (r.category as AnnouncementCategory) ?? "update",
        title: r.title,
        body: r.body,
        publishedAt: r.published_at,
      }));
    },
  });
}

export const ANNOUNCEMENT_CATEGORY_LABELS: Record<AnnouncementCategory, string> = {
  update: "アップデート",
  news: "お知らせ",
  maintenance: "メンテナンス",
};

// =============================================================================
// 運営（is_admin）向け: お知らせの投稿・編集・削除。
// 書き込みは RLS で is_admin() に限定（0048）。閲覧は useAnnouncements を流用。
// =============================================================================

function invalidateAnnouncements(qc: ReturnType<typeof useQueryClient>) {
  qc.invalidateQueries({ queryKey: ["announcements"] });
}

/** 新規お知らせを投稿（published_at は now）。 */
export function useCreateAnnouncement() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ category, title, body }: { category: AnnouncementCategory; title: string; body: string }) => {
      const supabase = getSupabaseBrowserClient();
      const { data, error } = await supabase
        .from("announcements")
        .insert({ category, title, body })
        .select("id");
      if (error) throw error;
      if (!data || data.length === 0) {
        throw new Error("投稿できませんでした。運営権限とマイグレーション0048の適用をご確認ください。");
      }
    },
    onSuccess: () => invalidateAnnouncements(qc),
  });
}

/** お知らせの編集（種別・タイトル・本文）。 */
export function useUpdateAnnouncement() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      id,
      patch,
    }: {
      id: string;
      patch: { category?: AnnouncementCategory; title?: string; body?: string };
    }) => {
      const supabase = getSupabaseBrowserClient();
      const { data, error } = await supabase.from("announcements").update(patch).eq("id", id).select("id");
      if (error) throw error;
      if (!data || data.length === 0) {
        throw new Error("更新できませんでした。運営権限とマイグレーション0048の適用をご確認ください。");
      }
    },
    onSuccess: () => invalidateAnnouncements(qc),
  });
}

/** お知らせの削除。 */
export function useDeleteAnnouncement() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id }: { id: string }) => {
      const supabase = getSupabaseBrowserClient();
      const { data, error } = await supabase.from("announcements").delete().eq("id", id).select("id");
      if (error) throw error;
      if (!data || data.length === 0) {
        throw new Error("削除できませんでした。運営権限とマイグレーション0048の適用をご確認ください。");
      }
    },
    onSuccess: () => invalidateAnnouncements(qc),
  });
}
