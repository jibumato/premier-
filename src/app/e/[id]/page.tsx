import type { Metadata } from "next";
import { notFound } from "next/navigation";

/**
 * イベント公開ページ（/e/<id>）— 検索流入の入口（SEO）。
 *
 * SPA 本体は「/」1ページ（?event=<id> のディープリンクで詳細を開く）だが、
 * それだとログイン前の検索エンジンに中身が拾われない。凍結した老舗が
 * 持てない「今のリアルなイベント情報」を検索から見つけてもらうため、この
 * ルートはサーバー側でイベントを1件描画し（＝クローラーが読める本文）、
 * OGP・Event 構造化データ・canonical を付ける。人間の閲覧者はそのまま
 * 読めるうえ、「アプリで開く」から /?event=<id> のディープリンクへ入れる。
 *
 * events は RLS 上 匿名でも読める（0007: events_select using(true)）ので
 * anon キーの REST で十分。
 */

const SITE = "https://premiercos.com";
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

interface PublicEvent {
  id: string;
  name: string;
  event_date: string;
  venue: string;
  region: string;
  tag: string;
  fee_text: string | null;
  body: string | null;
  image_url: string | null;
  starts_on: string | null;
}

async function fetchEvent(id: string): Promise<PublicEvent | null> {
  const base = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!base || !anon || !UUID_RE.test(id)) return null;
  try {
    const select = "id,name,event_date,venue,region,tag,fee_text,body,image_url,starts_on";
    const res = await fetch(`${base}/rest/v1/events?id=eq.${id}&select=${encodeURIComponent(select)}`, {
      headers: { apikey: anon, Authorization: `Bearer ${anon}` },
      // 内容は多少古くても支障がないのでキャッシュを効かせる（15分）。
      next: { revalidate: 900 },
    });
    if (!res.ok) return null;
    const rows = (await res.json()) as PublicEvent[];
    return rows[0] ?? null;
  } catch {
    return null;
  }
}

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  const e = await fetchEvent(id);
  if (!e) {
    return {
      title: "イベント｜プルミエ！",
      description: "コスプレイベントの情報・参加者・併せ募集が見つかる交流プラットフォーム「プルミエ！」",
    };
  }
  const title = `${e.name}｜コスプレイベント情報 - プルミエ！`;
  const description =
    [`${e.event_date}`, `会場：${e.venue}`, `エリア：${e.region}`].join(" / ") +
    `｜${e.name}のコスプレ参加情報・併せ募集・会場レビューはプルミエ！でチェック。`;
  const images = [e.image_url ?? "/og.png"];
  return {
    title,
    description,
    alternates: { canonical: `${SITE}/e/${e.id}` },
    openGraph: { title, description, type: "article", siteName: "プルミエ！", locale: "ja_JP", images, url: `${SITE}/e/${e.id}` },
    twitter: { card: "summary_large_image", title, description, images },
  };
}

export default async function EventPublicPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const e = await fetchEvent(id);
  if (!e) notFound();

  const appLink = `/?event=${encodeURIComponent(e.id)}`;
  // Event 構造化データ（検索結果のリッチ表示を狙う）。event_date は表示用の
  // 文字列なので startDate には ISO の starts_on がある時だけ入れる。
  const jsonLd: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": "Event",
    name: e.name,
    description: e.body ?? `${e.name}のコスプレ参加情報`,
    eventAttendanceMode: "https://schema.org/OfflineEventAttendanceMode",
    location: { "@type": "Place", name: e.venue, address: e.region },
    url: `${SITE}/e/${e.id}`,
    ...(e.starts_on ? { startDate: e.starts_on } : {}),
    ...(e.image_url ? { image: [e.image_url] } : {}),
  };

  const info: { label: string; value: string }[] = [
    { label: "日程", value: e.event_date },
    { label: "会場", value: e.venue },
    { label: "エリア", value: e.region },
    { label: "参加費", value: e.fee_text ?? "無料" },
  ];

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
      <a
        href="/"
        style={{
          display: "flex",
          alignItems: "center",
          gap: 8,
          padding: "16px 20px",
          fontSize: 18,
          fontWeight: 700,
          letterSpacing: ".04em",
          color: "#6D5DAB",
          textDecoration: "none",
        }}
      >
        プルミエ！
      </a>

      <div style={{ maxWidth: 680, margin: "0 auto", padding: "0 20px" }}>
        {e.image_url && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={e.image_url}
            alt={e.name}
            style={{ width: "100%", height: "auto", maxHeight: 360, objectFit: "cover", borderRadius: 18, display: "block" }}
          />
        )}

        <h1 style={{ fontSize: 24, fontWeight: 700, lineHeight: 1.5, margin: "20px 0 0" }}>{e.name}</h1>
        {e.tag && (
          <div style={{ marginTop: 10 }}>
            <span style={{ fontSize: 11.5, fontWeight: 700, color: "#6D5DAB", background: "#ECE8F6", padding: "4px 11px", borderRadius: 999 }}>
              {e.tag}
            </span>
          </div>
        )}

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginTop: 18 }}>
          {info.map((it) => (
            <div key={it.label} style={{ background: "#fff", border: "1px solid #E7E2F0", borderRadius: 14, padding: "13px 15px" }}>
              <div style={{ fontSize: 10.5, color: "#8B84A0" }}>{it.label}</div>
              <div style={{ fontSize: 13.5, fontWeight: 700, marginTop: 5 }}>{it.value}</div>
            </div>
          ))}
        </div>

        {e.body && (
          <section style={{ marginTop: 24 }}>
            <h2 style={{ fontSize: 15, fontWeight: 700, margin: 0 }}>イベント概要</h2>
            <p style={{ fontSize: 14, lineHeight: 1.95, color: "#4A4458", margin: "12px 0 0", whiteSpace: "pre-wrap" }}>{e.body}</p>
          </section>
        )}

        <section style={{ marginTop: 28, background: "#fff", border: "1px solid #E7E2F0", borderRadius: 16, padding: "20px 18px", textAlign: "center" }}>
          <p style={{ fontSize: 13.5, lineHeight: 1.9, margin: 0, color: "#4A4458" }}>
            このイベントの<strong>参加者・併せ募集・会場レビュー</strong>はプルミエ！で。
            <br />
            一緒に回る仲間を探したり、参加表明したりできます。
          </p>
          {/* eslint-disable-next-line @next/next/no-html-link-for-pages */}
          <a
            href={appLink}
            style={{
              display: "inline-block",
              marginTop: 16,
              background: "#6D5DAB",
              color: "#fff",
              fontSize: 14,
              fontWeight: 700,
              padding: "13px 34px",
              borderRadius: 13,
              textDecoration: "none",
            }}
          >
            プルミエ！で見る
          </a>
        </section>

        {/* eslint-disable-next-line @next/next/no-html-link-for-pages */}
        <a href="/" style={{ display: "block", textAlign: "center", marginTop: 22, fontSize: 12.5, color: "#8B84A0", textDecoration: "underline" }}>
          ほかのコスプレイベントを見る
        </a>
      </div>

      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
    </main>
  );
}
