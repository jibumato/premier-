"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { readingKey } from "@/lib/reading";
import type { Tables } from "@/lib/database.types";

/** All selectable works (home chips / create form / onboarding 8b), あいうえお順。
 *
 * name 順（＝文字コード順）では漢字が読み順にならないため、reading（かな）を
 * readingKey で正規化した値で並べ替える。reading 未設定（0040 未適用や新規作品）
 * は name にフォールバック。select("*") なので reading 列が無くても壊れない。 */
export function useWorks() {
  return useQuery({
    queryKey: ["works"],
    enabled: isSupabaseConfigured(),
    queryFn: async (): Promise<Tables<"works">[]> => {
      const supabase = getSupabaseBrowserClient();
      const { data, error } = await supabase.from("works").select("*");
      if (error) throw error;
      const rows = (data ?? []) as Tables<"works">[];
      return rows.sort((a, b) => {
        const ka = readingKey(a.reading || a.name);
        const kb = readingKey(b.reading || b.name);
        return ka < kb ? -1 : ka > kb ? 1 : 0;
      });
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
