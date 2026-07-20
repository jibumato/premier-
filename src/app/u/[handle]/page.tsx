import type { Metadata } from "next";
import { notFound } from "next/navigation";

/**
 * プロフィール公開ページ（/u/<handle>）— 検索流入の入口（SEO）。
 *
 * イベント公開ページ（/e/<id>）と同じ方針で、ログイン前の検索エンジンにも
 * レイヤーのプロフィールを見つけてもらう。プルミエを「活動の名刺／ホーム」に
 * する戦略とも一致（SNSのプロフ欄に貼れる公開URL）。
 *
 * プライバシー: profiles の RLS（0001 profiles_select）は「非公開でない
 * プロフィールだけ」を匿名に返す。＝ 非公開アカウントはそもそも匿名 REST に
 * 出ないので、このページには絶対に表示されない。停止中は明示的に除外する。
 * 収益化（支援）リンクは年齢確認できない匿名閲覧では出さず、SNS系リンクのみ。
 */

const SITE = "https://premiercos.com";
const HANDLE_RE = /^[a-z0-9_]{3,20}$/;

// SNS系リンク（0075）のみ公開ページに出す。支援（収益化）系はゾーニングのため出さない。
const SNS_LABELS: Record<string, string> = {
  pixiv: "pixiv",
  instagram: "Instagram",
  youtube: "YouTube",
  tiktok: "TikTok",
  niconico: "ニコニコ",
  website: "サイト",
};

interface PublicProfile {
  id: string;
  handle: string;
  display_name: string;
  role: "layer" | "photographer" | "both";
  bio: string | null;
  avatar_url: string | null;
  is_verified: boolean;
  is_suspended: boolean;
  links: unknown;
}

function roleLabel(role: PublicProfile["role"]): string {
  if (role === "photographer") return "カメラマン";
  if (role === "both") return "コスプレイヤー・カメラマン";
  return "コスプレイヤー";
}

function snsLinks(raw: unknown): { label: string; url: string }[] {
  if (!Array.isArray(raw)) return [];
  const out: { label: string; url: string }[] = [];
  const seen = new Set<string>();
  for (const item of raw) {
    if (!item || typeof item !== "object") continue;
    const t = (item as { type?: unknown }).type;
    const u = (item as { url?: unknown }).url;
    if (typeof t !== "string" || typeof u !== "string") continue;
    if (!SNS_LABELS[t] || seen.has(t) || !/^https?:\/\//i.test(u)) continue;
    seen.add(t);
    out.push({ label: SNS_LABELS[t], url: u });
  }
  return out;
}

async function fetchProfile(handle: string): Promise<PublicProfile | null> {
  const base = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!base || !anon || !HANDLE_RE.test(handle)) return null;
  try {
    const select = "id,handle,display_name,role,bio,avatar_url,is_verified,is_suspended,links";
    const res = await fetch(`${base}/rest/v1/profiles?handle=eq.${handle}&select=${encodeURIComponent(select)}`, {
      headers: { apikey: anon, Authorization: `Bearer ${anon}` },
      next: { revalidate: 900 },
    });
    if (!res.ok) return null;
    const rows = (await res.json()) as PublicProfile[];
    const p = rows[0];
    if (!p || p.is_suspended) return null;
    return p;
  } catch {
    return null;
  }
}

export async function generateMetadata({ params }: { params: Promise<{ handle: string }> }): Promise<Metadata> {
  const { handle } = await params;
  const p = await fetchProfile(handle);
  if (!p) {
    return {
      title: "コスプレイヤー｜プルミエ！",
      description: "コスプレイヤー・カメラマンが好きな作品でつながる交流プラットフォーム「プルミエ！」",
    };
  }
  const title = `${p.display_name}（@${p.handle}）｜${roleLabel(p.role)} - プルミエ！`;
  const description = (p.bio?.trim() || `${p.display_name}さんのプロフィール。`) +
    `｜コスプレの併せ・撮影・イベント参加はプルミエ！`;
  const images = [p.avatar_url ?? "/og.png"];
  return {
    title,
    description,
    alternates: { canonical: `${SITE}/u/${p.handle}` },
    openGraph: { title, description, type: "profile", siteName: "プルミエ！", locale: "ja_JP", images, url: `${SITE}/u/${p.handle}` },
    twitter: { card: "summary", title, description, images },
  };
}

export default async function ProfilePublicPage({ params }: { params: Promise<{ handle: string }> }) {
  const { handle } = await params;
  const p = await fetchProfile(handle);
  if (!p) notFound();

  const appLink = `/?u=${encodeURIComponent(p.id)}`;
  const links = snsLinks(p.links);

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

      <div style={{ maxWidth: 560, margin: "0 auto", padding: "0 20px", textAlign: "center" }}>
        <div style={{ width: 96, height: 96, borderRadius: "50%", overflow: "hidden", margin: "8px auto 0", background: "#E7E2F0" }}>
          {p.avatar_url && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={p.avatar_url} alt={p.display_name} width={96} height={96} style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
          )}
        </div>
        <h1 style={{ fontSize: 22, fontWeight: 700, margin: "16px 0 0" }}>
          {p.display_name}
          {p.is_verified && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src="/verified-badge.png" alt="本人確認済" width={18} height={18} style={{ display: "inline-block", verticalAlign: "middle", marginLeft: 6 }} />
          )}
        </h1>
        <div style={{ fontSize: 12.5, color: "#8B84A0", marginTop: 4 }}>@{p.handle}</div>
        <div style={{ display: "inline-block", marginTop: 10, fontSize: 11.5, fontWeight: 700, color: "#6D5DAB", background: "#ECE8F6", padding: "4px 12px", borderRadius: 999 }}>
          {roleLabel(p.role)}
        </div>

        {p.bio?.trim() && (
          <p style={{ fontSize: 13.5, lineHeight: 1.9, color: "#4A4458", margin: "18px 0 0", whiteSpace: "pre-wrap", textAlign: "left" }}>{p.bio}</p>
        )}

        {links.length > 0 && (
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8, justifyContent: "center", marginTop: 18 }}>
            {links.map((l) => (
              <a
                key={l.url}
                href={l.url}
                target="_blank"
                rel="noopener noreferrer nofollow"
                style={{ fontSize: 12, fontWeight: 700, color: "#2A2436", background: "#fff", border: "1px solid #E7E2F0", borderRadius: 999, padding: "6px 14px", textDecoration: "none" }}
              >
                {l.label} ↗
              </a>
            ))}
          </div>
        )}

        <div style={{ marginTop: 26, background: "#fff", border: "1px solid #E7E2F0", borderRadius: 16, padding: "20px 18px" }}>
          <p style={{ fontSize: 13.5, lineHeight: 1.9, margin: 0, color: "#4A4458" }}>
            {p.display_name}さんの<strong>ギャラリー・併せ募集・出演イベント</strong>はプルミエ！で。
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
