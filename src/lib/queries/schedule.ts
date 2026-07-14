"use client";

import { useEffect, useId } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { isSupabaseConfigured } from "@/lib/supabase/config";

/** ○ / △ / × */
export type ScheduleMark = "yes" | "maybe" | "no";

export interface ScheduleVote {
  userId: string;
  name: string;
  mark: ScheduleMark;
}

export interface ScheduleOption {
  id: string;
  label: string;
  isDecided: boolean;
  votes: ScheduleVote[];
}

/**
 * 併せの日程調整（候補日＋○△×回答）。候補は作成順、回答者名は profiles から
 * 別取得（inner join で行ごと落ちるのを防ぐ）。Realtime で他メンバーの回答や
 * 候補の追加・確定が即時反映される。
 */
export function useScheduleOptions(awaseId: string | null) {
  const qc = useQueryClient();
  const channelId = useId();

  useEffect(() => {
    if (!isSupabaseConfigured() || !awaseId) return;
    const supabase = getSupabaseBrowserClient();
    const invalidate = () => qc.invalidateQueries({ queryKey: ["awase_schedule", awaseId] });
    // 候補は awase_id で絞れるが votes には awase_id が無いため、両テーブルとも
    // 無条件購読で invalidate する（再取得は軽いクエリ2本のみ）。
    const channel = supabase
      .channel(`awase_schedule:${awaseId}:${channelId}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "awase_schedule_options" }, invalidate)
      .on("postgres_changes", { event: "*", schema: "public", table: "awase_schedule_votes" }, invalidate)
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [awaseId, qc, channelId]);

  return useQuery({
    queryKey: ["awase_schedule", awaseId],
    enabled: isSupabaseConfigured() && Boolean(awaseId),
    queryFn: async (): Promise<ScheduleOption[]> => {
      const supabase = getSupabaseBrowserClient();
      const { data: options, error } = await supabase
        .from("awase_schedule_options")
        .select("id, label, is_decided")
        .eq("awase_id", awaseId!)
        .order("created_at", { ascending: true });
      if (error) throw error;
      const optionRows = (options ?? []) as { id: string; label: string; is_decided: boolean }[];
      if (optionRows.length === 0) return [];

      const { data: votes, error: voteErr } = await supabase
        .from("awase_schedule_votes")
        .select("option_id, user_id, mark")
        .in("option_id", optionRows.map((o) => o.id));
      if (voteErr) throw voteErr;
      const voteRows = (votes ?? []) as { option_id: string; user_id: string; mark: ScheduleMark }[];

      // 回答者名は best-effort（取れなくても回答自体は表示する）
      const userIds = Array.from(new Set(voteRows.map((v) => v.user_id)));
      const nameById = new Map<string, string>();
      if (userIds.length > 0) {
        const { data: profs } = await supabase.from("profiles").select("id, display_name").in("id", userIds);
        for (const p of (profs ?? []) as { id: string; display_name: string }[]) {
          nameById.set(p.id, p.display_name);
        }
      }

      return optionRows.map((o) => ({
        id: o.id,
        label: o.label,
        isDecided: o.is_decided,
        votes: voteRows
          .filter((v) => v.option_id === o.id)
          .map((v) => ({ userId: v.user_id, name: nameById.get(v.user_id) ?? "不明", mark: v.mark })),
      }));
    },
  });
}

/** 候補日を追加（ホストのみ・RLSで強制）。 */
export function useAddScheduleOption() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ awaseId, label }: { awaseId: string; label: string }) => {
      const supabase = getSupabaseBrowserClient();
      const { error } = await supabase.from("awase_schedule_options").insert({ awase_id: awaseId, label });
      if (error) throw error;
    },
    onSuccess: (_d, { awaseId }) => qc.invalidateQueries({ queryKey: ["awase_schedule", awaseId] }),
  });
}

/** 候補日を削除（ホストのみ）。回答も cascade で消える。 */
export function useDeleteScheduleOption() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ optionId }: { optionId: string; awaseId: string }) => {
      const supabase = getSupabaseBrowserClient();
      const { error } = await supabase.from("awase_schedule_options").delete().eq("id", optionId);
      if (error) throw error;
    },
    onSuccess: (_d, { awaseId }) => qc.invalidateQueries({ queryKey: ["awase_schedule", awaseId] }),
  });
}

/** 「この日に確定」の付け外し（ホストのみ）。確定は同時に1件になるよう付け替える。 */
export function useDecideScheduleOption() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ optionId, awaseId, decided }: { optionId: string; awaseId: string; decided: boolean }) => {
      const supabase = getSupabaseBrowserClient();
      if (decided) {
        // 既存の確定を外してから付ける（確定は常に1件）
        const { error: clearErr } = await supabase
          .from("awase_schedule_options")
          .update({ is_decided: false })
          .eq("awase_id", awaseId)
          .eq("is_decided", true);
        if (clearErr) throw clearErr;
      }
      const { error } = await supabase
        .from("awase_schedule_options")
        .update({ is_decided: decided })
        .eq("id", optionId);
      if (error) throw error;
    },
    onSuccess: (_d, { awaseId }) => qc.invalidateQueries({ queryKey: ["awase_schedule", awaseId] }),
  });
}

/** ○△×の回答。同じマークをもう一度選ぶと取り消し（行削除）。 */
export function useCastScheduleVote() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      optionId,
      userId,
      mark,
    }: {
      optionId: string;
      userId: string;
      mark: ScheduleMark | null; // null = 取り消し
      awaseId: string;
    }) => {
      const supabase = getSupabaseBrowserClient();
      if (mark === null) {
        const { error } = await supabase
          .from("awase_schedule_votes")
          .delete()
          .eq("option_id", optionId)
          .eq("user_id", userId);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("awase_schedule_votes")
          .upsert({ option_id: optionId, user_id: userId, mark }, { onConflict: "option_id,user_id" });
        if (error) throw error;
      }
    },
    onSuccess: (_d, { awaseId }) => qc.invalidateQueries({ queryKey: ["awase_schedule", awaseId] }),
  });
}
