"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { readingMatch } from "@/lib/reading";

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
