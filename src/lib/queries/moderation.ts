"use client";

import { useMutation, useQuery } from "@tanstack/react-query";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { isSupabaseConfigured } from "@/lib/supabase/config";

export type ReportTargetType = "user" | "awase" | "market" | "qa";

/** Submit a report. The DB-side trigger auto-hides content once distinct
 * reporters cross the threshold — there is no manual review queue. */
export function useSubmitReport() {
  return useMutation({
    mutationFn: async ({
      reporterId,
      targetType,
      targetId,
      reason,
      detail,
    }: {
      reporterId: string;
      targetType: ReportTargetType;
      targetId: string;
      reason: string;
      detail: string;
    }) => {
      const supabase = getSupabaseBrowserClient();
      const { error } = await supabase.from("reports").upsert(
        {
          reporter_id: reporterId,
          target_type: targetType,
          target_id: targetId,
          reason,
          detail: detail || null,
        },
        { onConflict: "reporter_id,target_type,target_id" },
      );
      if (error) throw error;
    },
  });
}

/** Block another user (idempotent). */
export function useBlockUser() {
  return useMutation({
    mutationFn: async ({ blockerId, blockedId }: { blockerId: string; blockedId: string }) => {
      const supabase = getSupabaseBrowserClient();
      const { error } = await supabase
        .from("blocks")
        .upsert({ blocker_id: blockerId, blocked_id: blockedId }, { onConflict: "blocker_id,blocked_id" });
      if (error) throw error;
    },
  });
}

/**
 * IDs the viewer should not see: users they've blocked, plus content the
 * report-threshold trigger has auto-hidden. Used by the awase feed to filter
 * blocked hosts and flagged 併せ. Returns empty sets when unconfigured/signed out.
 */
export function useModerationFilter(viewerId: string | undefined) {
  return useQuery({
    queryKey: ["moderation_filter", viewerId],
    enabled: isSupabaseConfigured() && Boolean(viewerId),
    queryFn: async (): Promise<{ blockedUserIds: string[]; hiddenAwaseIds: string[] }> => {
      const supabase = getSupabaseBrowserClient();
      const [{ data: blocks, error: blocksErr }, { data: flags, error: flagsErr }] = await Promise.all([
        supabase.from("blocks").select("blocked_id").eq("blocker_id", viewerId!),
        supabase.from("content_flags").select("target_id").eq("target_type", "awase").eq("auto_hidden", true),
      ]);
      if (blocksErr) throw blocksErr;
      if (flagsErr) throw flagsErr;
      return {
        blockedUserIds: (blocks ?? []).map((b) => b.blocked_id as string),
        hiddenAwaseIds: (flags ?? []).map((f) => f.target_id as string),
      };
    },
  });
}
