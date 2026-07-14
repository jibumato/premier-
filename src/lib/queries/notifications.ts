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
      const { data, error } = await supabase
        .from("notifications")
        .select("id, type, body, entity_id, is_read, created_at")
        .eq("user_id", userId!)
        .order("created_at", { ascending: false })
        .limit(30);
      if (error) throw error;
      return ((data ?? []) as unknown as NotificationRow[]).map((n) => ({
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
