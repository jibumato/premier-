"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { deleteUploadedImage } from "@/lib/queries/upload";
import type { Tables } from "@/lib/database.types";

/** A user's post gallery (profile screen), in manual order (sort desc). */
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
        .order("sort", { ascending: false });
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
      // New posts get the highest sort (epoch ms) so they appear first.
      const { error } = await supabase
        .from("posts")
        .insert({ author_id: authorId, image_url: imageUrl, caption: caption ?? null, sort: Date.now() });
      if (error) throw error;
    },
    onSuccess: (_d, { authorId }) => qc.invalidateQueries({ queryKey: ["posts", authorId] }),
  });
}

/** Delete one of the current user's posts (and its underlying R2 image file). */
export function useDeletePost() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, imageUrl }: { id: string; authorId: string; imageUrl?: string | null }) => {
      // Remove the underlying file first so a "delete" truly deletes the image,
      // not just the DB reference. Best-effort — never blocks the row delete.
      await deleteUploadedImage(imageUrl);
      const supabase = getSupabaseBrowserClient();
      const { error } = await supabase.from("posts").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: (_d, { authorId }) => qc.invalidateQueries({ queryKey: ["posts", authorId] }),
  });
}

/**
 * Reorder a user's gallery. `orderedIds` is the desired display order
 * (first = shown first). Writes a descending `sort` so the order sticks.
 */
export function useReorderPosts() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ orderedIds }: { authorId: string; orderedIds: string[] }) => {
      const supabase = getSupabaseBrowserClient();
      const base = Date.now();
      // Each id gets a unique, descending sort value (first = highest).
      await Promise.all(
        orderedIds.map((id, i) => supabase.from("posts").update({ sort: base - i }).eq("id", id)),
      );
    },
    onSuccess: (_d, { authorId }) => qc.invalidateQueries({ queryKey: ["posts", authorId] }),
  });
}

/** 投稿単位の公開範囲を切替（本人のみ）。'awase' は併せ仲間だけが閲覧可（RLSで担保）。 */
export function useUpdatePostVisibility() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, visibility }: { id: string; authorId: string; visibility: "public" | "awase" }) => {
      const supabase = getSupabaseBrowserClient();
      const { error } = await supabase.from("posts").update({ visibility }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: (_d, { authorId }) => qc.invalidateQueries({ queryKey: ["posts", authorId] }),
  });
}
