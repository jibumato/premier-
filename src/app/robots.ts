import type { MetadataRoute } from "next";

/**
 * robots.txt — 公開ページのクロールを許可し、ユーザー操作用のディープリンク
 * （?awase= / ?event=）はクロール対象から外す（重複コンテンツ回避）。
 * サイトマップの場所も知らせる。
 */
export default function robots(): MetadataRoute.Robots {
  const SITE = "https://premiercos.com";
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/api/", "/*?awase=", "/*?event="],
    },
    sitemap: `${SITE}/sitemap.xml`,
    host: SITE,
  };
}
