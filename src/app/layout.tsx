import type { Metadata, Viewport } from "next";
import "./globals.css";
import { Providers } from "@/components/Providers";

const siteTitle = "プルミエ！ — コスプレイヤー交流マッチング";
const siteDescription =
  "コスプレイヤー同士（カメラマンも参加可）が好きな作品でつながり、併せ撮影の企画・募集・応募ができる交流プラットフォーム。";

export const metadata: Metadata = {
  metadataBase: new URL("https://premiercos.com"),
  title: siteTitle,
  description: siteDescription,
  openGraph: {
    title: siteTitle,
    description: siteDescription,
    siteName: "プルミエ！",
    type: "website",
    locale: "ja_JP",
    images: [{ url: "/og.png", width: 1200, height: 630 }],
  },
  twitter: {
    card: "summary_large_image",
    title: siteTitle,
    description: siteDescription,
    images: ["/og.png"],
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#E9E6EF",
  // ノッチ/ホームインジケータのある端末で safe-area-inset を有効にし、
  // 下部ナビをインジケータに被らせない（globals.css の .pt-bottomnav 参照）。
  viewportFit: "cover",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ja">
      <head>
        {/*
          Fonts loaded at runtime (not via next/font) so builds don't depend on
          outbound access to fonts.gstatic.com. Zen Kaku Gothic New is the UI
          body font; Zen Maru Gothic is available for rounded headings/logo.
        */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Zen+Kaku+Gothic+New:wght@300;400;500;700&family=Zen+Maru+Gothic:wght@500;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
