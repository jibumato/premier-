"use client";

import type { ReactNode } from "react";
import { colors, shadow } from "@/lib/tokens";
import { useRouter } from "./AppRouter";
import { BellIcon, CalendarIcon, HelpIcon, HomeIcon, PlusIcon, SearchIcon, UserIcon } from "./icons";
import type { Screen, Tab } from "@/lib/types";

/**
 * Desktop-only left navigation. Hidden on ≤640px via the `.pt-sidebar` media
 * query in globals.css (the mobile bottom tab bar takes over there). Mirrors the
 * BottomNav destinations so the two stay in sync.
 */

const primary: { tab: Tab; screen: Screen; label: string; icon: (c: string) => ReactNode }[] = [
  { tab: "home", screen: "home", label: "ホーム", icon: (c) => <HomeIcon color={c} /> },
  { tab: "search", screen: "search", label: "さがす", icon: (c) => <SearchIcon size={22} color={c} /> },
  { tab: "notify", screen: "notify", label: "おしらせ", icon: (c) => <BellIcon color={c} /> },
  { tab: "mypage", screen: "profile", label: "マイページ", icon: (c) => <UserIcon color={c} /> },
];

const secondary: { screen: Screen; label: string; icon: (c: string) => ReactNode }[] = [
  { screen: "events", label: "イベント", icon: (c) => <CalendarIcon size={20} color={c} /> },
  { screen: "qa", label: "知恵袋", icon: (c) => <HelpIcon size={20} color={c} /> },
];

function Row({
  active,
  label,
  icon,
  onClick,
}: {
  active: boolean;
  label: string;
  icon: (c: string) => ReactNode;
  onClick: () => void;
}) {
  const color = active ? colors.primary : colors.textSecondaryAlt;
  return (
    <button
      onClick={onClick}
      aria-current={active}
      style={{
        display: "flex",
        alignItems: "center",
        gap: 13,
        width: "100%",
        border: "none",
        background: active ? colors.primaryBg1 : "transparent",
        color,
        fontFamily: "inherit",
        fontSize: 14,
        fontWeight: active ? 700 : 500,
        padding: "11px 14px",
        borderRadius: 12,
        cursor: "pointer",
        textAlign: "left",
      }}
    >
      <span style={{ width: 24, display: "flex", justifyContent: "center" }}>{icon(color)}</span>
      {label}
    </button>
  );
}

export function Sidebar() {
  const { tab, screen, nav } = useRouter();

  return (
    <nav
      className="pt-sidebar"
      style={{
        width: 232,
        flex: "0 0 232px",
        flexDirection: "column",
        borderRight: `1px solid ${colors.borderSofter}`,
        padding: "24px 16px 20px",
        background: colors.white,
      }}
    >
      <div
        style={{
          fontSize: 22,
          fontWeight: 700,
          color: colors.textPrimary,
          padding: "0 12px 22px",
          fontFamily: '"Zen Maru Gothic", "Zen Kaku Gothic New", sans-serif',
        }}
      >
        プルミエ<span style={{ color: colors.primary }}>！</span>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
        {primary.map((it) => (
          <Row
            key={it.label}
            active={tab === it.tab}
            label={it.label}
            icon={it.icon}
            onClick={() => nav(it.screen, it.tab)}
          />
        ))}
      </div>

      <button
        onClick={() => nav("create")}
        style={{
          marginTop: 18,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: 8,
          border: "none",
          background: `linear-gradient(135deg, ${colors.primary}, ${colors.primaryGradientLight})`,
          color: colors.white,
          fontFamily: "inherit",
          fontSize: 14,
          fontWeight: 700,
          padding: "12px 0",
          borderRadius: 14,
          cursor: "pointer",
          boxShadow: shadow.fab,
        }}
      >
        <PlusIcon size={18} color={colors.white} />
        併せを作る
      </button>

      <div
        style={{
          marginTop: 22,
          paddingTop: 16,
          borderTop: `1px solid ${colors.borderSofter}`,
          display: "flex",
          flexDirection: "column",
          gap: 4,
        }}
      >
        {secondary.map((it) => (
          <Row
            key={it.label}
            active={screen === it.screen}
            label={it.label}
            icon={it.icon}
            onClick={() => nav(it.screen)}
          />
        ))}
      </div>
    </nav>
  );
}
