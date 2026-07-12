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

export function CameraIcon({ size = 24, color = "#8B84A0", style }: IconProps) {
  return (
    <svg {...base(size, color, style)} strokeWidth={1.7}>
      <path d="M4 8a2 2 0 012-2h2l1.5-2h5L16 6h2a2 2 0 012 2v9a2 2 0 01-2 2H6a2 2 0 01-2-2z" />
      <circle cx="12" cy="12.5" r="3.2" />
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

/** Dashed "ghost" of the verified badge — the empty slot shown before a user
 * has completed identity verification (tap → 本人確認). */
export function VerifiedBadgeGhost({ size = 15, color = "#B4AEC0", style }: { size?: number; color?: string; style?: CSSProperties }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" style={style}>
      <path
        d="M12 2l2.4 1.8 3-.3 1 2.8 2.6 1.5-.8 2.9.8 2.9-2.6 1.5-1 2.8-3-.3L12 22l-2.4-1.8-3 .3-1-2.8L3 16.4l.8-2.9L3 10.6l2.6-1.5 1-2.8 3 .3z"
        fill="none"
        stroke={color}
        strokeWidth="1.4"
        strokeDasharray="2.4 2"
      />
      <path
        d="M9 12l2 2 4-4"
        fill="none"
        stroke={color}
        strokeWidth="1.6"
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

export function ChevronRightIcon({ size = 18, color = "#B4AEC0", style }: IconProps) {
  return (
    <svg {...base(size, color, style)}>
      <path d="M9 5l7 7-7 7" />
    </svg>
  );
}

export function MessageIcon({ size = 23, color = "#2A2634", style }: IconProps) {
  return (
    <svg {...base(size, color, style)} strokeWidth={1.7}>
      <path d="M21 11.5a8.4 8.4 0 01-9 8.4 9.5 9.5 0 01-4-.9L3 21l1.9-4a8.4 8.4 0 01-.9-4A8.4 8.4 0 0112 4a8.4 8.4 0 019 7.5z" />
    </svg>
  );
}

export function SettingsIcon({ size = 22, color = "#2A2634", style }: IconProps) {
  return (
    <svg {...base(size, color, style)} strokeWidth={1.7}>
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 15a1.6 1.6 0 00.3 1.8l.1.1a2 2 0 11-2.8 2.8l-.1-.1a1.6 1.6 0 00-1.8-.3 1.6 1.6 0 00-1 1.5V21a2 2 0 11-4 0v-.1a1.6 1.6 0 00-1-1.5 1.6 1.6 0 00-1.8.3l-.1.1a2 2 0 11-2.8-2.8l.1-.1a1.6 1.6 0 00.3-1.8 1.6 1.6 0 00-1.5-1H3a2 2 0 110-4h.1a1.6 1.6 0 001.5-1 1.6 1.6 0 00-.3-1.8l-.1-.1a2 2 0 112.8-2.8l.1.1a1.6 1.6 0 001.8.3H9a1.6 1.6 0 001-1.5V3a2 2 0 114 0v.1a1.6 1.6 0 001 1.5 1.6 1.6 0 001.8-.3l.1-.1a2 2 0 112.8 2.8l-.1.1a1.6 1.6 0 00-.3 1.8V9a1.6 1.6 0 001.5 1H21a2 2 0 110 4h-.1a1.6 1.6 0 00-1.5 1z" />
    </svg>
  );
}

export function CalendarIcon({ size = 20, color = "#6D5DAB", style }: IconProps) {
  return (
    <svg {...base(size, color, style)}>
      <rect x="3" y="4.5" width="18" height="17" rx="3" />
      <path d="M3 9h18M8 2.5v4M16 2.5v4" />
    </svg>
  );
}

export function BagIcon({ size = 20, color = "#6D5DAB", style }: IconProps) {
  return (
    <svg {...base(size, color, style)}>
      <path d="M5 8h14l-1 12a2 2 0 01-2 2H8a2 2 0 01-2-2L5 8z" />
      <path d="M9 8V6a3 3 0 016 0v2" />
    </svg>
  );
}

export function HelpIcon({ size = 20, color = "#6D5DAB", style }: IconProps) {
  return (
    <svg {...base(size, color, style)}>
      <circle cx="12" cy="12" r="9" />
      <path d="M9.2 9.2a2.8 2.8 0 015.4 1c0 1.9-2.8 2.8-2.8 2.8" />
      <circle cx="12" cy="17" r="0.6" fill={color} stroke="none" />
    </svg>
  );
}

export function FlagIcon({ size = 20, color = "#B0538D", style }: IconProps) {
  return (
    <svg {...base(size, color, style)}>
      <path d="M5 21V4M5 4h11l-1.5 4L16 12H5" />
    </svg>
  );
}

export function SendIcon({ size = 20, color = "#fff", style }: IconProps) {
  return (
    <svg {...base(size, color, style)}>
      <path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z" />
    </svg>
  );
}

export function ShieldIcon({ size = 40, color = "#6D5DAB", style }: IconProps) {
  return (
    <svg {...base(size, color, style)} strokeWidth={1.6}>
      <path d="M12 3l7 3v5c0 5-3.5 8.5-7 10-3.5-1.5-7-5-7-10V6l7-3z" />
      <path d="M9 12l2 2 4-4" />
    </svg>
  );
}

/** Star for ratings; filled when `filled`. */
export function StarIcon({
  size = 20,
  filled = false,
  color = "#E0A93B",
  style,
}: IconProps & { filled?: boolean }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill={filled ? color : "none"}
      stroke={color}
      strokeWidth={1.6}
      strokeLinecap="round"
      strokeLinejoin="round"
      style={style}
    >
      <path d="M12 2.5l2.9 6 6.6.9-4.8 4.6 1.2 6.5L12 17.8 6.1 20.5l1.2-6.5L2.5 9.4l6.6-.9z" />
    </svg>
  );
}

/** Building/company icon for the corporate landing. */
export function BuildingIcon({ size = 40, color = "#6D5DAB", style }: IconProps) {
  return (
    <svg {...base(size, color, style)} strokeWidth={1.6}>
      <rect x="4" y="3" width="16" height="18" rx="2" />
      <path d="M9 7h1M14 7h1M9 11h1M14 11h1M9 15h1M14 15h1M10 21v-3h4v3" />
    </svg>
  );
}
