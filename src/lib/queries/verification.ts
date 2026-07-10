"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { isSupabaseConfigured } from "@/lib/supabase/config";

export type VerificationStatus = "none" | "pending" | "approved" | "rejected";

/** The signed-in user's latest verification request status (manual review). */
export function useLatestVerification(userId: string | undefined) {
  return useQuery({
    queryKey: ["verification", userId],
    enabled: isSupabaseConfigured() && Boolean(userId),
    queryFn: async (): Promise<{ status: VerificationStatus; note: string | null }> => {
      const supabase = getSupabaseBrowserClient();
      const { data, error } = await supabase
        .from("verification_requests")
        .select("status, note")
        .eq("user_id", userId!)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      if (error) throw error;
      if (!data) return { status: "none", note: null };
      return { status: data.status as VerificationStatus, note: data.note };
    },
  });
}

/** Submit a new verification request with an uploaded ID document URL. */
export function useSubmitVerification() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ userId, docUrl }: { userId: string; docUrl: string }) => {
      const supabase = getSupabaseBrowserClient();
      const { error } = await supabase
        .from("verification_requests")
        .insert({ user_id: userId, doc_url: docUrl });
      if (error) throw error;
    },
    onSuccess: (_d, { userId }) => qc.invalidateQueries({ queryKey: ["verification", userId] }),
  });
}
