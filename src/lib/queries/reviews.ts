"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { isSupabaseConfigured } from "@/lib/supabase/config";

export interface ReviewRow {
  id: string;
  author_id: string;
  target_id: string;
  awase_id: string | null;
  rating: number;
  good_points: string[];
  comment: string | null;
  created_at: string;
  author_name: string;
}

export interface ConversationInfo {
  otherUserId: string;
  otherName: string;
  awaseId: string | null;
  awaseTitle: string | null;
  awaseDate: string | null;
}

/** Resolves the other participant + related awase for a conversation — used
 * for both the chat header and the review target (chat's "レビュー" button). */
export function useConversationInfo(conversationId: string | null, currentUserId: string | undefined) {
  return useQuery({
    queryKey: ["conversation_info", conversationId, currentUserId],
    enabled: isSupabaseConfigured() && Boolean(conversationId) && Boolean(currentUserId),
    queryFn: async (): Promise<ConversationInfo> => {
      const supabase = getSupabaseBrowserClient();
      const [{ data: member, error: memberErr }, { data: conv, error: convErr }] = await Promise.all([
        supabase
          .from("conversation_members")
          .select("user_id, profiles(display_name)")
          .eq("conversation_id", conversationId!)
          .neq("user_id", currentUserId!)
          .maybeSingle(),
        supabase
          .from("conversations")
          .select("awase_id, awase(title, event_date)")
          .eq("id", conversationId!)
          .maybeSingle(),
      ]);
      if (memberErr) throw memberErr;
      if (convErr) throw convErr;
      const otherRow = member as unknown as { user_id: string; profiles: { display_name: string } | null } | null;
      const convRow = conv as unknown as {
        awase_id: string | null;
        awase: { title: string; event_date: string } | null;
      } | null;
      return {
        otherUserId: otherRow?.user_id ?? "",
        otherName: otherRow?.profiles?.display_name ?? "不明",
        awaseId: convRow?.awase_id ?? null,
        awaseTitle: convRow?.awase?.title ?? null,
        awaseDate: convRow?.awase?.event_date ?? null,
      };
    },
  });
}

/** Average rating + list of reviews received by a user (profile page). */
export function useReviewsReceived(userId: string | undefined) {
  return useQuery({
    queryKey: ["reviews_received", userId],
    enabled: isSupabaseConfigured() && Boolean(userId),
    queryFn: async (): Promise<{ average: number; count: number; reviews: ReviewRow[] }> => {
      const supabase = getSupabaseBrowserClient();
      const { data, error } = await supabase
        .from("reviews")
        .select(
          "id, author_id, target_id, awase_id, rating, good_points, comment, created_at, profiles!reviews_author_id_fkey(display_name)",
        )
        .eq("target_id", userId!)
        .order("created_at", { ascending: false });
      if (error) throw error;
      const rows = (data ?? []) as unknown as (Omit<ReviewRow, "author_name"> & {
        profiles: { display_name: string } | null;
      })[];
      const reviews = rows.map((r) => ({ ...r, author_name: r.profiles?.display_name ?? "不明" }));
      const count = reviews.length;
      const average = count ? reviews.reduce((sum, r) => sum + r.rating, 0) / count : 0;
      return { average, count, reviews };
    },
  });
}

/** Posts (or edits, per the one-review-per-relationship unique constraint) a
 * review. RLS's `has_confirmed_participation` check is the real gate — this
 * mutation just surfaces its rejection as a normal error. */
export function useCreateReview() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      authorId,
      targetId,
      awaseId,
      rating,
      goodPoints,
      comment,
    }: {
      authorId: string;
      targetId: string;
      awaseId: string | null;
      rating: number;
      goodPoints: string[];
      comment: string;
    }) => {
      const supabase = getSupabaseBrowserClient();
      const { error } = await supabase.from("reviews").upsert(
        {
          author_id: authorId,
          target_id: targetId,
          awase_id: awaseId,
          rating,
          good_points: goodPoints,
          comment,
        },
        { onConflict: "author_id,target_id,awase_id" },
      );
      if (error) throw error;
    },
    onSuccess: (_d, { targetId }) => qc.invalidateQueries({ queryKey: ["reviews_received", targetId] }),
  });
}
