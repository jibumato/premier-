"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { isSupabaseConfigured } from "@/lib/supabase/config";

/** 要望フォームのカテゴリ。DB の check 制約（0045）と揃える。 */
export type FeedbackCategory = "request" | "bug" | "other";
export type FeedbackStatus = "open" | "in_progress" | "done";

export const FEEDBACK_CATEGORY_LABELS: Record<FeedbackCategory, string> = {
  request: "要望",
  bug: "不具合",
  other: "その他",
};

export const FEEDBACK_STATUS_LABELS: Record<FeedbackStatus, string> = {
  open: "未対応",
  in_progress: "対応中",
  done: "完了",
};

/** ユーザーが運営へ要望・不具合報告を送る。RLS で本人のみ insert 可（0045）。 */
export function useSubmitFeedback() {
  return useMutation({
    mutationFn: async ({
      userId,
      category,
      body,
    }: {
      userId: string;
      category: FeedbackCategory;
      body: string;
    }) => {
      const supabase = getSupabaseBrowserClient();
      const { error } = await supabase
        .from("feedback")
        .insert({ user_id: userId, category, body });
      if (error) throw error;
    },
  });
}

// =============================================================================
// 運営（is_admin）向け: 要望の一覧とステータス消し込み。
// 閲覧・更新は RLS で is_admin() に限定（0045）。
// =============================================================================

export interface AdminFeedback {
  id: string;
  category: FeedbackCategory;
  body: string;
  status: FeedbackStatus;
  createdAt: string;
  senderName: string | null;
}

/** 管理画面用: 全フィードバックを新しい順で取得。 */
export function useAdminFeedback(enabled: boolean) {
  return useQuery({
    queryKey: ["admin_feedback"],
    enabled: isSupabaseConfigured() && enabled,
    queryFn: async (): Promise<AdminFeedback[]> => {
      const supabase = getSupabaseBrowserClient();
      const { data, error } = await supabase
        .from("feedback")
        .select("id, category, body, status, created_at, profiles(display_name)")
        .order("created_at", { ascending: false });
      if (error) throw error;
      const rows = (data ?? []) as unknown as {
        id: string;
        category: FeedbackCategory;
        body: string;
        status: FeedbackStatus;
        created_at: string;
        profiles: { display_name: string } | null;
      }[];
      return rows.map((r) => ({
        id: r.id,
        category: r.category,
        body: r.body,
        status: r.status,
        createdAt: r.created_at,
        senderName: r.profiles?.display_name ?? null,
      }));
    },
  });
}

/** ステータスの消し込み（未対応 → 対応中 → 完了）。 */
export function useUpdateFeedbackStatus() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, status }: { id: string; status: FeedbackStatus }) => {
      const supabase = getSupabaseBrowserClient();
      const { data, error } = await supabase
        .from("feedback")
        .update({ status })
        .eq("id", id)
        .select("id");
      if (error) throw error;
      // RLS 未適用などで 0 行更新のとき成功扱いにしない（events と同じ配慮）
      if (!data || data.length === 0) {
        throw new Error("更新できませんでした。マイグレーション0045の適用をご確認ください。");
      }
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin_feedback"] }),
  });
}
