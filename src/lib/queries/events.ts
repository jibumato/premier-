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
    },
  });
}
