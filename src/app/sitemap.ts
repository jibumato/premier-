import type { MetadataRoute } from "next";

/**
 * sitemap.xml — 検索エンジンに公開ページ（トップ＋各イベント公開ページ）を
 * 知らせる。イベントは匿名で読めるので anon キーの REST で id を取得する。
 * 取得に失敗しても最低限トップだけは返す（サイトマップを壊さない）。
 */

const SITE = "https://premiercos.com";
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const HANDLE_RE = /^[a-z0-9_]{3,20}$/;
const DEFAULT_HANDLE_RE = /^user_[0-9a-f]{8}$/; // 自動採番（未設定）ハンドルは載せない

async function anonFetch<T>(path: string): Promise<T[]> {
  const base = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!base || !anon) return [];
  try {
    const res = await fetch(`${base}/rest/v1/${path}`, {
      headers: { apikey: anon, Authorization: `Bearer ${anon}` },
      next: { revalidate: 3600 },
    });
    if (!res.ok) return [];
    return (await res.json()) as T[];
  } catch {
    return [];
  }
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  // events / groups は匿名可。profiles は RLS により非公開でないものだけ返る
  // （＝非公開アカウントは自動的にサイトマップに載らない）。未設定ハンドルは除外。
  const [events, groups, profiles] = await Promise.all([
    anonFetch<{ id: string; created_at: string }>("events?select=id,created_at&order=created_at.desc&limit=1000"),
    anonFetch<{ id: string; created_at: string }>("groups?select=id,created_at&order=created_at.desc&limit=1000"),
    anonFetch<{ handle: string; created_at: string }>("profiles?select=handle,created_at&order=created_at.desc&limit=1000"),
  ]);

  const eventEntries: MetadataRoute.Sitemap = events
    .filter((e) => UUID_RE.test(e.id))
    .map((e) => ({ url: `${SITE}/e/${e.id}`, lastModified: e.created_at, changeFrequency: "weekly", priority: 0.7 }));
  const groupEntries: MetadataRoute.Sitemap = groups
    .filter((g) => UUID_RE.test(g.id))
    .map((g) => ({ url: `${SITE}/g/${g.id}`, lastModified: g.created_at, changeFrequency: "weekly", priority: 0.5 }));
  const profileEntries: MetadataRoute.Sitemap = profiles
    .filter((p) => HANDLE_RE.test(p.handle) && !DEFAULT_HANDLE_RE.test(p.handle))
    .map((p) => ({ url: `${SITE}/u/${p.handle}`, lastModified: p.created_at, changeFrequency: "weekly", priority: 0.6 }));

  return [
    { url: SITE, changeFrequency: "daily", priority: 1 },
    ...eventEntries,
    ...profileEntries,
    ...groupEntries,
  ];
}
