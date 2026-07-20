import type { Metadata } from "next";
import { notFound } from "next/navigation";

/**
 * サークル（常設グループ）公開ページ（/g/<id>）— 検索流入の入口（SEO）。
 *
 * イベント/プロフィール公開ページと同じ方針。作品・地域別の常設サークルを
 * 検索から見つけてもらい、移住の受け皿（cosp.jp の「同盟」に相当）への入口を
 * 広げる。groups は RLS 上 匿名で読める（0073 groups_select using(true)）。
 */

const SITE = "https://premiercos.com";
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

interface PublicGroup {
  id: string;
  name: string;
  description: string;
  region: string;
  works: { name: string } | null;
  group_members: { count: number }[] | null;
}

async function fetchGroup(id: string): Promise<PublicGroup | null> {
  const base = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!base || !anon || !UUID_RE.test(id)) return null;
  try {
    const select = "id,name,description,region,works(name),group_members(count)";
    const res = await fetch(`${base}/rest/v1/groups?id=eq.${id}&select=${encodeURIComponent(select)}`, {
      headers: { apikey: anon, Authorization: `Bearer ${anon}` },
      next: { revalidate: 900 },
    });
    if (!res.ok) return null;
    const rows = (await res.json()) as PublicGroup[];
    return rows[0] ?? null;
  } catch {
    return null;
  }
}

function memberCountOf(g: PublicGroup): number {
  return g.group_members?.[0]?.count ?? 0;
}

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  const g = await fetchGroup(id);
  if (!g) {
    return {
      title: "サークル｜プルミエ！",
      description: "作品・地域別の常設コスプレサークルが見つかる交流プラットフォーム「プルミエ！」",
    };
  }
  const work = g.works?.name;
  const title = `${g.name}｜コスプレサークル - プルミエ！`;
  const description =
    [work ? `作品：${work}` : null, g.region ? `活動エリア：${g.region}` : null, `${memberCountOf(g)}人が参加`]
      .filter(Boolean)
      .join(" / ") + `｜${g.name}の活動・メンバー募集はプルミエ！`;
  return {
    title,
    description,
    alternates: { canonical: `${SITE}/g/${g.id}` },
    openGraph: { title, description, type: "article", siteName: "プルミエ！", locale: "ja_JP", images: ["/og.png"], url: `${SITE}/g/${g.id}` },
    twitter: { card: "summary", title, description },
  };
}

export default async function GroupPublicPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const g = await fetchGroup(id);
  if (!g) notFound();

  const appLink = `/?group=${encodeURIComponent(g.id)}`;
  const work = g.works?.name;
  const members = memberCountOf(g);

  return (
    <main
      style={{
        minHeight: "100dvh",
        background: "#F4F2F8",
        fontFamily: '"Zen Kaku Gothic New", -apple-system, sans-serif',
        color: "#2A2436",
        padding: "0 0 40px",
      }}
    >
      {/* eslint-disable-next-line @next/next/no-html-link-for-pages */}
      <a href="/" style={{ display: "block", padding: "16px 20px", fontSize: 18, fontWeight: 700, letterSpacing: ".04em", color: "#6D5DAB", textDecoration: "none" }}>
        プルミエ！
      </a>

      <div style={{ maxWidth: 560, margin: "0 auto", padding: "0 20px" }}>
        <div style={{ display: "inline-block", fontSize: 11.5, fontWeight: 700, color: "#6D5DAB", background: "#ECE8F6", padding: "4px 12px", borderRadius: 999 }}>
          サークル
        </div>
        <h1 style={{ fontSize: 23, fontWeight: 700, lineHeight: 1.5, margin: "12px 0 0" }}>{g.name}</h1>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 10, marginTop: 10, fontSize: 12, color: "#8B84A0" }}>
          {work && <span style={{ color: "#6D5DAB", fontWeight: 700 }}>{work}</span>}
          {g.region && <span>{g.region}</span>}
          <span>{members}人が参加</span>
        </div>

        {g.description?.trim() && (
          <p style={{ fontSize: 14, lineHeight: 1.95, color: "#4A4458", margin: "20px 0 0", whiteSpace: "pre-wrap" }}>{g.description}</p>
        )}

        <div style={{ marginTop: 26, background: "#fff", border: "1px solid #E7E2F0", borderRadius: 16, padding: "20px 18px", textAlign: "center" }}>
          <p style={{ fontSize: 13.5, lineHeight: 1.9, margin: 0, color: "#4A4458" }}>
            このサークルの<strong>メンバー・掲示板</strong>はプルミエ！で。参加して一緒に活動しましょう。
          </p>
          {/* eslint-disable-next-line @next/next/no-html-link-for-pages */}
          <a href={appLink} style={{ display: "inline-block", marginTop: 16, background: "#6D5DAB", color: "#fff", fontSize: 14, fontWeight: 700, padding: "13px 34px", borderRadius: 13, textDecoration: "none" }}>
            プルミエ！で見る
          </a>
        </div>
      </div>
    </main>
  );
}
