"use client";

/**
 * 作品カバー（B案: タイポグラフィ＋作品ごとの固定カラー）。
 *
 * 二次創作のプラットフォームでは公式画像をヘッダーに使えないため、作品名から
 * 決定的に生成したグラデーションと、大きな頭文字の透かし＋作品名タイポで
 * 「パッと見てこの作品」と識別できるようにする。同じ作品名は常に同じ配色に
 * なる（ハッシュ由来）ので、覚えてもらえる＝識別子として機能する。
 * 実際のコス写真をカバーに使う案（A）へ将来差し替える際も、写真が無い作品の
 * フォールバックとしてこのまま使える。
 */

/** FNV-1a 32-bit hash — stable across sessions/platforms. */
function hashString(s: string): number {
  let h = 0x811c9dc5;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return h >>> 0;
}

/** Deterministic gradient pair for a work name. */
export function workGradient(name: string): { from: string; to: string } {
  const h = hashString(name.trim());
  const hue = h % 360;
  // Offset the second hue so every cover is a two-tone gradient; keep
  // saturation/lightness in a pastel band that fits the brand and keeps
  // white text readable.
  const hue2 = (hue + 40 + (h % 50)) % 360;
  return {
    from: `hsl(${hue} 50% 58%)`,
    to: `hsl(${hue2} 56% 66%)`,
  };
}

export function WorkCover({
  name,
  radius = 14,
  showName = true,
  nameSize = 12.5,
}: {
  name: string;
  radius?: number;
  /** hide the caption when the parent draws its own label (e.g. onboarding grid) */
  showName?: boolean;
  nameSize?: number;
}) {
  const g = workGradient(name);
  const initial = Array.from(name.trim())[0] ?? "？";
  return (
    <div
      style={{
        position: "relative",
        width: "100%",
        height: "100%",
        borderRadius: radius,
        overflow: "hidden",
        background: `linear-gradient(135deg, ${g.from}, ${g.to})`,
      }}
    >
      {/* oversized first character as a watermark motif */}
      <span
        aria-hidden
        style={{
          position: "absolute",
          right: -6,
          bottom: -16,
          fontSize: 64,
          fontWeight: 800,
          lineHeight: 1,
          color: "rgba(255,255,255,.3)",
          fontFamily: '"Zen Maru Gothic", "Zen Kaku Gothic New", sans-serif',
          userSelect: "none",
          pointerEvents: "none",
        }}
      >
        {initial}
      </span>
      {showName && (
        <span
          style={{
            position: "absolute",
            left: 10,
            right: 10,
            bottom: 8,
            fontSize: nameSize,
            fontWeight: 700,
            lineHeight: 1.35,
            color: "#fff",
            textShadow: "0 1px 6px rgba(30,20,50,.35)",
            display: "-webkit-box",
            WebkitLineClamp: 2,
            WebkitBoxOrient: "vertical",
            overflow: "hidden",
            textAlign: "left",
          }}
        >
          {name}
        </span>
      )}
    </div>
  );
}
