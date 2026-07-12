"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { deleteUploadedKey } from "@/lib/queries/upload";
import type { AwaseCard, DetailRole, SearchResult } from "@/lib/types";

/** Row shape returned by the awase list queries below (embeds work name). */
type AwaseRow = {
  id: string;
  host_id: string;
  title: string;
  event_date: string;
  place: string | null;
  region: string;
  world_tags: string[];
  women_only: boolean;
  beginner_ok: boolean;
  capacity: number | null;
  works: { name: string } | null;
};

const AWASE_LIST_SELECT =
  "id, host_id, title, event_date, place, region, world_tags, women_only, beginner_ok, capacity, works(name)";

/** Blocked hosts + auto-hidden 併せ to keep out of the feeds (Phase 5). */
export interface AwaseFeedFilter {
  blockedUserIds: string[];
  hiddenAwaseIds: string[];
}

function applyFilter(rows: AwaseRow[], filter?: AwaseFeedFilter): AwaseRow[] {
  if (!filter) return rows;
  const blocked = new Set(filter.blockedUserIds);
  const hidden = new Set(filter.hiddenAwaseIds);
  return rows.filter((r) => !blocked.has(r.host_id) && !hidden.has(r.id));
}

/** Simple, deterministic tag derived from the flags — refine once designers spec more tag combos. */
function tagFor(row: Pick<AwaseRow, "women_only" | "beginner_ok">): string {
  if (row.women_only) return "女性限定";
  if (row.beginner_ok) return "初心者歓迎";
  return "参加者募集中";
}

function toAwaseCard(row: AwaseRow): AwaseCard {
  return {
    key: row.id,
    title: row.title,
    work: row.works?.name ?? "オリジナル",
    tag: tagFor(row),
    date: row.event_date,
    place: row.place ?? "",
    members: row.capacity ? `定員${row.capacity}名` : "参加者募集中",
  };
}

function toSearchResult(row: AwaseRow): SearchResult {
  return {
    key: row.id,
    title: row.title,
    work: row.works?.name ?? "オリジナル",
    world: row.world_tags[0] ?? "",
    region: row.region,
    date: row.event_date,
    members: row.capacity ? `定員${row.capacity}名` : "募集中",
    womenOnly: row.women_only,
  };
}

/** Latest open 併せ for the home feed. Blocked hosts / auto-hidden 併せ are
 * filtered out when a viewer's moderation filter is supplied (Phase 5). */
export function useAwaseFeed(filter?: AwaseFeedFilter) {
  return useQuery({
    queryKey: ["awase_feed", filter?.blockedUserIds ?? [], filter?.hiddenAwaseIds ?? []],
    enabled: isSupabaseConfigured(),
    queryFn: async (): Promise<AwaseCard[]> => {
      const supabase = getSupabaseBrowserClient();
      const { data, error } = await supabase
        .from("awase")
        .select(AWASE_LIST_SELECT)
        .eq("status", "open")
        .order("created_at", { ascending: false })
        .limit(10);
      if (error) throw error;
      // PostgREST's generated types over-widen embedded array columns (e.g.
      // world_tags); the shape at runtime matches AwaseRow.
      return applyFilter((data ?? []) as unknown as AwaseRow[], filter).map(toAwaseCard);
    },
  });
}

/** Filters for the search screen: region ("すべて" = all), a free-text keyword
 * (matched against the 併せ title), and a women-only toggle. */
export interface AwaseSearchOptions {
  region: string;
  keyword?: string;
  womenOnly?: boolean;
}

/** Open 併せ filtered by region / keyword / women-only, for the search screen. */
export function useAwaseSearch(opts: AwaseSearchOptions, filter?: AwaseFeedFilter) {
  const { region, keyword, womenOnly } = opts;
  const kw = keyword?.trim() ?? "";
  return useQuery({
    queryKey: ["awase_search", region, kw, Boolean(womenOnly), filter?.blockedUserIds ?? [], filter?.hiddenAwaseIds ?? []],
    enabled: isSupabaseConfigured(),
    queryFn: async (): Promise<SearchResult[]> => {
      const supabase = getSupabaseBrowserClient();
      let query = supabase.from("awase").select(AWASE_LIST_SELECT).eq("status", "open");
      if (region !== "すべて") query = query.eq("region", region);
      if (womenOnly) query = query.eq("women_only", true);
      // Keyword matches the 併せ title (case-insensitive). Titles usually carry
      // the work/character name, so this covers the "作品・キャラで探す" flow.
      if (kw) query = query.ilike("title", `%${kw}%`);
      const { data, error } = await query.order("created_at", { ascending: false });
      if (error) throw error;
      return applyFilter((data ?? []) as unknown as AwaseRow[], filter).map(toSearchResult);
    },
  });
}

export interface AwaseDetail {
  id: string;
  title: string;
  body: string | null;
  event_date: string;
  place: string | null;
  region: string;
  fee_text: string | null;
  women_only: boolean;
  beginner_ok: boolean;
  capacity: number | null;
  world_tags: string[];
  host_id: string;
  works: { name: string } | null;
  profiles: { display_name: string; is_verified: boolean } | null;
}

/** A single awase's detail fields, for the detail screen. */
export function useAwase(awaseId: string | null) {
  return useQuery({
    queryKey: ["awase", awaseId],
    enabled: isSupabaseConfigured() && Boolean(awaseId),
    queryFn: async (): Promise<AwaseDetail> => {
      const supabase = getSupabaseBrowserClient();
      const { data, error } = await supabase
        .from("awase")
        .select(
          "id, title, body, event_date, place, region, fee_text, women_only, beginner_ok, capacity, world_tags, host_id, works(name), profiles(display_name, is_verified)",
        )
        .eq("id", awaseId!)
        .single();
      if (error) throw error;
      return data as unknown as AwaseDetail;
    },
  });
}

interface UpdateAwaseInput {
  awaseId: string;
  title: string;
  eventDate: string;
  region: string;
  place: string | null;
  feeText: string | null;
  body: string | null;
  capacity: number | null;
  womenOnly: boolean;
  beginnerOk: boolean;
  worldTags: string[];
}

/** Edit an existing 併せ (host only — enforced by the awase_update RLS policy). */
export function useUpdateAwase() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: UpdateAwaseInput) => {
      const supabase = getSupabaseBrowserClient();
      const { error } = await supabase
        .from("awase")
        .update({
          title: input.title,
          event_date: input.eventDate,
          region: input.region,
          place: input.place,
          fee_text: input.feeText,
          body: input.body,
          capacity: input.capacity,
          women_only: input.womenOnly,
          beginner_ok: input.beginnerOk,
          world_tags: input.worldTags,
        })
        .eq("id", input.awaseId);
      if (error) throw error;
    },
    onSuccess: (_d, { awaseId }) => {
      qc.invalidateQueries({ queryKey: ["awase", awaseId] });
      qc.invalidateQueries({ queryKey: ["awase_feed"] });
      qc.invalidateQueries({ queryKey: ["awase_search"] });
    },
  });
}

/** Delete a 併せ (host only). Cascades to roles/applications/images; also
 * best-effort removes the images' R2 files so a delete truly deletes them. */
export function useDeleteAwase() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ awaseId }: { awaseId: string }) => {
      const supabase = getSupabaseBrowserClient();
      const { data: imgs } = await supabase
        .from("awase_images")
        .select("storage_path")
        .eq("awase_id", awaseId);
      await Promise.all(
        ((imgs ?? []) as { storage_path: string }[]).map((r) => deleteUploadedKey(r.storage_path)),
      );
      const { error } = await supabase.from("awase").delete().eq("id", awaseId);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["awase_feed"] });
      qc.invalidateQueries({ queryKey: ["awase_search"] });
    },
  });
}

/** Roles/characters for a given awase (detail screen's 募集キャラ list). */
export function useAwaseRoles(awaseId: string | null) {
  return useQuery({
    queryKey: ["awase_roles", awaseId],
    enabled: isSupabaseConfigured() && Boolean(awaseId),
    queryFn: async (): Promise<DetailRole[]> => {
      const supabase = getSupabaseBrowserClient();
      const { data, error } = await supabase
        .from("awase_roles")
        .select("id, char_name, status, profiles(display_name)")
        .eq("awase_id", awaseId!)
        .order("sort");
      if (error) throw error;
      type RoleRow = { id: string; char_name: string; status: "confirmed" | "open"; profiles: { display_name: string } | null };
      return ((data ?? []) as unknown as RoleRow[]).map((r) => ({
        key: r.id,
        char: r.char_name,
        who: r.profiles?.display_name ?? "募集中",
        status: r.status === "confirmed" ? "確定" : "募集中",
      }));
    },
  });
}

interface CreateAwaseInput {
  hostId: string;
  title: string;
  workId: string | null;
  eventDate: string;
  region: string;
  womenOnly: boolean;
  beginnerOk: boolean;
  /** World-view/atmosphere tags selected on the create form. */
  worldTags?: string[];
  /** R2 object keys from useUploadImage, in display order. */
  imageKeys?: string[];
}

/** Publish a new 併せ (create form submit). */
export function useCreateAwase() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: CreateAwaseInput) => {
      const supabase = getSupabaseBrowserClient();
      const { data, error } = await supabase
        .from("awase")
        .insert({
          host_id: input.hostId,
          title: input.title,
          work_id: input.workId,
          event_date: input.eventDate,
          region: input.region,
          women_only: input.womenOnly,
          beginner_ok: input.beginnerOk,
          world_tags: input.worldTags ?? [],
        })
        .select("id")
        .single();
      if (error) throw error;

      if (input.imageKeys?.length) {
        const rows = input.imageKeys.map((storage_path, sort) => ({ awase_id: data.id, storage_path, sort }));
        const { error: imgErr } = await supabase.from("awase_images").insert(rows);
        if (imgErr) throw imgErr;
      }
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["awase_feed"] });
      qc.invalidateQueries({ queryKey: ["awase_search"] });
    },
  });
}

/** Apply to an awase (detail screen's 応募する button). */
export function useApply() {
  return useMutation({
    mutationFn: async ({ awaseId, applicantId }: { awaseId: string; applicantId: string }) => {
      const supabase = getSupabaseBrowserClient();
      const { error } = await supabase
        .from("awase_applications")
        .insert({ awase_id: awaseId, applicant_id: applicantId });
      if (error) throw error;
    },
  });
}
