"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { isSupabaseConfigured } from "@/lib/supabase/config";

export interface EventListItem {
  key: string;
  name: string;
  date: string;
  venue: string;
  region: string;
  going: number;
  tag: string;
  /** 並べ替え・近日判定用の開始日 (YYYY-MM-DD)。未設定なら null。 */
  startsOn: string | null;
  /** サムネイル画像URL（許諾を得た画像のみ）。無ければ生成デザインで表示。 */
  imageUrl: string | null;
}

export interface EventDetail {
  id: string;
  name: string;
  date: string;
  venue: string;
  region: string;
  tag: string;
  feeText: string | null;
  body: string | null;
  going: number;
  imageUrl: string | null;
}

/** Event calendar list, with real RSVP counts. */
export function useEvents() {
  return useQuery({
    queryKey: ["events"],
    enabled: isSupabaseConfigured(),
    queryFn: async (): Promise<EventListItem[]> => {
      const supabase = getSupabaseBrowserClient();
      const { data, error } = await supabase
        .from("events")
        .select("id, name, event_date, venue, region, tag, starts_on, image_url, event_rsvps(count)")
        .order("starts_on", { ascending: true, nullsFirst: false })
        .order("created_at", { ascending: true });
      if (error) throw error;
      const rows = (data ?? []) as unknown as {
        id: string;
        name: string;
        event_date: string;
        venue: string;
        region: string;
        tag: string;
        starts_on: string | null;
        image_url: string | null;
        event_rsvps: { count: number }[];
      }[];
      return rows.map((r) => ({
        key: r.id,
        name: r.name,
        date: r.event_date,
        venue: r.venue,
        region: r.region,
        going: r.event_rsvps?.[0]?.count ?? 0,
        tag: r.tag,
        startsOn: r.starts_on,
        imageUrl: r.image_url,
      }));
    },
  });
}

/** Single event (detail screen), with real RSVP count. */
export function useEvent(eventId: string | null) {
  return useQuery({
    queryKey: ["event", eventId],
    enabled: isSupabaseConfigured() && Boolean(eventId),
    queryFn: async (): Promise<EventDetail | null> => {
      const supabase = getSupabaseBrowserClient();
      const { data, error } = await supabase
        .from("events")
        .select("id, name, event_date, venue, region, tag, fee_text, body, image_url, event_rsvps(count)")
        .eq("id", eventId!)
        .maybeSingle();
      if (error) throw error;
      if (!data) return null;
      const row = data as unknown as {
        id: string;
        name: string;
        event_date: string;
        venue: string;
        region: string;
        tag: string;
        fee_text: string | null;
        body: string | null;
        image_url: string | null;
        event_rsvps: { count: number }[];
      };
      return {
        id: row.id,
        name: row.name,
        date: row.event_date,
        venue: row.venue,
        region: row.region,
        tag: row.tag,
        feeText: row.fee_text,
        body: row.body,
        going: row.event_rsvps?.[0]?.count ?? 0,
        imageUrl: row.image_url,
      };
    },
  });
}

/** Whether the current user has already RSVP'd to this event. */
export function useIsGoing(eventId: string | null, userId: string | undefined) {
  return useQuery({
    queryKey: ["event_rsvp", eventId, userId],
    enabled: isSupabaseConfigured() && Boolean(eventId) && Boolean(userId),
    queryFn: async (): Promise<boolean> => {
      const supabase = getSupabaseBrowserClient();
      const { data, error } = await supabase
        .from("event_rsvps")
        .select("event_id")
        .eq("event_id", eventId!)
        .eq("user_id", userId!)
        .maybeSingle();
      if (error) throw error;
      return Boolean(data);
    },
  });
}

/**
 * 「行ってみたい」（参加表明より軽い興味表明）の人数。
 * イベント本体の取得（useEvent）とは分離した独立クエリにしている。こうすることで、
 * 万一 event_interests テーブルが未作成（マイグレーション未適用）でも、この count が
 * 失敗するだけで済み、イベント詳細本体の表示は壊れない（0件として扱う）。
 */
export function useInterestedCount(eventId: string | null) {
  return useQuery({
    queryKey: ["event_interest_count", eventId],
    enabled: isSupabaseConfigured() && Boolean(eventId),
    // テーブル未作成でも詳細画面を巻き込まないよう、リトライは抑制する。
    retry: false,
    queryFn: async (): Promise<number> => {
      const supabase = getSupabaseBrowserClient();
      const { count, error } = await supabase
        .from("event_interests")
        .select("*", { count: "exact", head: true })
        .eq("event_id", eventId!);
      if (error) throw error;
      return count ?? 0;
    },
  });
}

/** 「行ってみたい」（参加表明より軽い興味表明）を既に登録済みか。 */
export function useIsInterested(eventId: string | null, userId: string | undefined) {
  return useQuery({
    queryKey: ["event_interest", eventId, userId],
    enabled: isSupabaseConfigured() && Boolean(eventId) && Boolean(userId),
    // テーブル未作成でも詳細画面を巻き込まないよう、リトライは抑制する。
    retry: false,
    queryFn: async (): Promise<boolean> => {
      const supabase = getSupabaseBrowserClient();
      const { data, error } = await supabase
        .from("event_interests")
        .select("event_id")
        .eq("event_id", eventId!)
        .eq("user_id", userId!)
        .maybeSingle();
      if (error) throw error;
      return Boolean(data);
    },
  });
}

export interface MyEvent {
  id: string;
  name: string;
  date: string;
  venue: string;
  region: string;
  startsOn: string | null;
  imageUrl: string | null;
}

/**
 * 本人が参加表明した「これから開催の」イベント（マイページの参加予定セクション）。
 * event_rsvps_select は誰でも読めるが、この用途では user_id = 本人だけを引く。
 * 過去のイベントは除外し、開催日の近い順に並べる。
 */
export function useMyUpcomingEvents(userId: string | undefined) {
  return useQuery({
    queryKey: ["my_rsvp_events", userId],
    enabled: isSupabaseConfigured() && Boolean(userId),
    queryFn: async (): Promise<MyEvent[]> => {
      const supabase = getSupabaseBrowserClient();
      const { data, error } = await supabase
        .from("event_rsvps")
        .select("events(id, name, event_date, venue, region, starts_on, image_url)")
        .eq("user_id", userId!);
      if (error) throw error;
      type Row = {
        events: {
          id: string;
          name: string;
          event_date: string;
          venue: string;
          region: string;
          starts_on: string | null;
          image_url: string | null;
        } | null;
      };
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      return ((data ?? []) as unknown as Row[])
        .map((r) => r.events)
        .filter((e): e is NonNullable<Row["events"]> => Boolean(e))
        .filter((e) => !e.starts_on || new Date(e.starts_on) >= today)
        .sort((a, b) => (a.starts_on ?? "9999-12-31").localeCompare(b.starts_on ?? "9999-12-31"))
        .map((e) => ({
          id: e.id,
          name: e.name,
          date: e.event_date,
          venue: e.venue,
          region: e.region,
          startsOn: e.starts_on,
          imageUrl: e.image_url,
        }));
    },
  });
}

export interface EventAttendee {
  id: string;
  handle: string;
  displayName: string;
  avatarUrl: string | null;
  isVerified: boolean;
}

/**
 * イベントの参加予定ユーザー（顔ぶれ）。つきまとい対策として:
 *   - ログイン必須（viewerId 必須）。人数は別途 going で誰にでも公開する。
 *   - 非公開アカウント（is_private）は profiles_select RLS により本人＋フォロワー
 *     以外には profiles が null で返るため、自動的に一覧から除外される。
 *   - 停止中アカウント・自分がブロックしたユーザーも除外。
 */
export function useEventAttendees(
  eventId: string | null,
  viewerId: string | undefined,
  blockedUserIds: string[] = [],
) {
  return useQuery({
    queryKey: ["event_attendees", eventId, viewerId, blockedUserIds],
    enabled: isSupabaseConfigured() && Boolean(eventId) && Boolean(viewerId),
    queryFn: async (): Promise<EventAttendee[]> => {
      const supabase = getSupabaseBrowserClient();
      const { data, error } = await supabase
        .from("event_rsvps")
        .select(
          "user_id, profiles!event_rsvps_user_id_fkey(id, handle, display_name, avatar_url, is_verified, is_suspended)",
        )
        .eq("event_id", eventId!)
        .limit(60);
      if (error) throw error;
      type Row = {
        user_id: string;
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
        .map((r) => r.profiles)
        .filter((p): p is NonNullable<Row["profiles"]> => Boolean(p) && !p!.is_suspended && !blocked.has(p!.id))
        .slice(0, 30)
        .map((p) => ({
          id: p.id,
          handle: p.handle,
          displayName: p.display_name,
          avatarUrl: p.avatar_url,
          isVerified: p.is_verified,
        }));
    },
  });
}

export function useRsvpEvent() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ eventId, userId }: { eventId: string; userId: string }) => {
      const supabase = getSupabaseBrowserClient();
      const { error } = await supabase
        .from("event_rsvps")
        .upsert({ event_id: eventId, user_id: userId }, { onConflict: "event_id,user_id", ignoreDuplicates: true });
      if (error) throw error;
    },
    onSuccess: (_d, { eventId, userId }) => {
      qc.invalidateQueries({ queryKey: ["event", eventId] });
      qc.invalidateQueries({ queryKey: ["event_rsvp", eventId, userId] });
      qc.invalidateQueries({ queryKey: ["events"] });
      qc.invalidateQueries({ queryKey: ["my_rsvp_events", userId] });
      qc.invalidateQueries({ queryKey: ["event_attendees", eventId] });
    },
  });
}

/** 参加表明の取り消し（event_rsvps_delete RLS: user_id = auth.uid() のみ許可）。 */
export function useCancelRsvp() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ eventId, userId }: { eventId: string; userId: string }) => {
      const supabase = getSupabaseBrowserClient();
      const { error } = await supabase.from("event_rsvps").delete().eq("event_id", eventId).eq("user_id", userId);
      if (error) throw error;
    },
    onSuccess: (_d, { eventId, userId }) => {
      qc.invalidateQueries({ queryKey: ["event", eventId] });
      qc.invalidateQueries({ queryKey: ["event_rsvp", eventId, userId] });
      qc.invalidateQueries({ queryKey: ["events"] });
      qc.invalidateQueries({ queryKey: ["my_rsvp_events", userId] });
      qc.invalidateQueries({ queryKey: ["event_attendees", eventId] });
    },
  });
}

/** 「行ってみたい」の登録（event_interests_insert RLS: user_id = auth.uid() のみ許可）。 */
export function useInterestEvent() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ eventId, userId }: { eventId: string; userId: string }) => {
      const supabase = getSupabaseBrowserClient();
      const { error } = await supabase
        .from("event_interests")
        .upsert({ event_id: eventId, user_id: userId }, { onConflict: "event_id,user_id", ignoreDuplicates: true });
      if (error) throw error;
    },
    onSuccess: (_d, { eventId, userId }) => {
      qc.invalidateQueries({ queryKey: ["event_interest_count", eventId] });
      qc.invalidateQueries({ queryKey: ["event_interest", eventId, userId] });
    },
  });
}

/** 「行ってみたい」の取り消し（event_interests_delete RLS: user_id = auth.uid() のみ許可）。 */
export function useCancelInterest() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ eventId, userId }: { eventId: string; userId: string }) => {
      const supabase = getSupabaseBrowserClient();
      const { error } = await supabase.from("event_interests").delete().eq("event_id", eventId).eq("user_id", userId);
      if (error) throw error;
    },
    onSuccess: (_d, { eventId, userId }) => {
      qc.invalidateQueries({ queryKey: ["event_interest_count", eventId] });
      qc.invalidateQueries({ queryKey: ["event_interest", eventId, userId] });
    },
  });
}

// =============================================================================
// 運営（is_admin）向け: イベントのサムネイル画像を管理する。
// 書き込み（update）は RLS で is_admin() に限定（0044）。行の作成・削除は
// SQL Editor（サービスロール）のみ ＝ ここでは image_url の差し替えだけができる。
// =============================================================================

/** 管理画面用の行（サムネイルの有無と基本情報だけ）。 */
export interface AdminEvent {
  id: string;
  name: string;
  date: string;
  venue: string;
  region: string;
  tag: string;
  imageUrl: string | null;
}

/** 管理画面用: 全イベントを開催日順で取得（サムネ設定の対象一覧）。 */
export function useAdminEvents(enabled: boolean) {
  return useQuery({
    queryKey: ["admin_events"],
    enabled: isSupabaseConfigured() && enabled,
    queryFn: async (): Promise<AdminEvent[]> => {
      const supabase = getSupabaseBrowserClient();
      const { data, error } = await supabase
        .from("events")
        .select("id, name, event_date, venue, region, tag, image_url")
        .order("starts_on", { ascending: true, nullsFirst: false })
        .order("created_at", { ascending: true });
      if (error) throw error;
      return ((data ?? []) as {
        id: string;
        name: string;
        event_date: string;
        venue: string;
        region: string;
        tag: string;
        image_url: string | null;
      }[]).map((r) => ({
        id: r.id,
        name: r.name,
        date: r.event_date,
        venue: r.venue,
        region: r.region,
        tag: r.tag,
        imageUrl: r.image_url,
      }));
    },
  });
}

/** イベントのサムネイル画像URLを設定／解除する（null で解除＝生成デザインに戻る）。 */
export function useSetEventImage() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ eventId, imageUrl }: { eventId: string; imageUrl: string | null }) => {
      const supabase = getSupabaseBrowserClient();
      // .select() で更新できた行を返してもらう。RLS で更新が許可されていないと
      // Postgres はエラーではなく「0行更新」になり、error は null のまま成功扱いに
      // なってしまう（＝設定しても何も変わらない）。0行なら明示的にエラーにして、
      // 運営に「マイグレーション0044（events_admin_update）未適用 or 運営権限なし」を
      // 気づけるようにする。
      const { data, error } = await supabase
        .from("events")
        .update({ image_url: imageUrl })
        .eq("id", eventId)
        .select("id");
      if (error) throw error;
      if (!data || data.length === 0) {
        throw new Error(
          "サムネイルを更新できませんでした。運営アカウントで、マイグレーション0044（events_admin_update）が適用済みかご確認ください。",
        );
      }
    },
    onSuccess: (_d, { eventId }) => {
      qc.invalidateQueries({ queryKey: ["admin_events"] });
      qc.invalidateQueries({ queryKey: ["events"] });
      qc.invalidateQueries({ queryKey: ["event", eventId] });
    },
  });
}
