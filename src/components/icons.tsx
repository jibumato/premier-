/**
 * Feather-style line icons (stroke-width 1.6–2, round caps/joins),
 * matching the inline SVGs used in the design handoff.
 */
import type { CSSProperties } from "react";

interface IconProps {
  size?: number;
  color?: string;
  style?: CSSProperties;
}

const base = (size: number, color: string, style?: CSSProperties) => ({
  width: size,
  height: size,
  viewBox: "0 0 24 24",
  fill: "none" as const,
  stroke: color,
  strokeWidth: 1.8,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
  style,
});

export function BellIcon({ size = 23, color = "#2A2634", style }: IconProps) {
  return (
    <svg {...base(size, color, style)} strokeWidth={1.7}>
      <path d="M18 8a6 6 0 00-12 0c0 7-3 9-3 9h18s-3-2-3-9M13.7 21a2 2 0 01-3.4 0" />
    </svg>
  );
}

export function SearchIcon({ size = 18, color = "#6D5DAB", style }: IconProps) {
  return (
    <svg {...base(size, color, style)}>
      <circle cx="11" cy="11" r="7" />
      <path d="M20 20l-3.2-3.2" />
    </svg>
  );
}

export function ChevronLeftIcon({ size = 23, color = "#2A2634", style }: IconProps) {
  return (
    <svg {...base(size, color, style)} strokeWidth={1.7}>
      <path d="M15 5l-7 7 7 7" />
    </svg>
  );
}

export function ChevronDownIcon({ size = 18, color = "#B4AEC0", style }: IconProps) {
  return (
    <svg {...base(size, color, style)}>
      <path d="M6 9l6 6 6-6" />
    </svg>
  );
}

export function ShareIcon({ size = 24, color = "#2A2634", style }: IconProps) {
  return (
    <svg {...base(size, color, style)} strokeWidth={1.7}>
      <path d="M4 12v7a1 1 0 001 1h14a1 1 0 001-1v-7" />
      <path d="M16 6l-4-4-4 4M12 2v13" />
    </svg>
  );
}

export function SlidersIcon({ size = 12, color = "#fff", style }: IconProps) {
  return (
    <svg {...base(size, color, style)} strokeWidth={2}>
      <path d="M4 6h16M7 12h10M10 18h4" />
    </svg>
  );
}

export function PinIcon({ size = 11, color = "#8B84A0", style }: IconProps) {
  return (
    <svg {...base(size, color, style)}>
      <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0116 0z" />
      <circle cx="12" cy="10" r="2.6" />
    </svg>
  );
}

export function CheckIcon({ size = 46, color = "#6D5DAB", style }: IconProps) {
  return (
    <svg {...base(size, color, style)} strokeWidth={1.6}>
      <path d="M5 13l4 4L19 7" />
    </svg>
  );
}

export function SparkleIcon({ size = 44, color = "#D06CA3", style }: IconProps) {
  return (
    <svg {...base(size, color, style)} strokeWidth={1.6}>
      <path d="M12 2l2.2 6.6L21 11l-6.8 2.4L12 20l-2.2-6.6L3 11l6.8-2.4z" />
    </svg>
  );
}

export function PlusIcon({ size = 24, color = "#fff", style }: IconProps) {
  return (
    <svg {...base(size, color, style)} strokeWidth={2.2}>
      <path d="M12 5v14M5 12h14" />
    </svg>
  );
}

export function HomeIcon({ size = 23, color = "#B4AEC0", style }: IconProps) {
  return (
    <svg {...base(size, color, style)}>
      <path d="M4 11l8-7 8 7M6 10v9a1 1 0 001 1h10a1 1 0 001-1v-9" />
    </svg>
  );
}

export function UserIcon({ size = 23, color = "#B4AEC0", style }: IconProps) {
  return (
    <svg {...base(size, color, style)}>
      <circle cx="12" cy="8" r="4" />
      <path d="M4 21c0-4.4 3.6-7 8-7s8 2.6 8 7" />
    </svg>
  );
}

/** Filled heart (like badge). */
export function HeartIcon({ size = 8, color = "#fff", style }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill={color} style={style}>
      <path d="M12 20s-7-4.4-7-9.4A3.5 3.5 0 0112 8a3.5 3.5 0 017 2.6c0 5-7 9.4-7 9.4z" />
    </svg>
  );
}

/** Verified shield badge (filled). */
export function VerifiedBadge({ size = 16, style }: { size?: number; style?: CSSProperties }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="#6D5DAB" style={style}>
      <path d="M12 2l2.4 1.8 3-.3 1 2.8 2.6 1.5-.8 2.9.8 2.9-2.6 1.5-1 2.8-3-.3L12 22l-2.4-1.8-3 .3-1-2.8L3 16.4l.8-2.9L3 10.6l2.6-1.5 1-2.8 3 .3z" />
      <path
        d="M9 12l2 2 4-4"
        fill="none"
        stroke="#fff"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

/** Crown/meister emblem (filled). */
export function MeisterIcon({ size = 12, color = "#B063A0", style }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill={color} style={style}>
      <path d="M5 16L3 5l5.5 4L12 4l3.5 5L21 5l-2 11z" />
    </svg>
  );
}
