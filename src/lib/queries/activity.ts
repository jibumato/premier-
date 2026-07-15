"use client";

import { useEffect, useId } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { isSupabaseConfigured } from "@/lib/supabase/config";

export interface ActivityEvent {
  id: string;
  kind: "awase_created" | "review_posted" | "event_rsvp";
  headline: string;
  createdAt: string;
}

/**
 * ホームの「最近のうごき」ティッカー用。併せの新規募集・レビュー投稿・イベント
 * 参加表明を、個人情報を含まない一行見出しで新しい順に取得し、Realtime で
 * 新着を即座に反映する（activity_events は 0046 で作成・publish_at 未到来の
 * 併せは記録されない）。
 */
export function useRecentActivity(limit = 8) {
  const qc = useQueryClient();
  const channelId = useId();
  const query = useQuery({
    queryKey: ["activity_events", limit],
    enabled: isSupabaseConfigured(),
    queryFn: async (): Promise<ActivityEvent[]> => {
      const supabase = getSupabaseBrowserClient();
      const { data, error } = await supabase
        .from("activity_events")
        .select("id, kind, headline, created_at")
        .order("created_at", { ascending: false })
        .limit(limit);
      if (error) throw error;
      return ((data ?? []) as { id: string; kind: string; headline: string; created_at: string }[]).map((r) => ({
        id: r.id,
        kind: r.kind as ActivityEvent["kind"],
        headline: r.headline,
        createdAt: r.created_at,
      }));
    },
  });

  useEffect(() => {
    if (!isSupabaseConfigured()) return;
    const supabase = getSupabaseBrowserClient();
    const channel = supabase
      .channel(`activity_events:${channelId}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "activity_events" },
        () => qc.invalidateQueries({ queryKey: ["activity_events", limit] }),
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [qc, channelId, limit]);

  return query;
}

export interface TrendingWork {
  workId: string;
  name: string;
  awaseCount: number;
}

/** 直近7日で新規募集が多い作品（急上昇作品）。trending_works() RPC（0046）。 */
export function useTrendingWorks(days = 7, limit = 6) {
  return useQuery({
    queryKey: ["trending_works", days, limit],
    enabled: isSupabaseConfigured(),
    queryFn: async (): Promise<TrendingWork[]> => {
      const supabase = getSupabaseBrowserClient();
      const { data, error } = await supabase.rpc("trending_works", { p_days: days, p_limit: limit });
      if (error) throw error;
      return ((data ?? []) as { work_id: string; name: string; awase_count: number }[]).map((r) => ({
        workId: r.work_id,
        name: r.name,
        awaseCount: r.awase_count,
      }));
    },
  });
}

/** 今日の新着件数（併せ募集・イベント参加表明）。ホームの小さなカウンター用。 */
export function useTodayStats() {
  return useQuery({
    queryKey: ["today_stats"],
    enabled: isSupabaseConfigured(),
    queryFn: async (): Promise<{ newAwase: number; newRsvps: number }> => {
      const supabase = getSupabaseBrowserClient();
      const todayStart = new Date();
      todayStart.setHours(0, 0, 0, 0);
      const iso = todayStart.toISOString();
      const [awaseRes, rsvpRes] = await Promise.all([
        supabase.from("awase").select("id", { count: "exact", head: true }).gte("created_at", iso),
        supabase.from("event_rsvps").select("event_id", { count: "exact", head: true }).gte("created_at", iso),
      ]);
      if (awaseRes.error) throw awaseRes.error;
      if (rsvpRes.error) throw rsvpRes.error;
      return { newAwase: awaseRes.count ?? 0, newRsvps: rsvpRes.count ?? 0 };
    },
  });
}
