import type { Metadata } from "next";
import { AwaseRedirect } from "./AwaseRedirect";

/**
 * 併せの共有用URL（/a/<id>）。
 *
 * SPA 本体は「/」1ページ（?awase=<id> のディープリンクで詳細を開く）だが、
 * X などのクローラーは JS を実行しないため、共有時にリッチカード（OGP）が
 * 出ない。このルートはサーバー側で併せを1件引いて OGP メタ（タイトル・
 * 説明・カバー画像）を返し、人間の閲覧者はクライアントで /?awase=<id> へ
 * 転送する。募集中（status=open）の併せは RLS 上 匿名でも読めるので、
 * anon キーの REST で十分。
 */

interface AwaseOg {
  title: string;
  event_date: string;
  place: string | null;
  region: string;
  works: { name: string } | null;
  awase_images: { storage_path: string }[] | null;
}

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

async function fetchAwaseForOg(id: string): Promise<AwaseOg | null> {
  const base = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!base || !anon || !UUID_RE.test(id)) return null;
  try {
    const select = "title,event_date,place,region,works(name),awase_images(storage_path)";
    const res = await fetch(
      `${base}/rest/v1/awase?id=eq.${id}&select=${encodeURIComponent(select)}`,
      {
        headers: { apikey: anon, Authorization: `Bearer ${anon}` },
        // 共有カードの内容は多少古くても支障がないのでキャッシュを効かせる
        next: { revalidate: 300 },
      },
    );
    if (!res.ok) return null;
    const rows = (await res.json()) as AwaseOg[];
    return rows[0] ?? null;
  } catch {
    return null;
  }
}

function coverUrlOf(a: AwaseOg): string | null {
  const key = a.awase_images?.[0]?.storage_path;
  const base = process.env.NEXT_PUBLIC_R2_PUBLIC_URL?.replace(/\/+$/, "");
  return key && base ? `${base}/${key}` : null;
}

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  const a = await fetchAwaseForOg(id);
  if (!a) {
    return {
      title: "併せ募集｜プルミエ！",
      description: "コスプレ併せの募集・応募ができる交流プラットフォーム「プルミエ！」",
    };
  }
  const work = a.works?.name ?? "オリジナル";
  const title = `${a.title}｜プルミエ！`;
  const description = [
    `作品：${work}`,
    `日程：${a.event_date}`,
    a.place ? `場所：${a.place}` : `地域：${a.region}`,
  ].join(" / ") + "｜コスプレ併せの募集・応募はプルミエ！";
  const cover = coverUrlOf(a);
  const images = [cover ?? "/og.png"];
  return {
    title,
    description,
    openGraph: { title, description, type: "article", siteName: "プルミエ！", images },
    twitter: { card: "summary_large_image", title, description, images },
  };
}

export default async function AwaseSharePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <AwaseRedirect id={id} />;
}
