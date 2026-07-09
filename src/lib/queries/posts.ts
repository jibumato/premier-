"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import type { Tables } from "@/lib/database.types";

/** A user's post gallery (profile screen), newest first. */
export function usePosts(userId: string | undefined) {
  return useQuery({
    queryKey: ["posts", userId],
    enabled: isSupabaseConfigured() && Boolean(userId),
    queryFn: async (): Promise<Tables<"posts">[]> => {
      const supabase = getSupabaseBrowserClient();
      const { data, error } = await supabase
        .from("posts")
        .select("*")
        .eq("author_id", userId!)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });
}

export function useCreatePost() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      authorId,
      imageUrl,
      caption,
    }: {
      authorId: string;
      imageUrl: string;
      caption?: string;
    }) => {
      const supabase = getSupabaseBrowserClient();
      const { error } = await supabase
        .from("posts")
        .insert({ author_id: authorId, image_url: imageUrl, caption: caption ?? null });
      if (error) throw error;
    },
    onSuccess: (_d, { authorId }) => qc.invalidateQueries({ queryKey: ["posts", authorId] }),
  });
}
