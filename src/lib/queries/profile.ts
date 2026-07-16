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

/** 設定「非公開アカウント」の保存。profiles.is_private を更新する（RLSで本人のみ）。
 * true にするとプロフィールが本人＋フォロワー以外から見えなくなる（0001 の
 * profiles_select ポリシー）。 */
export function useUpdatePrivacy() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ userId, isPrivate }: { userId: string; isPrivate: boolean }) => {
      const supabase = getSupabaseBrowserClient();
      const { error } = await supabase.from("profiles").update({ is_private: isPrivate }).eq("id", userId);
      if (error) throw error;
    },
    onSuccess: (_d, { userId }) => qc.invalidateQueries({ queryKey: ["profile", userId] }),
  });
}

/** 自分（viewer）が target をフォローしているか。 */
export function useIsFollowing(viewerId: string | undefined, targetId: string | undefined) {
  return useQuery({
    queryKey: ["is_following", viewerId, targetId],
    enabled: Boolean(viewerId) && Boolean(targetId) && viewerId !== targetId,
    queryFn: async (): Promise<boolean> => {
      const supabase = getSupabaseBrowserClient();
      const { data, error } = await supabase
        .from("follows")
        .select("follower_id")
        .eq("follower_id", viewerId!)
        .eq("followee_id", targetId!)
        .maybeSingle();
      if (error) throw error;
      return Boolean(data);
    },
  });
}

/** フォロー/フォロー解除（RLSで自分の行のみ）。フォロー時は相手に通知が入る（0041）。 */
export function useToggleFollow() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      viewerId,
      targetId,
      following,
    }: {
      viewerId: string;
      targetId: string;
      /** 現在フォロー中か（true なら解除する） */
      following: boolean;
    }) => {
      const supabase = getSupabaseBrowserClient();
      if (following) {
        const { error } = await supabase
          .from("follows")
          .delete()
          .eq("follower_id", viewerId)
          .eq("followee_id", targetId);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("follows")
          .upsert({ follower_id: viewerId, followee_id: targetId }, { ignoreDuplicates: true });
        if (error) throw error;
      }
    },
    onSuccess: (_d, { viewerId, targetId }) => {
      qc.invalidateQueries({ queryKey: ["is_following", viewerId, targetId] });
      qc.invalidateQueries({ queryKey: ["follower_count", targetId] });
    },
  });
}

/** Number of followers (profile stats bar). */
export function useFollowerCount(userId: string | undefined) {
  return useQuery({
    queryKey: ["follower_count", userId],
    enabled: Boolean(userId),
    queryFn: async (): Promise<number> => {
      const supabase = getSupabaseBrowserClient();
      const { count, error } = await supabase
        .from("follows")
        .select("*", { count: "exact", head: true })
        .eq("followee_id", userId!);
      if (error) throw error;
      return count ?? 0;
    },
  });
}

/**
 * 併せ実績: awase hosted + awase applied to with an accepted/done outcome.
 * A simple proxy count (not a dedicated stats table) — good enough for the
 * profile stat tile; revisit once "done" is a real post-event workflow step.
 */
export function useAwaseAchievementCount(userId: string | undefined) {
  return useQuery({
    queryKey: ["awase_achievement_count", userId],
    enabled: Boolean(userId),
    queryFn: async (): Promise<number> => {
      const supabase = getSupabaseBrowserClient();
      const [hosted, participated] = await Promise.all([
        supabase.from("awase").select("*", { count: "exact", head: true }).eq("host_id", userId!),
        supabase
          .from("awase_applications")
          .select("*", { count: "exact", head: true })
          .eq("applicant_id", userId!)
          .in("status", ["accepted", "done"]),
      ]);
      if (hosted.error) throw hosted.error;
      if (participated.error) throw participated.error;
      return (hosted.count ?? 0) + (participated.count ?? 0);
    },
  });
}

/** Update the editable profile text fields (display name / bio / X handle). */
export function useUpdateProfileText() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      userId,
      displayName,
      bio,
      xHandle,
    }: {
      userId: string;
      displayName: string;
      bio: string;
      /** @なしのXユーザー名。空文字なら null（未設定）で保存する。 */
      xHandle: string;
    }) => {
      const supabase = getSupabaseBrowserClient();
      const { error } = await supabase
        .from("profiles")
        .update({ display_name: displayName, bio, x_handle: xHandle || null })
        .eq("id", userId);
      if (error) throw error;
    },
    onSuccess: (_data, { userId }) => qc.invalidateQueries({ queryKey: ["profile", userId] }),
  });
}

/** Persist a newly uploaded avatar/cover image onto the profile. */
export function useUpdateProfileImage() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      userId,
      field,
      url,
    }: {
      userId: string;
      field: "avatar_url" | "cover_url";
      url: string;
    }) => {
      const supabase = getSupabaseBrowserClient();
      const patch = field === "avatar_url" ? { avatar_url: url } : { cover_url: url };
      const { error } = await supabase.from("profiles").update(patch).eq("id", userId);
      if (error) throw error;
    },
    onSuccess: (_data, { userId }) => qc.invalidateQueries({ queryKey: ["profile", userId] }),
  });
}
