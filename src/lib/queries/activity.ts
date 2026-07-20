"use client";

import { useEffect, useId } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { isSupabaseConfigured } from "@/lib/supabase/config";

export interface ActivityEvent {
  id: string;
  kind: "awase_created" | "review_posted" | "event_rsvp";
  headline: string;
  createdAt: string;
}

export const ACTIVITY_KIND_LABELS: Record<ActivityEvent["kind"], string> = {
  awase_created: "併せ募集",
  review_posted: "レビュー",
  event_rsvp: "参加表明",
};

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

export interface WeeklyDigest {
  awase: number;
  groups: number;
  reviews: number;
  posts: number;
  total: number;
}

/**
 * 「今週のプルミエ」ダイジェスト（運営生存感）。直近7日でプラットフォームに
 * 生まれたものを種類別に数える。凍結した老舗（更新が止まった競合）との差＝
 * 「いまも動いている」を、ファーストビューで一目で伝えるための指標。
 *
 * 各テーブルの count を独立に集計し、未適用マイグレーション等で一部が落ちても
 * その種類を 0 として続行する（allSettled）。=1つの失敗でホームを壊さない。
 */
export function useWeeklyDigest() {
  return useQuery({
    queryKey: ["weekly_digest"],
    enabled: isSupabaseConfigured(),
    staleTime: 5 * 60 * 1000,
    queryFn: async (): Promise<WeeklyDigest> => {
      const supabase = getSupabaseBrowserClient();
      const since = new Date();
      since.setDate(since.getDate() - 7);
      const iso = since.toISOString();
      const countSince = async (
        table: "awase" | "groups" | "event_reviews" | "posts",
        col = "created_at",
      ): Promise<number> => {
        const { count, error } = await supabase
          .from(table)
          .select("*", { count: "exact", head: true })
          .gte(col, iso);
        if (error) throw error;
        return count ?? 0;
      };
      const [awase, groups, reviews, posts] = await Promise.all([
        countSince("awase").catch(() => 0),
        countSince("groups").catch(() => 0),
        countSince("event_reviews").catch(() => 0),
        countSince("posts").catch(() => 0),
      ]);
      return { awase, groups, reviews, posts, total: awase + groups + reviews + posts };
    },
  });
}

// =============================================================================
// 運営（is_admin）向け: 「最近のうごき」の一覧・個別削除・古い行の一括整理。
// 削除は RLS で is_admin() に限定（0047）。行の内容自体はトリガー生成のみで
// 運営でも書き換えできない（insert/update ポリシーは無い）。
// =============================================================================

/** 管理画面用: 直近の行を新しい順で取得（公開側より多めに、最大100件）。 */
export function useAdminActivity(enabled: boolean, limit = 100) {
  return useQuery({
    queryKey: ["admin_activity_events", limit],
    enabled: isSupabaseConfigured() && enabled,
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
}

function invalidateActivity(qc: ReturnType<typeof useQueryClient>) {
  qc.invalidateQueries({ queryKey: ["admin_activity_events"] });
  qc.invalidateQueries({ queryKey: ["activity_events"] });
}

/** 個別の行を削除（誤った/不適切な見出しの削除用）。 */
export function useDeleteActivityEvent() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id }: { id: string }) => {
      const supabase = getSupabaseBrowserClient();
      const { data, error } = await supabase.from("activity_events").delete().eq("id", id).select("id");
      if (error) throw error;
      if (!data || data.length === 0) {
        throw new Error("削除できませんでした。マイグレーション0047の適用をご確認ください。");
      }
    },
    onSuccess: () => invalidateActivity(qc),
  });
}

/** 指定日数より古い行をまとめて削除（表の肥大化対策）。削除件数を返す。 */
export function useCleanupOldActivity() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ olderThanDays }: { olderThanDays: number }): Promise<number> => {
      const supabase = getSupabaseBrowserClient();
      const cutoff = new Date();
      cutoff.setDate(cutoff.getDate() - olderThanDays);
      const { data, error } = await supabase
        .from("activity_events")
        .delete()
        .lt("created_at", cutoff.toISOString())
        .select("id");
      if (error) throw error;
      return data?.length ?? 0;
    },
    onSuccess: () => invalidateActivity(qc),
  });
}
