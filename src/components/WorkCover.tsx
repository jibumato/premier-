"use client";

import { useId } from "react";

/**
 * 作品カバー（タイポグラフィ＋作品ごとの固定デザイン）。
 *
 * 二次創作のプラットフォームでは公式画像をヘッダーに使えないため、作品名から
 * 決定的に生成したデザインで「パッと見てこの作品」と識別できるようにする。
 * 同じ作品名は常に同じ配色・同じ装飾パターンになる（ハッシュ由来）ので、
 * 覚えてもらえる＝識別子として機能する。
 *
 * 生成要素: 3色グラデーション（角度も作品ごと）＋ 装飾パターン5種
 * （きらめき・水玉・斜めストライプ・リング・花びら）＋ 光のハイライト
 * ＋ 頭文字の透かし ＋ 可読性用の下部スクリム。
 * 実際のコス写真をカバーに使う案へ将来差し替える際も、写真が無い作品の
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

/** Deterministic gradient pair for a work name.（既存利用箇所との互換用） */
export function workGradient(name: string): { from: string; to: string } {
  const h = hashString(name.trim());
  const hue = h % 360;
  const hue2 = (hue + 40 + (h % 50)) % 360;
  return {
    from: `hsl(${hue} 50% 58%)`,
    to: `hsl(${hue2} 56% 66%)`,
  };
}

interface WorkDesign {
  background: string;
  pattern: number;
  watermarkRotate: number;
}

/** 作品名から配色（3色グラデ）・パターン種・透かしの傾きを決定的に生成する。 */
function workDesign(name: string): WorkDesign {
  const h = hashString(name.trim());
  const hue = h % 360;
  const hue2 = (hue + 40 + (h % 50)) % 360;
  const hue3 = (hue + 320 - (h % 40)) % 360;
  const angle = 115 + (h % 100); // 115〜214deg
  return {
    background: `linear-gradient(${angle}deg, hsl(${hue} 52% 56%), hsl(${hue2} 56% 64%) 55%, hsl(${hue3} 50% 60%))`,
    pattern: h % 5,
    watermarkRotate: (h % 13) - 6, // -6〜+6deg
  };
}

const overlayStyle: React.CSSProperties = {
  position: "absolute",
  inset: 0,
  width: "100%",
  height: "100%",
  pointerEvents: "none",
};

/** 装飾パターン（白の半透明・SVG）。ハッシュで5種から選ばれる。 */
function PatternOverlay({ pattern }: { pattern: number }) {
  // 同じ画面に複数のカバーが並ぶため、SVGパターンのidはインスタンスごとに一意にする
  const uid = useId();
  const fill = "rgba(255,255,255,.20)";
  const stroke = "rgba(255,255,255,.22)";
  if (pattern === 0) {
    // きらめき（4方向スター）
    const star = (cx: number, cy: number, r: number) =>
      `M${cx} ${cy - r} Q${cx + r * 0.18} ${cy - r * 0.18} ${cx + r} ${cy} Q${cx + r * 0.18} ${cy + r * 0.18} ${cx} ${cy + r} Q${cx - r * 0.18} ${cy + r * 0.18} ${cx - r} ${cy} Q${cx - r * 0.18} ${cy - r * 0.18} ${cx} ${cy - r}Z`;
    return (
      <svg aria-hidden viewBox="0 0 100 100" preserveAspectRatio="xMidYMid slice" style={overlayStyle}>
        <path d={star(22, 26, 13)} fill={fill} />
        <path d={star(72, 14, 7)} fill={fill} />
        <path d={star(88, 52, 9)} fill={fill} />
        <path d={star(46, 62, 5)} fill={fill} />
        <path d={star(12, 74, 6)} fill={fill} />
      </svg>
    );
  }
  if (pattern === 1) {
    // 水玉
    return (
      <svg aria-hidden viewBox="0 0 100 100" preserveAspectRatio="xMidYMid slice" style={overlayStyle}>
        <defs>
          <pattern id={`wc-dots-${uid}`} width="22" height="22" patternUnits="userSpaceOnUse">
            <circle cx="5" cy="5" r="3.2" fill={fill} />
            <circle cx="16" cy="16" r="2" fill="rgba(255,255,255,.13)" />
          </pattern>
        </defs>
        <rect width="100" height="100" fill={`url(#wc-dots-${uid})`} />
      </svg>
    );
  }
  if (pattern === 2) {
    // 斜めストライプ
    return (
      <svg aria-hidden viewBox="0 0 100 100" preserveAspectRatio="xMidYMid slice" style={overlayStyle}>
        <defs>
          <pattern id={`wc-stripes-${uid}`} width="16" height="16" patternTransform="rotate(-24)" patternUnits="userSpaceOnUse">
            <rect x="0" y="0" width="5" height="16" fill="rgba(255,255,255,.12)" />
          </pattern>
        </defs>
        <rect width="100" height="100" fill={`url(#wc-stripes-${uid})`} />
      </svg>
    );
  }
  if (pattern === 3) {
    // リング（右上から広がる同心円）
    return (
      <svg aria-hidden viewBox="0 0 100 100" preserveAspectRatio="xMidYMid slice" style={overlayStyle}>
        <circle cx="86" cy="12" r="16" fill="none" stroke={stroke} strokeWidth="2.5" />
        <circle cx="86" cy="12" r="30" fill="none" stroke="rgba(255,255,255,.15)" strokeWidth="2" />
        <circle cx="86" cy="12" r="46" fill="none" stroke="rgba(255,255,255,.10)" strokeWidth="1.6" />
        <circle cx="12" cy="86" r="10" fill="none" stroke="rgba(255,255,255,.14)" strokeWidth="2" />
      </svg>
    );
  }
  // 花びら（散らし）
  return (
    <svg aria-hidden viewBox="0 0 100 100" preserveAspectRatio="xMidYMid slice" style={overlayStyle}>
      <ellipse cx="16" cy="70" rx="7" ry="4" fill={fill} transform="rotate(-30 16 70)" />
      <ellipse cx="32" cy="82" rx="5.5" ry="3" fill="rgba(255,255,255,.16)" transform="rotate(20 32 82)" />
      <ellipse cx="8" cy="46" rx="5" ry="2.8" fill="rgba(255,255,255,.15)" transform="rotate(-60 8 46)" />
      <ellipse cx="46" cy="30" rx="4.5" ry="2.6" fill="rgba(255,255,255,.13)" transform="rotate(35 46 30)" />
      <ellipse cx="70" cy="72" rx="6" ry="3.4" fill="rgba(255,255,255,.14)" transform="rotate(-15 70 72)" />
      <ellipse cx="80" cy="26" rx="4" ry="2.4" fill="rgba(255,255,255,.12)" transform="rotate(50 80 26)" />
    </svg>
  );
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
  const d = workDesign(name);
  const initial = Array.from(name.trim())[0] ?? "？";
  return (
    <div
      style={{
        position: "relative",
        width: "100%",
        height: "100%",
        borderRadius: radius,
        overflow: "hidden",
        background: d.background,
      }}
    >
      {/* 装飾パターン（作品ごとに5種から固定） */}
      <PatternOverlay pattern={d.pattern} />

      {/* 左上からの柔らかい光 */}
      <div
        aria-hidden
        style={{
          ...overlayStyle,
          background: "radial-gradient(120% 90% at 18% 0%, rgba(255,255,255,.24), rgba(255,255,255,0) 55%)",
        }}
      />

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
          transform: `rotate(${d.watermarkRotate}deg)`,
        }}
      >
        {initial}
      </span>

      {showName && (
        <>
          {/* 下部スクリム（文字の可読性） */}
          <div
            aria-hidden
            style={{
              position: "absolute",
              left: 0,
              right: 0,
              bottom: 0,
              height: "52%",
              background: "linear-gradient(180deg, rgba(30,20,50,0), rgba(30,20,50,.30))",
              pointerEvents: "none",
            }}
          />
          <span
            style={{
              position: "absolute",
              left: 10,
              right: 10,
              bottom: 8,
              fontSize: nameSize,
              fontWeight: 700,
              lineHeight: 1.35,
              letterSpacing: 0.2,
              color: "#fff",
              textShadow: "0 1px 6px rgba(30,20,50,.4)",
              display: "-webkit-box",
              WebkitLineClamp: 2,
              WebkitBoxOrient: "vertical",
              overflow: "hidden",
              textAlign: "left",
            }}
          >
            {name}
          </span>
        </>
      )}
    </div>
  );
}
