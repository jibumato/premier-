"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { isSupabaseConfigured } from "@/lib/supabase/config";

export interface PendingVerification {
  requestId: string;
  userId: string;
  displayName: string;
  handle: string;
  docUrl: string;
  createdAt: string;
}

/** 保留中の本人確認申請一覧（運営のみ）。SECURITY DEFINER 関数が呼び出し元の
 * is_admin をチェックするため、運営以外が呼ぶとエラーになる。 */
export function usePendingVerifications(enabled: boolean) {
  return useQuery({
    queryKey: ["admin_pending_verifications"],
    enabled: isSupabaseConfigured() && enabled,
    queryFn: async (): Promise<PendingVerification[]> => {
      const supabase = getSupabaseBrowserClient();
      const { data, error } = await supabase.rpc("admin_list_pending_verifications");
      if (error) throw error;
      type Row = {
        request_id: string;
        user_id: string;
        display_name: string;
        handle: string;
        doc_url: string;
        created_at: string;
      };
      return ((data ?? []) as Row[]).map((r) => ({
        requestId: r.request_id,
        userId: r.user_id,
        displayName: r.display_name,
        handle: r.handle,
        docUrl: r.doc_url,
        createdAt: r.created_at,
      }));
    },
  });
}

/** 承認（運営のみ）。バッジ付与＋任意で年齢確認も true に。 */
export function useApproveVerification() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ requestId, ageVerified }: { requestId: string; ageVerified: boolean }) => {
      const supabase = getSupabaseBrowserClient();
      const { error } = await supabase.rpc("admin_approve_verification", {
        p_request_id: requestId,
        p_age_verified: ageVerified,
      });
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin_pending_verifications"] }),
  });
}

/** 却下（運営のみ）。理由メモを添える。 */
export function useRejectVerification() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ requestId, note }: { requestId: string; note: string }) => {
      const supabase = getSupabaseBrowserClient();
      const { error } = await supabase.rpc("admin_reject_verification", {
        p_request_id: requestId,
        p_note: note || null,
      });
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin_pending_verifications"] }),
  });
}
