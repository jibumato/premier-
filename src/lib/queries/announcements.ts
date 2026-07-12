"use client";

import { useQuery } from "@tanstack/react-query";
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
