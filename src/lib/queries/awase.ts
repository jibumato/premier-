"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { deleteUploadedKey } from "@/lib/queries/upload";
import type { AwaseCard, DetailRole, SearchResult } from "@/lib/types";

/** Build a public R2 URL from a stored object key (null if R2 isn't configured). */
function r2PublicUrl(key: string | null | undefined): string | null {
  if (!key) return null;
  const base = process.env.NEXT_PUBLIC_R2_PUBLIC_URL?.replace(/\/+$/, "");
  return base ? `${base}/${key}` : null;
}

/** Row shape returned by the awase list queries below (embeds work name + images). */
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
  awase_images: { storage_path: string }[] | null;
};

const AWASE_LIST_SELECT =
  "id, host_id, title, event_date, place, region, world_tags, women_only, beginner_ok, capacity, works(name), awase_images(storage_path)";

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
    coverUrl: r2PublicUrl(row.awase_images?.[0]?.storage_path),
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
    coverUrl: r2PublicUrl(row.awase_images?.[0]?.storage_path),
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

/** Latest 初心者歓迎(beginner_ok) の open 併せ — ホームの「はじめてさん歓迎」レーン用。 */
export function useBeginnerAwase(filter?: AwaseFeedFilter) {
  return useQuery({
    queryKey: ["awase_beginner", filter?.blockedUserIds ?? [], filter?.hiddenAwaseIds ?? []],
    enabled: isSupabaseConfigured(),
    queryFn: async (): Promise<AwaseCard[]> => {
      const supabase = getSupabaseBrowserClient();
      const { data, error } = await supabase
        .from("awase")
        .select(AWASE_LIST_SELECT)
        .eq("status", "open")
        .eq("beginner_ok", true)
        .order("created_at", { ascending: false })
        .limit(8);
      if (error) throw error;
      return applyFilter((data ?? []) as unknown as AwaseRow[], filter).map(toAwaseCard);
    },
  });
}

/** How many awase the user has applied to — home「はじめてガイド」の③判定用。 */
export function useMyApplicationCount(userId: string | undefined) {
  return useQuery({
    queryKey: ["my_application_count", userId],
    enabled: isSupabaseConfigured() && Boolean(userId),
    queryFn: async (): Promise<number> => {
      const supabase = getSupabaseBrowserClient();
      const { count, error } = await supabase
        .from("awase_applications")
        .select("id", { count: "exact", head: true })
        .eq("applicant_id", userId!);
      if (error) throw error;
      return count ?? 0;
    },
  });
}

export interface AwaseHistoryItem {
  key: string;
  /** 元の併せID（募集中なら詳細へ遷移できる）。 */
  awaseId: string;
  title: string;
  work: string;
  date: string;
  role: "主催" | "参加";
  /** 併せの現在の募集状態。"open" のときだけ詳細へ飛べる。 */
  status: "open" | "closed";
  createdAt: string;
}

/** 自分のコス活ログ（主催した併せ＋accepted/doneで参加した併せ）。新しい順。
 * 応募行のRLSは本人のみ閲覧可のため、本人のマイページ専用。 */
export function useAwaseHistory(userId: string | undefined) {
  return useQuery({
    queryKey: ["awase_history", userId],
    enabled: isSupabaseConfigured() && Boolean(userId),
    queryFn: async (): Promise<AwaseHistoryItem[]> => {
      const supabase = getSupabaseBrowserClient();
      const [hosted, applied] = await Promise.all([
        supabase
          .from("awase")
          .select("id, title, event_date, status, created_at, works(name)")
          .eq("host_id", userId!)
          .order("created_at", { ascending: false }),
        supabase
          .from("awase_applications")
          .select("id, created_at, awase(id, title, event_date, status, works(name))")
          .eq("applicant_id", userId!)
          .in("status", ["accepted", "done"])
          .order("created_at", { ascending: false }),
      ]);
      if (hosted.error) throw hosted.error;
      if (applied.error) throw applied.error;
      type HostRow = { id: string; title: string; event_date: string; status: "open" | "closed"; created_at: string; works: { name: string } | null };
      type AppRow = { id: string; created_at: string; awase: { id: string; title: string; event_date: string; status: "open" | "closed"; works: { name: string } | null } | null };
      const items: AwaseHistoryItem[] = [
        ...((hosted.data ?? []) as unknown as HostRow[]).map((r) => ({
          key: `h-${r.id}`,
          awaseId: r.id,
          title: r.title,
          work: r.works?.name ?? "オリジナル",
          date: r.event_date,
          role: "主催" as const,
          status: r.status,
          createdAt: r.created_at,
        })),
        ...((applied.data ?? []) as unknown as AppRow[])
          .filter((r) => r.awase)
          .map((r) => ({
            key: `a-${r.id}`,
            awaseId: r.awase!.id,
            title: r.awase!.title,
            work: r.awase!.works?.name ?? "オリジナル",
            date: r.awase!.event_date,
            role: "参加" as const,
            status: r.awase!.status,
            createdAt: r.created_at,
          })),
      ];
      return items.sort((x, y) => (x.createdAt < y.createdAt ? 1 : -1));
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
  work_id: string | null;
  status: "open" | "closed";
  publish_at: string | null;
  application_deadline: string | null;
  accept_waitlist: boolean;
  view_count: number;
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
          "id, title, body, event_date, place, region, fee_text, women_only, beginner_ok, capacity, world_tags, host_id, work_id, status, publish_at, application_deadline, accept_waitlist, view_count, works(name), profiles(display_name, is_verified)",
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
  /** ISO timestamp or null (即時公開). */
  publishAt?: string | null;
  /** ISO timestamp or null (締切なし). */
  applicationDeadline?: string | null;
  /** 満員後もキャンセル待ちとして応募を受け付ける. */
  acceptWaitlist?: boolean;
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
          publish_at: input.publishAt ?? null,
          application_deadline: input.applicationDeadline ?? null,
          accept_waitlist: input.acceptWaitlist ?? false,
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
  place?: string | null;
  feeText?: string | null;
  body?: string | null;
  capacity?: number | null;
  /** ISO timestamp; when in the future the 併せ is hidden until then (公開予約). */
  publishAt?: string | null;
  /** ISO timestamp; applications are refused after this time (応募締切). */
  applicationDeadline?: string | null;
  /** 満員後もキャンセル待ちとして応募を受け付ける. */
  acceptWaitlist?: boolean;
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
          place: input.place ?? null,
          fee_text: input.feeText ?? null,
          body: input.body ?? null,
          capacity: input.capacity ?? null,
          publish_at: input.publishAt ?? null,
          application_deadline: input.applicationDeadline ?? null,
          accept_waitlist: input.acceptWaitlist ?? false,
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

export type ApplicationStatus = "applied" | "accepted" | "rejected" | "done";

export interface Applicant {
  /** application row id */
  id: string;
  applicantId: string;
  displayName: string;
  avatarUrl: string | null;
  isVerified: boolean;
  message: string;
  status: ApplicationStatus;
  createdAt: string;
}

/** Applicants to an awase, newest first — for the host's 応募者管理 screen
 * (readable by the host per the applications_select RLS policy). */
export function useAwaseApplicants(awaseId: string | null) {
  return useQuery({
    queryKey: ["awase_applicants", awaseId],
    enabled: isSupabaseConfigured() && Boolean(awaseId),
    queryFn: async (): Promise<Applicant[]> => {
      const supabase = getSupabaseBrowserClient();
      const { data, error } = await supabase
        .from("awase_applications")
        .select("id, applicant_id, message, status, created_at, profiles(display_name, avatar_url, is_verified)")
        .eq("awase_id", awaseId!)
        .order("created_at", { ascending: false });
      if (error) throw error;
      type Row = {
        id: string;
        applicant_id: string;
        message: string | null;
        status: ApplicationStatus;
        created_at: string;
        profiles: { display_name: string; avatar_url: string | null; is_verified: boolean } | null;
      };
      return ((data ?? []) as unknown as Row[]).map((r) => ({
        id: r.id,
        applicantId: r.applicant_id,
        displayName: r.profiles?.display_name ?? "ゲスト",
        avatarUrl: r.profiles?.avatar_url ?? null,
        isVerified: r.profiles?.is_verified ?? false,
        message: r.message ?? "",
        status: r.status,
        createdAt: r.created_at,
      }));
    },
  });
}

/** Total + accepted application counts for an awase (host controls / 満員判定). */
export function useAwaseApplicantCount(awaseId: string | null) {
  return useQuery({
    queryKey: ["awase_applicant_count", awaseId],
    enabled: isSupabaseConfigured() && Boolean(awaseId),
    queryFn: async (): Promise<{ total: number; accepted: number }> => {
      const supabase = getSupabaseBrowserClient();
      const { data, error } = await supabase
        .from("awase_applications")
        .select("status")
        .eq("awase_id", awaseId!);
      if (error) throw error;
      const rows = (data ?? []) as { status: ApplicationStatus }[];
      return {
        total: rows.length,
        accepted: rows.filter((r) => r.status === "accepted").length,
      };
    },
  });
}

/** Accept/reject an application (host only — applications_update RLS). The DB
 * trigger auto-closes the awase when accepted reaches capacity, so we refetch
 * the awase too. */
export function useUpdateApplicationStatus() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, status }: { id: string; awaseId: string; status: ApplicationStatus }) => {
      const supabase = getSupabaseBrowserClient();
      const { error } = await supabase.from("awase_applications").update({ status }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: (_d, { awaseId }) => {
      qc.invalidateQueries({ queryKey: ["awase_applicants", awaseId] });
      qc.invalidateQueries({ queryKey: ["awase_applicant_count", awaseId] });
      qc.invalidateQueries({ queryKey: ["awase", awaseId] });
      qc.invalidateQueries({ queryKey: ["awase_feed"] });
      qc.invalidateQueries({ queryKey: ["awase_search"] });
    },
  });
}

/** Open/close an awase's recruitment (host only). Lets a host re-open after an
 * auto-close, or close early. */
export function useSetAwaseStatus() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ awaseId, status }: { awaseId: string; status: "open" | "closed" }) => {
      const supabase = getSupabaseBrowserClient();
      const { error } = await supabase.from("awase").update({ status }).eq("id", awaseId);
      if (error) throw error;
    },
    onSuccess: (_d, { awaseId }) => {
      qc.invalidateQueries({ queryKey: ["awase", awaseId] });
      qc.invalidateQueries({ queryKey: ["awase_feed"] });
      qc.invalidateQueries({ queryKey: ["awase_search"] });
    },
  });
}

export interface AwaseImage {
  id: string;
  storagePath: string;
  url: string | null;
}

/** Images attached to an awase, in display order (detail hero + edit). */
export function useAwaseImages(awaseId: string | null) {
  return useQuery({
    queryKey: ["awase_images", awaseId],
    enabled: isSupabaseConfigured() && Boolean(awaseId),
    queryFn: async (): Promise<AwaseImage[]> => {
      const supabase = getSupabaseBrowserClient();
      const { data, error } = await supabase
        .from("awase_images")
        .select("id, storage_path, sort")
        .eq("awase_id", awaseId!)
        .order("sort", { ascending: true });
      if (error) throw error;
      return ((data ?? []) as { id: string; storage_path: string; sort: number }[]).map((r) => ({
        id: r.id,
        storagePath: r.storage_path,
        url: r2PublicUrl(r.storage_path),
      }));
    },
  });
}

/** Attach an already-uploaded image (R2 key) to an awase (host only). */
export function useAddAwaseImage() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ awaseId, storagePath, sort }: { awaseId: string; storagePath: string; sort: number }) => {
      const supabase = getSupabaseBrowserClient();
      const { error } = await supabase
        .from("awase_images")
        .insert({ awase_id: awaseId, storage_path: storagePath, sort });
      if (error) throw error;
    },
    onSuccess: (_d, { awaseId }) => {
      qc.invalidateQueries({ queryKey: ["awase_images", awaseId] });
      qc.invalidateQueries({ queryKey: ["awase_feed"] });
      qc.invalidateQueries({ queryKey: ["awase_search"] });
    },
  });
}

export interface AwaseTemplate {
  id: string;
  name: string;
  title: string;
  workId: string | null;
  region: string;
  place: string | null;
  feeText: string | null;
  body: string | null;
  capacity: number | null;
  womenOnly: boolean;
  beginnerOk: boolean;
  worldTags: string[];
}

type TemplateRow = {
  id: string;
  name: string;
  title: string;
  work_id: string | null;
  region: string;
  place: string | null;
  fee_text: string | null;
  body: string | null;
  capacity: number | null;
  women_only: boolean;
  beginner_ok: boolean;
  world_tags: string[];
};

function toTemplate(r: TemplateRow): AwaseTemplate {
  return {
    id: r.id,
    name: r.name,
    title: r.title,
    workId: r.work_id,
    region: r.region,
    place: r.place,
    feeText: r.fee_text,
    body: r.body,
    capacity: r.capacity,
    womenOnly: r.women_only,
    beginnerOk: r.beginner_ok,
    worldTags: r.world_tags ?? [],
  };
}

/** A host's saved 募集テンプレート, newest first (create form's テンプレから選ぶ). */
export function useAwaseTemplates(hostId: string | null | undefined) {
  return useQuery({
    queryKey: ["awase_templates", hostId],
    enabled: isSupabaseConfigured() && Boolean(hostId),
    queryFn: async (): Promise<AwaseTemplate[]> => {
      const supabase = getSupabaseBrowserClient();
      const { data, error } = await supabase
        .from("awase_templates")
        .select("id, name, title, work_id, region, place, fee_text, body, capacity, women_only, beginner_ok, world_tags")
        .eq("host_id", hostId!)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return ((data ?? []) as unknown as TemplateRow[]).map(toTemplate);
    },
  });
}

export interface SaveTemplateInput {
  hostId: string;
  name: string;
  title: string;
  workId: string | null;
  region: string;
  place: string | null;
  feeText: string | null;
  body: string | null;
  capacity: number | null;
  womenOnly: boolean;
  beginnerOk: boolean;
  worldTags: string[];
}

/** Save the current create-form contents as a reusable template (host only). */
export function useSaveAwaseTemplate() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: SaveTemplateInput) => {
      const supabase = getSupabaseBrowserClient();
      const { error } = await supabase.from("awase_templates").insert({
        host_id: input.hostId,
        name: input.name,
        title: input.title,
        work_id: input.workId,
        region: input.region,
        place: input.place,
        fee_text: input.feeText,
        body: input.body,
        capacity: input.capacity,
        women_only: input.womenOnly,
        beginner_ok: input.beginnerOk,
        world_tags: input.worldTags,
      });
      if (error) throw error;
    },
    onSuccess: (_d, { hostId }) => {
      qc.invalidateQueries({ queryKey: ["awase_templates", hostId] });
    },
  });
}

/** Delete a saved template (host only). */
export function useDeleteAwaseTemplate() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id }: { id: string; hostId: string }) => {
      const supabase = getSupabaseBrowserClient();
      const { error } = await supabase.from("awase_templates").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: (_d, { hostId }) => {
      qc.invalidateQueries({ queryKey: ["awase_templates", hostId] });
    },
  });
}

/** Remove an awase image (host only) — deletes the DB row and its R2 file. */
export function useRemoveAwaseImage() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, storagePath }: { awaseId: string; id: string; storagePath: string }) => {
      await deleteUploadedKey(storagePath);
      const supabase = getSupabaseBrowserClient();
      const { error } = await supabase.from("awase_images").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: (_d, { awaseId }) => {
      qc.invalidateQueries({ queryKey: ["awase_images", awaseId] });
      qc.invalidateQueries({ queryKey: ["awase_feed"] });
      qc.invalidateQueries({ queryKey: ["awase_search"] });
    },
  });
}
