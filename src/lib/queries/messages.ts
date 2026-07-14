"use client";

import { useEffect, useId } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { formatRelativeTime } from "@/lib/format";
import type { Conversation } from "@/lib/types";

export interface MessageRow {
  id: string;
  conversation_id: string;
  sender_id: string;
  body: string;
  image_url: string | null;
  created_at: string;
}

/** Conversation list for the current user (messages screen). Conversations
 * whose other participant the viewer has blocked are filtered out (Phase 5). */
export function useConversations(userId: string | undefined, blockedUserIds?: string[]) {
  return useQuery({
    queryKey: ["conversations", userId, blockedUserIds ?? []],
    enabled: isSupabaseConfigured() && Boolean(userId),
    queryFn: async (): Promise<Conversation[]> => {
      const supabase = getSupabaseBrowserClient();

      const { data: mine, error: mineErr } = await supabase
        .from("conversation_members")
        .select("conversation_id, last_read_at")
        .eq("user_id", userId!);
      if (mineErr) throw mineErr;
      let ids = (mine ?? []).map((r) => r.conversation_id as string);
      if (ids.length === 0) return [];

      const [{ data: others, error: othersErr }, { data: msgs, error: msgErr }, { data: convs, error: convErr }] =
        await Promise.all([
          supabase
            .from("conversation_members")
            .select("conversation_id, user_id, profiles(display_name)")
            .in("conversation_id", ids)
            .neq("user_id", userId!),
          supabase
            .from("messages")
            .select("conversation_id, body, image_url, created_at")
            .in("conversation_id", ids)
            .order("created_at", { ascending: false }),
          supabase.from("conversations").select("id, is_group, title").in("id", ids),
        ]);
      if (othersErr) throw othersErr;
      if (msgErr) throw msgErr;
      if (convErr) throw convErr;

      const otherRows = (others ?? []) as unknown as {
        conversation_id: string;
        user_id: string;
        profiles: { display_name: string } | null;
      }[];
      const groupMap = new Map(
        ((convs ?? []) as { id: string; is_group: boolean; title: string | null }[]).map((c) => [
          c.id,
          { isGroup: c.is_group, title: c.title },
        ]),
      );

      // Drop 1:1 conversations whose other participant is blocked
      // (group chats stay visible even if one member is blocked).
      if (blockedUserIds?.length) {
        const blocked = new Set(blockedUserIds);
        const blockedConvos = new Set(
          otherRows
            .filter((r) => blocked.has(r.user_id) && !groupMap.get(r.conversation_id)?.isGroup)
            .map((r) => r.conversation_id),
        );
        ids = ids.filter((id) => !blockedConvos.has(id));
        if (ids.length === 0) return [];
      }

      const lastReadMap = new Map((mine ?? []).map((r) => [r.conversation_id as string, r.last_read_at as string]));
      const otherNameMap = new Map(otherRows.map((r) => [r.conversation_id, r.profiles?.display_name ?? "不明"]));
      const memberCount = new Map<string, number>();
      for (const r of otherRows) memberCount.set(r.conversation_id, (memberCount.get(r.conversation_id) ?? 0) + 1);
      const lastMsgMap = new Map<string, { body: string; image_url: string | null; created_at: string }>();
      for (const m of (msgs ?? []) as { conversation_id: string; body: string; image_url: string | null; created_at: string }[]) {
        if (!lastMsgMap.has(m.conversation_id)) lastMsgMap.set(m.conversation_id, m);
      }

      return ids.map((id) => {
        const last = lastMsgMap.get(id);
        const lastReadAt = lastReadMap.get(id) ?? new Date(0).toISOString();
        const hasUnread = Boolean(last && new Date(last.created_at) > new Date(lastReadAt));
        const group = groupMap.get(id);
        const name = group?.isGroup
          ? `${group.title ?? "併せグループ"}（${(memberCount.get(id) ?? 0) + 1}人）`
          : (otherNameMap.get(id) ?? "不明");
        return {
          key: id,
          name,
          last: last ? (last.body || (last.image_url ? "📷 画像" : "")) : "",
          time: last ? formatRelativeTime(last.created_at) : "",
          unread: hasUnread ? 1 : 0,
        };
      });
    },
  });
}

/** Messages in one conversation (raw sender_id, for "me"/"them" bubble
 * alignment by the caller), kept live via Realtime. */
export function useMessages(conversationId: string | null) {
  const qc = useQueryClient();
  // Unique per hook instance so two mounts of the same conversation don't share
  // a channel topic (which would throw "cannot add postgres_changes callbacks
  // after subscribe()" on the second subscriber).
  const channelId = useId();
  const query = useQuery({
    queryKey: ["messages", conversationId],
    enabled: isSupabaseConfigured() && Boolean(conversationId),
    queryFn: async (): Promise<MessageRow[]> => {
      const supabase = getSupabaseBrowserClient();
      const { data, error } = await supabase
        .from("messages")
        .select("id, conversation_id, sender_id, body, image_url, created_at")
        .eq("conversation_id", conversationId!)
        .order("created_at", { ascending: true });
      if (error) throw error;
      return (data ?? []) as unknown as MessageRow[];
    },
  });

  useEffect(() => {
    if (!isSupabaseConfigured() || !conversationId) return;
    const supabase = getSupabaseBrowserClient();
    const channel = supabase
      .channel(`messages:${conversationId}:${channelId}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "messages", filter: `conversation_id=eq.${conversationId}` },
        () => qc.invalidateQueries({ queryKey: ["messages", conversationId] }),
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [conversationId, qc, channelId]);

  return query;
}

export function useSendMessage() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      conversationId,
      senderId,
      body,
      imageUrl,
    }: {
      conversationId: string;
      senderId: string;
      body: string;
      /** 画像付き送信（本文は空でも可）。R2 の公開URL。 */
      imageUrl?: string | null;
    }) => {
      const supabase = getSupabaseBrowserClient();
      const { error } = await supabase
        .from("messages")
        .insert({ conversation_id: conversationId, sender_id: senderId, body, image_url: imageUrl ?? null });
      if (error) throw error;
    },
    onSuccess: (_d, { conversationId }) => {
      qc.invalidateQueries({ queryKey: ["messages", conversationId] });
      qc.invalidateQueries({ queryKey: ["conversations"] });
    },
  });
}

/** Finds the existing 1:1 conversation with `otherUserId`, or creates one.
 * The find-or-create runs entirely in a SECURITY DEFINER RPC (0026) so it is
 * atomic and bypasses the row-by-row RLS check that made the old client-side
 * two-row member insert fail. `userId` is accepted for call-site compatibility
 * but is derived from auth.uid() server-side. */
export function useGetOrCreateConversation() {
  return useMutation({
    mutationFn: async ({
      otherUserId,
      awaseId,
    }: {
      userId?: string;
      otherUserId: string;
      awaseId?: string;
    }): Promise<string> => {
      const supabase = getSupabaseBrowserClient();
      const { data, error } = await supabase.rpc("create_direct_conversation", {
        p_other: otherUserId,
        p_awase: awaseId ?? null,
      });
      if (error) throw error;
      return data as string;
    },
  });
}

/** Marks a conversation as read for the current user (resets the unread badge). */
export function useMarkConversationRead() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ conversationId, userId }: { conversationId: string; userId: string }) => {
      const supabase = getSupabaseBrowserClient();
      const { error } = await supabase
        .from("conversation_members")
        .update({ last_read_at: new Date().toISOString() })
        .eq("conversation_id", conversationId)
        .eq("user_id", userId);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["conversations"] }),
  });
}

/** 併せのグループチャットを開く（無ければ作成）。主催者か承認済み応募者のみ。
 * サーバー側 RPC（0033）が主催＋承認済みメンバーを揃えて会話IDを返す。 */
export function useAwaseGroupChat() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ awaseId }: { awaseId: string }): Promise<string> => {
      const supabase = getSupabaseBrowserClient();
      const { data, error } = await supabase.rpc("get_or_create_awase_group_chat", { p_awase: awaseId });
      if (error) throw error;
      return data as string;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["conversations"] }),
  });
}

export interface ConversationMeta {
  isGroup: boolean;
  title: string | null;
  /** conversation members (including self) — id → display name */
  memberNames: Map<string, string>;
}

/** 会話のメタ情報（グループ判定・タイトル・メンバー名）。グループチャットの
 * ヘッダー表示と、発言者名の表示に使う。 */
export function useConversationMeta(conversationId: string | null) {
  return useQuery({
    queryKey: ["conversation_meta", conversationId],
    enabled: isSupabaseConfigured() && Boolean(conversationId),
    queryFn: async (): Promise<ConversationMeta> => {
      const supabase = getSupabaseBrowserClient();
      const [{ data: conv, error: convErr }, { data: members, error: memErr }] = await Promise.all([
        supabase.from("conversations").select("is_group, title").eq("id", conversationId!).maybeSingle(),
        supabase
          .from("conversation_members")
          .select("user_id, profiles(display_name)")
          .eq("conversation_id", conversationId!),
      ]);
      if (convErr) throw convErr;
      if (memErr) throw memErr;
      const rows = (members ?? []) as unknown as { user_id: string; profiles: { display_name: string } | null }[];
      return {
        isGroup: Boolean((conv as { is_group?: boolean } | null)?.is_group),
        title: ((conv as { title?: string | null } | null)?.title ?? null) as string | null,
        memberNames: new Map(rows.map((r) => [r.user_id, r.profiles?.display_name ?? "不明"])),
      };
    },
  });
}

/** The other participant's `last_read_at` for a 1:1 conversation, kept live via
 * Realtime. Used to show a LINE-style 「既読」 marker on the current user's
 * messages that the other person has already seen. Returns null until read. */
export function useOtherReadAt(conversationId: string | null, userId: string | undefined) {
  const qc = useQueryClient();
  const channelId = useId();
  const query = useQuery({
    queryKey: ["conv_read", conversationId, userId],
    enabled: isSupabaseConfigured() && Boolean(conversationId) && Boolean(userId),
    queryFn: async (): Promise<string | null> => {
      const supabase = getSupabaseBrowserClient();
      const { data, error } = await supabase
        .from("conversation_members")
        .select("last_read_at")
        .eq("conversation_id", conversationId!)
        .neq("user_id", userId!)
        .order("last_read_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      if (error) throw error;
      return (data?.last_read_at as string | undefined) ?? null;
    },
  });

  useEffect(() => {
    if (!isSupabaseConfigured() || !conversationId || !userId) return;
    const supabase = getSupabaseBrowserClient();
    const channel = supabase
      .channel(`conv_read:${conversationId}:${channelId}`)
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "conversation_members", filter: `conversation_id=eq.${conversationId}` },
        () => qc.invalidateQueries({ queryKey: ["conv_read", conversationId, userId] }),
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [conversationId, userId, qc, channelId]);

  return query;
}
