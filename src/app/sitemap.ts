import type { MetadataRoute } from "next";

/**
 * sitemap.xml — 検索エンジンに公開ページ（トップ＋各イベント公開ページ）を
 * 知らせる。イベントは匿名で読めるので anon キーの REST で id を取得する。
 * 取得に失敗しても最低限トップだけは返す（サイトマップを壊さない）。
 */

const SITE = "https://premiercos.com";
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

async function fetchEventIds(): Promise<{ id: string; updated: string }[]> {
  const base = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!base || !anon) return [];
  try {
    const res = await fetch(
      `${base}/rest/v1/events?select=id,created_at&order=created_at.desc&limit=1000`,
      {
        headers: { apikey: anon, Authorization: `Bearer ${anon}` },
        next: { revalidate: 3600 },
      },
    );
    if (!res.ok) return [];
    const rows = (await res.json()) as { id: string; created_at: string }[];
    return rows.filter((r) => UUID_RE.test(r.id)).map((r) => ({ id: r.id, updated: r.created_at }));
  } catch {
    return [];
  }
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const events = await fetchEventIds();
  const eventEntries: MetadataRoute.Sitemap = events.map((e) => ({
    url: `${SITE}/e/${e.id}`,
    lastModified: e.updated,
    changeFrequency: "weekly",
    priority: 0.7,
  }));
  return [
    { url: SITE, changeFrequency: "daily", priority: 1 },
    ...eventEntries,
  ];
}
