import type { CSSProperties } from "react";
import { colors } from "@/lib/tokens";

interface ImageSlotProps {
  /** border radius in px; use 999 for a circle-ish pill, "full" via circle prop */
  radius?: number;
  circle?: boolean;
  /** optional caption shown inside the empty slot (e.g. "参考") */
  label?: string;
  style?: CSSProperties;
}

/**
 * Placeholder for a user image. In the design bundle every photo is an empty
 * `image-slot`; in production this becomes an <Image> backed by object storage
 * + CDN. Here it renders a neutral image well so layouts read faithfully.
 */
export function ImageSlot({ radius = 12, circle = false, label, style }: ImageSlotProps) {
  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        borderRadius: circle ? "50%" : radius,
        background: `linear-gradient(135deg, ${colors.primaryBg1}, ${colors.primaryBg3})`,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: 4,
        color: colors.textMutedSoft,
        overflow: "hidden",
        ...style,
      }}
    >
      <svg
        width="26%"
        height="26%"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
        style={{ maxWidth: 30, maxHeight: 30, minWidth: 16, minHeight: 16, opacity: 0.85 }}
      >
        <rect x="3" y="3" width="18" height="18" rx="3" />
        <circle cx="8.5" cy="8.5" r="1.6" />
        <path d="M21 15l-5-5L5 21" />
      </svg>
      {label ? (
        <span style={{ fontSize: 10, color: colors.textMutedSoft }}>{label}</span>
      ) : null}
    </div>
  );
}
