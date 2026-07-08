import type { CSSProperties, ReactNode } from "react";
import { colors } from "@/lib/tokens";

/** Section heading: colored accent bar + title, used across screens. */
export function SectionHeading({
  children,
  accent = colors.primary,
  size = 17,
  right,
}: {
  children: ReactNode;
  accent?: string;
  size?: number;
  right?: ReactNode;
}) {
  return (
    <div
      style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "baseline",
      }}
    >
      <div style={{ display: "flex", alignItems: "baseline", gap: 9 }}>
        <div style={{ width: 4, height: 16, borderRadius: 2, background: accent }} />
        <h2 style={{ margin: 0, fontSize: size, fontWeight: 700, color: colors.textPrimary }}>
          {children}
        </h2>
      </div>
      {right}
    </div>
  );
}

/** Primary lavender CTA button. */
export function PrimaryButton({
  children,
  onClick,
  style,
}: {
  children: ReactNode;
  onClick?: () => void;
  style?: CSSProperties;
}) {
  return (
    <button
      onClick={onClick}
      style={{
        width: "100%",
        border: "none",
        background: colors.primary,
        color: colors.white,
        fontFamily: "inherit",
        fontSize: 15,
        fontWeight: 700,
        padding: 15,
        borderRadius: 14,
        cursor: "pointer",
        ...style,
      }}
    >
      {children}
    </button>
  );
}
