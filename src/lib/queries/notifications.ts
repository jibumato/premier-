"use client";

import { useEffect, useId } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { formatRelativeTime } from "@/lib/format";
import type { Notification } from "@/lib/types";

interface NotificationRow {
  id: string;
  type: string;
  body: string;
  entity_id: string | null;
  is_read: boolean;
  created_at: string;
}

/** ユーザーが設定でON/OFFできる通知カテゴリ（重要通知は含めない＝常に届く）。 */
export type NotificationPrefCategory = "event" | "social";

/** 通知タイプ→カテゴリ。"important"（併せの応募・メッセージ・本人確認）は
 * 設定でミュートできず常に届く。event/social はユーザーが切り替えられる。 */
export function notificationCategory(type: string): NotificationPrefCategory | "important" {
  switch (type) {
    case "event_reminder":
    case "review_nudge":
      return "event";
    case "follow":
    case "like":
    case "post":
      return "social";
    default:
      // application / message / badge など重要通知
      return "important";
  }
}

/** 通知設定（profiles.notification_prefs）に照らして、この通知を届けるか。
 * オプトアウト方式: キーが無ければ届く。false のときだけミュート。 */
export function isNotificationAllowed(type: string, prefs: Record<string, boolean> | null | undefined): boolean {
  const cat = notificationCategory(type);
  if (cat === "important") return true;
  return prefs?.[cat] !== false;
}

/** The current user's notifications, kept live via Realtime. */
export function useNotifications(userId: string | undefined) {
  const qc = useQueryClient();
  // Unique per hook instance: the same user's notifications are subscribed from
  // several places at once (bell badge in BottomNav + Sidebar, plus NotifyScreen).
  // Supabase reuses a channel by topic name, so a shared name makes the 2nd+
  // subscriber throw "cannot add postgres_changes callbacks after subscribe()".
  const channelId = useId();
  const query = useQuery({
    queryKey: ["notifications", userId],
    enabled: isSupabaseConfigured() && Boolean(userId),
    queryFn: async (): Promise<Notification[]> => {
      const supabase = getSupabaseBrowserClient();
      // 通知本体と、本人の通知設定（ミュート種別）を並行取得。設定でOFFにした
      // 種別は一覧からもバッジ（未読数）からも除外する（両ナビが同じデータを使う）。
      const [notifs, prof] = await Promise.all([
        supabase
          .from("notifications")
          .select("id, type, body, entity_id, is_read, created_at")
          .eq("user_id", userId!)
          .order("created_at", { ascending: false })
          .limit(30),
        supabase.from("profiles").select("notification_prefs").eq("id", userId!).maybeSingle(),
      ]);
      if (notifs.error) throw notifs.error;
      const prefs = (prof.data?.notification_prefs ?? null) as Record<string, boolean> | null;
      return ((notifs.data ?? []) as unknown as NotificationRow[])
        .filter((n) => isNotificationAllowed(n.type, prefs))
        .map((n) => ({
          key: n.id,
          text: n.body,
          time: formatRelativeTime(n.created_at),
          unread: !n.is_read,
          kind: n.type,
          entityId: n.entity_id,
        }));
    },
  });

  useEffect(() => {
    if (!isSupabaseConfigured() || !userId) return;
    const supabase = getSupabaseBrowserClient();
    const channel = supabase
      .channel(`notifications:${userId}:${channelId}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "notifications", filter: `user_id=eq.${userId}` },
        () => qc.invalidateQueries({ queryKey: ["notifications", userId] }),
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId, qc, channelId]);

  return query;
}

/** Marks every notification as read (called when the notify screen opens). */
export function useMarkNotificationsRead() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (userId: string) => {
      const supabase = getSupabaseBrowserClient();
      const { error } = await supabase
        .from("notifications")
        .update({ is_read: true })
        .eq("user_id", userId)
        .eq("is_read", false);
      if (error) throw error;
    },
    onSuccess: (_d, userId) => qc.invalidateQueries({ queryKey: ["notifications", userId] }),
  });
}
