"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { readingMatch } from "@/lib/reading";
import { formatRelativeTime } from "@/lib/format";

export interface GroupListItem {
  id: string;
  name: string;
  description: string;
  work: string | null;
  region: string;
  memberCount: number;
}

/** ブロックした相手が作ったグループを一覧から除くためのフィルタ。 */
export interface GroupFilter {
  blockedUserIds: string[];
}

type GroupRow = {
  id: string;
  owner_id: string;
  name: string;
  description: string;
  region: string;
  works: { name: string } | null;
  group_members: { count: number }[];
};

const GROUP_SELECT = "id, owner_id, name, description, region, works(name), group_members(count)";

function toGroupListItem(r: GroupRow): GroupListItem {
  return {
    id: r.id,
    name: r.name,
    description: r.description,
    work: r.works?.name ?? null,
    region: r.region,
    memberCount: r.group_members?.[0]?.count ?? 0,
  };
}

/** 常設グループ（サークル）の一覧。キーワードは名前・作品名に前方/部分一致（reading対応）。 */
export function useGroups(keyword: string, filter?: GroupFilter) {
  const q = keyword.trim();
  return useQuery({
    queryKey: ["groups", q, filter?.blockedUserIds ?? []],
    enabled: isSupabaseConfigured(),
    queryFn: async (): Promise<GroupListItem[]> => {
      const supabase = getSupabaseBrowserClient();
      const { data, error } = await supabase
        .from("groups")
        .select(GROUP_SELECT)
        .order("created_at", { ascending: false })
        .limit(60);
      if (error) throw error;
      const blocked = new Set(filter?.blockedUserIds ?? []);
      let rows = ((data ?? []) as unknown as GroupRow[]).filter((r) => !blocked.has(r.owner_id));
      if (q) {
        rows = rows.filter((r) => readingMatch(q, r.name) || readingMatch(q, r.works?.name ?? ""));
      }
      return rows.slice(0, 40).map(toGroupListItem);
    },
  });
}

/** 自分が参加しているグループ（サークル画面の「参加中」）。 */
export function useMyGroups(userId: string | undefined) {
  return useQuery({
    queryKey: ["my_groups", userId],
    enabled: isSupabaseConfigured() && Boolean(userId),
    queryFn: async (): Promise<GroupListItem[]> => {
      const supabase = getSupabaseBrowserClient();
      const { data, error } = await supabase
        .from("group_members")
        .select(`groups(${GROUP_SELECT})`)
        .eq("user_id", userId!);
      if (error) throw error;
      type Row = { groups: GroupRow | null };
      return ((data ?? []) as unknown as Row[])
        .map((r) => r.groups)
        .filter((g): g is GroupRow => Boolean(g))
        .map(toGroupListItem);
    },
  });
}

export interface GroupDetail {
  id: string;
  ownerId: string;
  name: string;
  description: string;
  work: string | null;
  region: string;
  memberCount: number;
}

/** グループ詳細。 */
export function useGroup(groupId: string | null) {
  return useQuery({
    queryKey: ["group", groupId],
    enabled: isSupabaseConfigured() && Boolean(groupId),
    queryFn: async (): Promise<GroupDetail | null> => {
      const supabase = getSupabaseBrowserClient();
      const { data, error } = await supabase.from("groups").select(GROUP_SELECT).eq("id", groupId!).maybeSingle();
      if (error) throw error;
      if (!data) return null;
      const r = data as unknown as GroupRow;
      return {
        id: r.id,
        ownerId: r.owner_id,
        name: r.name,
        description: r.description,
        work: r.works?.name ?? null,
        region: r.region,
        memberCount: r.group_members?.[0]?.count ?? 0,
      };
    },
  });
}

export interface GroupMember {
  id: string;
  handle: string;
  displayName: string;
  avatarUrl: string | null;
  isVerified: boolean;
  role: string;
}

/** グループのメンバー一覧（顔ぶれ）。非公開/ブロック/停止は除外（つきまとい対策）。
 * 非公開アカウントは profiles_select RLS により本人＋フォロワー以外に返らないため
 * 自動的に一覧から外れる。 */
export function useGroupMembers(groupId: string | null, viewerId: string | undefined, blockedUserIds: string[] = []) {
  return useQuery({
    queryKey: ["group_members", groupId, viewerId, blockedUserIds],
    enabled: isSupabaseConfigured() && Boolean(groupId) && Boolean(viewerId),
    queryFn: async (): Promise<GroupMember[]> => {
      const supabase = getSupabaseBrowserClient();
      const { data, error } = await supabase
        .from("group_members")
        .select(
          "user_id, role, profiles!group_members_user_id_fkey(id, handle, display_name, avatar_url, is_verified, is_suspended)",
        )
        .eq("group_id", groupId!)
        .limit(100);
      if (error) throw error;
      type Row = {
        user_id: string;
        role: string;
        profiles: {
          id: string;
          handle: string;
          display_name: string;
          avatar_url: string | null;
          is_verified: boolean;
          is_suspended: boolean;
        } | null;
      };
      const blocked = new Set(blockedUserIds);
      return ((data ?? []) as unknown as Row[])
        .filter((r) => r.profiles && !r.profiles.is_suspended && !blocked.has(r.profiles.id))
        .sort((a, b) => (a.role === "owner" ? -1 : b.role === "owner" ? 1 : 0))
        .slice(0, 60)
        .map((r) => ({
          id: r.profiles!.id,
          handle: r.profiles!.handle,
          displayName: r.profiles!.display_name,
          avatarUrl: r.profiles!.avatar_url,
          isVerified: r.profiles!.is_verified,
          role: r.role,
        }));
    },
  });
}

/** 自分がこのグループに参加しているか。 */
export function useIsGroupMember(groupId: string | null, userId: string | undefined) {
  return useQuery({
    queryKey: ["is_group_member", groupId, userId],
    enabled: isSupabaseConfigured() && Boolean(groupId) && Boolean(userId),
    queryFn: async (): Promise<boolean> => {
      const supabase = getSupabaseBrowserClient();
      const { data, error } = await supabase
        .from("group_members")
        .select("group_id")
        .eq("group_id", groupId!)
        .eq("user_id", userId!)
        .maybeSingle();
      if (error) throw error;
      return Boolean(data);
    },
  });
}

/** グループを作成する（作成者はトリガーで owner として自動参加）。 */
export function useCreateGroup() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      ownerId,
      name,
      description,
      workId,
      region,
    }: {
      ownerId: string;
      name: string;
      description: string;
      workId: string | null;
      region: string;
    }): Promise<string> => {
      const supabase = getSupabaseBrowserClient();
      const { data, error } = await supabase
        .from("groups")
        .insert({ owner_id: ownerId, name, description, work_id: workId, region })
        .select("id")
        .single();
      if (error) throw error;
      return data.id as string;
    },
    onSuccess: (_id, { ownerId }) => {
      qc.invalidateQueries({ queryKey: ["groups"] });
      qc.invalidateQueries({ queryKey: ["my_groups", ownerId] });
    },
  });
}

/** グループに参加する（group_members_insert RLS: user_id = auth.uid() のみ）。 */
export function useJoinGroup() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ groupId, userId }: { groupId: string; userId: string }) => {
      const supabase = getSupabaseBrowserClient();
      const { error } = await supabase
        .from("group_members")
        .upsert({ group_id: groupId, user_id: userId }, { onConflict: "group_id,user_id", ignoreDuplicates: true });
      if (error) throw error;
    },
    onSuccess: (_d, { groupId, userId }) => {
      qc.invalidateQueries({ queryKey: ["group", groupId] });
      qc.invalidateQueries({ queryKey: ["is_group_member", groupId, userId] });
      qc.invalidateQueries({ queryKey: ["group_members", groupId] });
      qc.invalidateQueries({ queryKey: ["my_groups", userId] });
      qc.invalidateQueries({ queryKey: ["groups"] });
    },
  });
}

/** グループを退会する（オーナーは退会できないよう画面側でガードする）。 */
export function useLeaveGroup() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ groupId, userId }: { groupId: string; userId: string }) => {
      const supabase = getSupabaseBrowserClient();
      const { error } = await supabase.from("group_members").delete().eq("group_id", groupId).eq("user_id", userId);
      if (error) throw error;
    },
    onSuccess: (_d, { groupId, userId }) => {
      qc.invalidateQueries({ queryKey: ["group", groupId] });
      qc.invalidateQueries({ queryKey: ["is_group_member", groupId, userId] });
      qc.invalidateQueries({ queryKey: ["group_members", groupId] });
      qc.invalidateQueries({ queryKey: ["my_groups", userId] });
      qc.invalidateQueries({ queryKey: ["groups"] });
    },
  });
}

// =============================================================================
// グループ掲示板（0074 / グループV2）— メンバーだけが投稿できるグループ内の掲示板。
// 荒らし対策（メンバー限定・連投クールダウン・日次上限・スパム判定）はDB側で強制。
// =============================================================================

export interface GroupPost {
  key: string;
  authorId: string;
  authorName: string;
  authorAvatarUrl: string | null;
  body: string;
  time: string;
}

/** グループの投稿一覧（新着順）。ブロックした相手は除外する。 */
export function useGroupPosts(groupId: string | null, blockedUserIds: string[] = []) {
  return useQuery({
    queryKey: ["group_posts", groupId, blockedUserIds],
    // group_posts（0074）未適用でもグループ詳細を巻き込まないよう retry を抑制。
    retry: false,
    enabled: isSupabaseConfigured() && Boolean(groupId),
    queryFn: async (): Promise<GroupPost[]> => {
      const supabase = getSupabaseBrowserClient();
      const { data, error } = await supabase
        .from("group_posts")
        .select("id, author_id, body, created_at")
        .eq("group_id", groupId!)
        .order("created_at", { ascending: false })
        .limit(50);
      if (error) throw error;
      const blocked = new Set(blockedUserIds);
      let rows = ((data ?? []) as { id: string; author_id: string; body: string; created_at: string }[]).filter(
        (r) => !blocked.has(r.author_id),
      );
      if (rows.length === 0) return [];
      const authorIds = Array.from(new Set(rows.map((r) => r.author_id)));
      const { data: profs } = await supabase.from("profiles").select("id, display_name, avatar_url").in("id", authorIds);
      const byId = new Map(
        ((profs ?? []) as { id: string; display_name: string; avatar_url: string | null }[]).map((p) => [p.id, p]),
      );
      return rows.map((r) => ({
        key: r.id,
        authorId: r.author_id,
        authorName: byId.get(r.author_id)?.display_name ?? "不明",
        authorAvatarUrl: byId.get(r.author_id)?.avatar_url ?? null,
        body: r.body,
        time: formatRelativeTime(r.created_at),
      }));
    },
  });
}

/** 投稿エラーの日本語化（談話室と同じ: 23514=NGワード等、42501=連投/上限）。 */
export function friendlyGroupPostError(e: unknown): string {
  const err = e as { code?: string; message?: string };
  if (err?.code === "23514")
    return "投稿できませんでした。リンクや過度な繰り返し文字、不適切な表現が含まれていないか確認してください。";
  if (err?.code === "42501")
    return "投稿できませんでした。メンバーのみ投稿できます。または連続投稿・1日の上限に達した可能性があります（少し間隔をあけてください）。";
  return "投稿に失敗しました。時間をおいて再度お試しください。";
}

/** グループへ投稿する（RLSでメンバー限定・連投/上限を強制）。 */
export function useCreateGroupPost() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ groupId, authorId, body }: { groupId: string; authorId: string; body: string }) => {
      const supabase = getSupabaseBrowserClient();
      const { error } = await supabase.from("group_posts").insert({ group_id: groupId, author_id: authorId, body });
      if (error) throw error;
    },
    onSuccess: (_d, { groupId }) => qc.invalidateQueries({ queryKey: ["group_posts", groupId] }),
  });
}

/** 投稿の削除（RLSで投稿者本人 or グループのオーナーのみ）。 */
export function useDeleteGroupPost() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ postId }: { postId: string; groupId: string }) => {
      const supabase = getSupabaseBrowserClient();
      const { data, error } = await supabase.from("group_posts").delete().eq("id", postId).select("id");
      if (error) throw error;
      if (!data || data.length === 0) throw new Error("削除できませんでした");
    },
    onSuccess: (_d, { groupId }) => qc.invalidateQueries({ queryKey: ["group_posts", groupId] }),
  });
}
