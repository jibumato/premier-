"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import type { Tables, UserRole } from "@/lib/database.types";

/** Fetch a single profile row (the signed-in user, or any public profile). */
export function useProfile(userId: string | undefined) {
  return useQuery({
    queryKey: ["profile", userId],
    enabled: Boolean(userId),
    queryFn: async (): Promise<Tables<"profiles"> | null> => {
      const supabase = getSupabaseBrowserClient();
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", userId!)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  });
}

/** Persist the onboarding role selection (8a) onto the profile. */
export function useUpdateProfileRole() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ userId, role }: { userId: string; role: UserRole }) => {
      const supabase = getSupabaseBrowserClient();
      const { error } = await supabase.from("profiles").update({ role }).eq("id", userId);
      if (error) throw error;
    },
    onSuccess: (_data, { userId }) =>
      qc.invalidateQueries({ queryKey: ["profile", userId] }),
  });
}
