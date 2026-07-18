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
      workId,
    }: {
      authorId: string;
      imageUrl: string;
      caption?: string;
      /** 作品・キャラタグ（任意）。みんなの投稿フィードの絞り込みに使う。 */
      workId?: string;
    }) => {
      const supabase = getSupabaseBrowserClient();
      // New posts get the highest sort (epoch ms) so they appear first.
      const { error } = await supabase.from("posts").insert({
        author_id: authorId,
        image_url: imageUrl,
        caption: caption ?? null,
        work_id: workId ?? null,
        sort: Date.now(),
      });
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

/** 投稿の作品・キャラタグを設定/解除（本人のみ）。null で「タグなし」に戻す。 */
export function useUpdatePostWork() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, workId }: { id: string; authorId: string; workId: string | null }) => {
      const supabase = getSupabaseBrowserClient();
      const { error } = await supabase.from("posts").update({ work_id: workId }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: (_d, { authorId }) => {
      qc.invalidateQueries({ queryKey: ["posts", authorId] });
      qc.invalidateQueries({ queryKey: ["posts_feed"] });
    },
  });
}

/** 表示中の投稿のうち、閲覧者がいいね済みの post_id 一覧（ハートの押下状態用）。
 * RLS で post_likes は本人の行だけ読めるので、これは「自分のいいね」だけ返す。 */
export function useMyPostLikes(viewerId: string | undefined, postIds: string[]) {
  return useQuery({
    queryKey: ["post_likes", viewerId, postIds],
    enabled: isSupabaseConfigured() && Boolean(viewerId) && postIds.length > 0,
    queryFn: async (): Promise<string[]> => {
      const supabase = getSupabaseBrowserClient();
      const { data, error } = await supabase
        .from("post_likes")
        .select("post_id")
        .eq("user_id", viewerId!)
        .in("post_id", postIds);
      if (error) throw error;
      return (data ?? []).map((r) => r.post_id as string);
    },
  });
}

/** 写真のいいねをトグル（付ける/外す）。付与時は DBトリガーが like_count 更新＋
 * 投稿者への通知（初いいねのお祝い含む）を行う。自分の投稿にはRLSで付けられない。 */
export function useTogglePostLike() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ postId, userId, liked }: { postId: string; authorId: string; userId: string; liked: boolean }) => {
      const supabase = getSupabaseBrowserClient();
      if (liked) {
        const { error } = await supabase.from("post_likes").delete().eq("post_id", postId).eq("user_id", userId);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("post_likes").insert({ post_id: postId, user_id: userId });
        if (error) throw error;
      }
    },
    onSuccess: (_d, { authorId, userId }) => {
      qc.invalidateQueries({ queryKey: ["post_likes", userId] });
      qc.invalidateQueries({ queryKey: ["posts", authorId] });
    },
  });
}

export interface FeedPost {
  id: string;
  authorId: string;
  authorHandle: string;
  authorDisplayName: string;
  authorAvatarUrl: string | null;
  imageUrl: string;
  workId: string | null;
  createdAt: string;
}

/**
 * みんなの投稿フィード（ホームのプレビュー・検索の「写真」タブ）。
 *   - 公開範囲が 'public' の投稿のみ（併せ仲間限定・非公開アカウントは
 *     posts_select RLS が自動的に除外するので、ここでの絞り込みは追加の
 *     安全側チェック）。
 *   - workId を指定すると、その作品・キャラタグの投稿だけに絞り込む。
 *   - ブロックしたユーザーの投稿はクライアント側で除外（people検索と同じ方針）。
 */
export function usePostsFeed(workId: string | undefined, blockedUserIds: string[] = []) {
  return useQuery({
    queryKey: ["posts_feed", workId ?? null, blockedUserIds],
    enabled: isSupabaseConfigured(),
    queryFn: async (): Promise<FeedPost[]> => {
      const supabase = getSupabaseBrowserClient();
      let query = supabase
        .from("posts")
        .select("id, author_id, image_url, work_id, created_at, profiles!posts_author_id_fkey(handle, display_name, avatar_url)")
        .eq("visibility", "public")
        .order("created_at", { ascending: false })
        .limit(60);
      if (workId) query = query.eq("work_id", workId);
      const { data, error } = await query;
      if (error) throw error;
      type Row = {
        id: string;
        author_id: string;
        image_url: string;
        work_id: string | null;
        created_at: string;
        profiles: { handle: string; display_name: string; avatar_url: string | null } | null;
      };
      const blocked = new Set(blockedUserIds);
      return ((data ?? []) as unknown as Row[])
        .filter((r) => !blocked.has(r.author_id))
        .map((r) => ({
          id: r.id,
          authorId: r.author_id,
          authorHandle: r.profiles?.handle ?? "",
          authorDisplayName: r.profiles?.display_name ?? "不明",
          authorAvatarUrl: r.profiles?.avatar_url ?? null,
          imageUrl: r.image_url,
          workId: r.work_id,
          createdAt: r.created_at,
        }));
    },
  });
}
