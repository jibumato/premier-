"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
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

export interface ModerationFilter {
  blockedUserIds: string[];
  hiddenAwaseIds: string[];
  hiddenMarketIds: string[];
  hiddenQaIds: string[];
}

/**
 * IDs the viewer should not see: users they've blocked, plus content the
 * report-threshold trigger has auto-hidden. Applied across the awase feed,
 * marketplace, Q&A, and message list to filter blocked users and flagged
 * content. Returns empty sets when unconfigured/signed out.
 */
export function useModerationFilter(viewerId: string | undefined) {
  return useQuery({
    queryKey: ["moderation_filter", viewerId],
    enabled: isSupabaseConfigured() && Boolean(viewerId),
    queryFn: async (): Promise<ModerationFilter> => {
      const supabase = getSupabaseBrowserClient();
      const [{ data: blocks, error: blocksErr }, { data: flags, error: flagsErr }] = await Promise.all([
        supabase.from("blocks").select("blocked_id").eq("blocker_id", viewerId!),
        supabase.from("content_flags").select("target_type, target_id").eq("auto_hidden", true),
      ]);
      if (blocksErr) throw blocksErr;
      if (flagsErr) throw flagsErr;
      const flagsFor = (type: string) =>
        (flags ?? []).filter((f) => f.target_type === type).map((f) => f.target_id as string);
      return {
        blockedUserIds: (blocks ?? []).map((b) => b.blocked_id as string),
        hiddenAwaseIds: flagsFor("awase"),
        hiddenMarketIds: flagsFor("market"),
        hiddenQaIds: flagsFor("qa"),
      };
    },
  });
}

// =============================================================================
// 運営（is_admin）向け: 違反アカウントの検索・通報確認・停止/解除（0049）。
// reports は本人しか閲覧できない（RLS）ため、運営向けの一覧・検索・停止/解除は
// すべて SECURITY DEFINER 関数経由（関数内で is_admin() を確認）。
// =============================================================================

export interface AdminProfileResult {
  id: string;
  handle: string;
  displayName: string;
  avatarUrl: string | null;
  isVerified: boolean;
  isAdmin: boolean;
  isSuspended: boolean;
  suspensionReason: string | null;
  suspendedAt: string | null;
  reportCount: number;
}

/** ハンドル/表示名でユーザーを検索（宛通報件数つき）。運営の停止対象探しに使う。 */
export function useAdminSearchProfiles(query: string, enabled: boolean) {
  return useQuery({
    queryKey: ["admin_search_profiles", query],
    enabled: isSupabaseConfigured() && enabled && query.trim().length > 0,
    queryFn: async (): Promise<AdminProfileResult[]> => {
      const supabase = getSupabaseBrowserClient();
      const { data, error } = await supabase.rpc("admin_search_profiles", { p_query: query.trim(), p_limit: 20 });
      if (error) throw error;
      return (data ?? []).map((r) => ({
        id: r.id,
        handle: r.handle,
        displayName: r.display_name,
        avatarUrl: r.avatar_url,
        isVerified: r.is_verified,
        isAdmin: r.is_admin,
        isSuspended: r.is_suspended,
        suspensionReason: r.suspension_reason,
        suspendedAt: r.suspended_at,
        reportCount: r.report_count,
      }));
    },
  });
}

export interface AdminUserReport {
  id: string;
  reporterName: string;
  reason: string;
  detail: string | null;
  createdAt: string;
}

/** 指定ユーザー宛に届いた通報一覧（通報者名つき）。停止判断の材料に使う。 */
export function useAdminUserReports(userId: string | null, enabled: boolean) {
  return useQuery({
    queryKey: ["admin_user_reports", userId],
    enabled: isSupabaseConfigured() && enabled && Boolean(userId),
    queryFn: async (): Promise<AdminUserReport[]> => {
      const supabase = getSupabaseBrowserClient();
      const { data, error } = await supabase.rpc("admin_list_user_reports", { p_user_id: userId! });
      if (error) throw error;
      return (data ?? []).map((r) => ({
        id: r.id,
        reporterName: r.reporter_name,
        reason: r.reason,
        detail: r.detail,
        createdAt: r.created_at,
      }));
    },
  });
}

/** アカウントを停止する（is_admin() 限定・自分自身は不可。RPCが検証する）。 */
export function useSuspendUser() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ userId, reason }: { userId: string; reason: string }) => {
      const supabase = getSupabaseBrowserClient();
      const { error } = await supabase.rpc("admin_suspend_user", { p_user_id: userId, p_reason: reason });
      if (error) throw error;
    },
    onSuccess: (_d, { userId }) => {
      qc.invalidateQueries({ queryKey: ["admin_search_profiles"] });
      qc.invalidateQueries({ queryKey: ["profile", userId] });
    },
  });
}

/** アカウントの停止を解除する（is_admin() 限定）。 */
export function useReinstateUser() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ userId }: { userId: string }) => {
      const supabase = getSupabaseBrowserClient();
      const { error } = await supabase.rpc("admin_reinstate_user", { p_user_id: userId });
      if (error) throw error;
    },
    onSuccess: (_d, { userId }) => {
      qc.invalidateQueries({ queryKey: ["admin_search_profiles"] });
      qc.invalidateQueries({ queryKey: ["profile", userId] });
    },
  });
}
