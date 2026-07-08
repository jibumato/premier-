"use client";

import type { CSSProperties, ReactNode } from "react";
import { colors } from "@/lib/tokens";
import { ChevronLeftIcon } from "./icons";

/** Standard top app bar: back chevron + centered title + optional right slot. */
export function AppBar({
  title,
  onBack,
  right,
}: {
  title: string;
  onBack: () => void;
  right?: ReactNode;
}) {
  return (
    <div
      style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        padding: "10px 18px 8px",
      }}
    >
      <button
        onClick={onBack}
        style={{ background: "none", border: "none", cursor: "pointer", padding: 0, flex: "0 0 auto" }}
        aria-label="戻る"
      >
        <ChevronLeftIcon size={24} />
      </button>
      <div style={{ fontSize: 14, fontWeight: 600, color: colors.textPrimaryAlt }}>{title}</div>
      <div style={{ flex: "0 0 auto", minWidth: 24, display: "flex", justifyContent: "flex-end" }}>
        {right}
      </div>
    </div>
  );
}

/** iOS-style toggle switch. */
export function Toggle({
  on,
  onChange,
  ariaLabel,
}: {
  on: boolean;
  onChange: (v: boolean) => void;
  ariaLabel: string;
}) {
  return (
    <button
      role="switch"
      aria-checked={on}
      aria-label={ariaLabel}
      onClick={() => onChange(!on)}
      style={{
        width: 44,
        height: 26,
        borderRadius: 99,
        background: on ? colors.primary : "#DAD5E6",
        position: "relative",
        flex: "0 0 auto",
        border: "none",
        cursor: "pointer",
        padding: 0,
        transition: "background .15s ease",
      }}
    >
      <span
        style={{
          width: 20,
          height: 20,
          borderRadius: "50%",
          background: colors.white,
          position: "absolute",
          top: 3,
          left: on ? 21 : 3,
          transition: "left .15s ease",
          boxShadow: "0 1px 3px rgba(0,0,0,.2)",
        }}
      />
    </button>
  );
}

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
