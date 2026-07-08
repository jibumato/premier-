"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import type { Tables } from "@/lib/database.types";

/** All selectable works (home chips / create form / onboarding 8b). */
export function useWorks() {
  return useQuery({
    queryKey: ["works"],
    queryFn: async (): Promise<Tables<"works">[]> => {
      const supabase = getSupabaseBrowserClient();
      const { data, error } = await supabase.from("works").select("*").order("name");
      if (error) throw error;
      return data ?? [];
    },
  });
}

/** Work IDs the given user follows (onboarding 8b state). */
export function useFollowedWorks(userId: string | undefined) {
  return useQuery({
    queryKey: ["work_follows", userId],
    enabled: Boolean(userId),
    queryFn: async (): Promise<string[]> => {
      const supabase = getSupabaseBrowserClient();
      const { data, error } = await supabase
        .from("work_follows")
        .select("work_id")
        .eq("user_id", userId!);
      if (error) throw error;
      return (data ?? []).map((r) => r.work_id);
    },
  });
}

/** Replace the user's followed-works set with `workIds` (idempotent upsert). */
export function useFollowWorks() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ userId, workIds }: { userId: string; workIds: string[] }) => {
      const supabase = getSupabaseBrowserClient();
      const rows = workIds.map((work_id) => ({ user_id: userId, work_id }));
      const { error } = await supabase.from("work_follows").upsert(rows);
      if (error) throw error;
    },
    onSuccess: (_data, { userId }) =>
      qc.invalidateQueries({ queryKey: ["work_follows", userId] }),
  });
}
