"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import type { Tables, UserRole } from "@/lib/database.types";

export interface UserSearchResult {
  id: string;
  handle: string;
  displayName: string;
  avatarUrl: string | null;
  isVerified: boolean;
  role: UserRole | null;
}

/** ユーザータブの役割絞り込み。"" は絞り込みなし。 */
export type UserSearchRoleFilter = "" | "layer" | "photographer";

/**
 * 人物検索（つきまとい対策を織り込んだ「知っている人を探す」検索）。
 *   - @ユーザーネーム（handle）は前方一致で常に検索できる。
 *   - 表示名（display_name）は、本人が searchable_by_name をオンにした人だけ
 *     部分一致でヒットする（既定オフ）。
 *   - 役割（レイヤー/カメラマン）で絞り込める。role="both" の人はどちらの
 *     絞り込みでもヒットする。
 *   - キーワード未入力でも役割絞り込みが指定されていれば「見つけてもらう」
 *     一覧として動く。ただしこのブラウズは searchable_by_name をオンにした
 *     人だけが対象（オプトインしていない人はキーワードなしでは出ない）。
 *   - 非公開アカウント（is_private）は RLS(profiles_select) により本人＋
 *     フォロワー以外には返らないので、自動的に検索結果から除外される。
 *   - 自分自身・ブロックしたユーザー・停止中アカウントは除外。
 *   - ログイン必須（viewerId 必須）。キーワードは2文字以上で発火。
 */
export function useUserSearch(
  viewerId: string | undefined,
  rawQuery: string,
  blockedUserIds: string[],
  roleFilter: UserSearchRoleFilter = "",
) {
  const q = rawQuery.trim().toLowerCase();
  return useQuery({
    queryKey: ["user_search", q, viewerId, blockedUserIds, roleFilter],
    enabled: isSupabaseConfigured() && Boolean(viewerId) && (q.length >= 2 || roleFilter !== ""),
    queryFn: async (): Promise<UserSearchResult[]> => {
      // PostgREST の or()/ilike を壊す・悪用される文字を除去（英数と _ 空白のみ残す）
      const safe = q.replace(/[^\p{L}\p{N}_ ]/gu, "").trim();
      const browsing = safe.length < 2;
      if (browsing && !roleFilter) return [];
      const supabase = getSupabaseBrowserClient();
      let query = supabase
        .from("profiles")
        .select("id, handle, display_name, avatar_url, is_verified, is_suspended, role");
      if (browsing) {
        // 役割ブラウズ: 表示名検索を許可（オプトイン）した人だけを新しい順に
        query = query.eq("searchable_by_name", true).order("created_at", { ascending: false });
      } else {
        query = query.or(`handle.ilike.${safe}%,and(searchable_by_name.eq.true,display_name.ilike.%${safe}%)`);
      }
      if (roleFilter) {
        query = query.in("role", [roleFilter, "both"]);
      }
      const { data, error } = await query.limit(40);
      if (error) throw error;
      const blocked = new Set(blockedUserIds);
      type Row = {
        id: string;
        handle: string;
        display_name: string;
        avatar_url: string | null;
        is_verified: boolean;
        is_suspended: boolean;
        role: UserRole | null;
      };
      return ((data ?? []) as Row[])
        .filter((p) => p.id !== viewerId && !blocked.has(p.id) && !p.is_suspended)
        .slice(0, 20)
        .map((p) => ({
          id: p.id,
          handle: p.handle,
          displayName: p.display_name,
          avatarUrl: p.avatar_url,
          isVerified: p.is_verified,
          role: p.role,
        }));
    },
  });
}

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

/** プロフィール保存エラーを日本語の分かりやすい文言に変換。
 * 23505 = unique_violation（@ユーザーネームの重複）
 * 23514 = check_violation（@ユーザーネームの形式違反）
 * 'handle is reserved' / 'handle change cooldown active' = 0055 のトリガーが
 * 投げるメッセージ（なりすまし防止の予約語・変更クールダウン）。 */
export function friendlyProfileError(e: unknown): string {
  const err = e as { code?: string; message?: string };
  if (err?.code === "23505") return "そのユーザーネームは既に使われています。別のものをお試しください。";
  if (err?.code === "23514") return "ユーザーネームは半角英数と _ の3〜20文字で入力してください。";
  if (err?.message?.includes("handle is reserved"))
    return "そのユーザーネームは使用できません。別のものをお試しください。";
  if (err?.message?.includes("handle change cooldown active"))
    return "ユーザーネームの変更は前回の変更から14日間空ける必要があります。";
  return "保存に失敗しました。時間をおいて再度お試しください。";
}

/** Update the editable profile text fields (display name / bio / X handle /
 * @username / display-name searchability). handle は指定時のみ更新する
 * （未指定＝現状維持。空にはできない一意列のため）。 */
export function useUpdateProfileText() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      userId,
      displayName,
      bio,
      xHandle,
      handle,
      searchableByName,
    }: {
      userId: string;
      displayName: string;
      bio: string;
      /** @なしのXユーザー名。空文字なら null（未設定）で保存する。 */
      xHandle: string;
      /** @ユーザーネーム（半角英数と_の3〜20文字）。undefined なら変更しない。 */
      handle?: string;
      /** 表示名での検索を許可するか（既定オフのトグル）。 */
      searchableByName: boolean;
    }) => {
      const supabase = getSupabaseBrowserClient();
      const patch: {
        display_name: string;
        bio: string;
        x_handle: string | null;
        searchable_by_name: boolean;
        handle?: string;
      } = {
        display_name: displayName,
        bio,
        x_handle: xHandle || null,
        searchable_by_name: searchableByName,
      };
      if (handle !== undefined) patch.handle = handle;
      const { error } = await supabase.from("profiles").update(patch).eq("id", userId);
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
