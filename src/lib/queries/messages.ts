"use client";

import { useEffect } from "react";
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
  created_at: string;
}

/** Conversation list for the current user (messages screen). */
export function useConversations(userId: string | undefined) {
  return useQuery({
    queryKey: ["conversations", userId],
    enabled: isSupabaseConfigured() && Boolean(userId),
    queryFn: async (): Promise<Conversation[]> => {
      const supabase = getSupabaseBrowserClient();

      const { data: mine, error: mineErr } = await supabase
        .from("conversation_members")
        .select("conversation_id, last_read_at")
        .eq("user_id", userId!);
      if (mineErr) throw mineErr;
      const ids = (mine ?? []).map((r) => r.conversation_id as string);
      if (ids.length === 0) return [];

      const [{ data: others, error: othersErr }, { data: msgs, error: msgErr }] = await Promise.all([
        supabase
          .from("conversation_members")
          .select("conversation_id, profiles(display_name)")
          .in("conversation_id", ids)
          .neq("user_id", userId!),
        supabase
          .from("messages")
          .select("conversation_id, body, created_at")
          .in("conversation_id", ids)
          .order("created_at", { ascending: false }),
      ]);
      if (othersErr) throw othersErr;
      if (msgErr) throw msgErr;

      const lastReadMap = new Map((mine ?? []).map((r) => [r.conversation_id as string, r.last_read_at as string]));
      const otherNameMap = new Map(
        ((others ?? []) as unknown as { conversation_id: string; profiles: { display_name: string } | null }[]).map(
          (r) => [r.conversation_id, r.profiles?.display_name ?? "不明"],
        ),
      );
      const lastMsgMap = new Map<string, { body: string; created_at: string }>();
      for (const m of (msgs ?? []) as { conversation_id: string; body: string; created_at: string }[]) {
        if (!lastMsgMap.has(m.conversation_id)) lastMsgMap.set(m.conversation_id, m);
      }

      return ids.map((id) => {
        const last = lastMsgMap.get(id);
        const lastReadAt = lastReadMap.get(id) ?? new Date(0).toISOString();
        const hasUnread = Boolean(last && new Date(last.created_at) > new Date(lastReadAt));
        return {
          key: id,
          name: otherNameMap.get(id) ?? "不明",
          last: last?.body ?? "",
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
  const query = useQuery({
    queryKey: ["messages", conversationId],
    enabled: isSupabaseConfigured() && Boolean(conversationId),
    queryFn: async (): Promise<MessageRow[]> => {
      const supabase = getSupabaseBrowserClient();
      const { data, error } = await supabase
        .from("messages")
        .select("id, conversation_id, sender_id, body, created_at")
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
      .channel(`messages:${conversationId}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "messages", filter: `conversation_id=eq.${conversationId}` },
        () => qc.invalidateQueries({ queryKey: ["messages", conversationId] }),
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [conversationId, qc]);

  return query;
}

export function useSendMessage() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      conversationId,
      senderId,
      body,
    }: {
      conversationId: string;
      senderId: string;
      body: string;
    }) => {
      const supabase = getSupabaseBrowserClient();
      const { error } = await supabase.from("messages").insert({ conversation_id: conversationId, sender_id: senderId, body });
      if (error) throw error;
    },
    onSuccess: (_d, { conversationId }) => {
      qc.invalidateQueries({ queryKey: ["messages", conversationId] });
      qc.invalidateQueries({ queryKey: ["conversations"] });
    },
  });
}

/** Finds the existing 1:1 conversation with `otherUserId`, or creates one. */
export function useGetOrCreateConversation() {
  return useMutation({
    mutationFn: async ({
      userId,
      otherUserId,
      awaseId,
    }: {
      userId: string;
      otherUserId: string;
      awaseId?: string;
    }): Promise<string> => {
      const supabase = getSupabaseBrowserClient();
      const { data: existing, error: findErr } = await supabase.rpc("find_direct_conversation", {
        user_a: userId,
        user_b: otherUserId,
      });
      if (findErr) throw findErr;
      if (existing) return existing as string;

      const { data: conv, error: convErr } = await supabase
        .from("conversations")
        .insert({ awase_id: awaseId ?? null })
        .select("id")
        .single();
      if (convErr) throw convErr;

      const { error: memErr } = await supabase
        .from("conversation_members")
        .insert([
          { conversation_id: conv.id, user_id: userId },
          { conversation_id: conv.id, user_id: otherUserId },
        ]);
      if (memErr) throw memErr;
      return conv.id as string;
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
