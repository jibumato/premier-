"use client";

import type { ReactNode } from "react";
import { colors, shadow } from "@/lib/tokens";
import { useRouter } from "./AppRouter";
import { BellIcon, HomeIcon, PlusIcon, SearchIcon, UserIcon } from "./icons";
import type { Tab } from "@/lib/types";

const navBtn: React.CSSProperties = {
  background: "none",
  border: "none",
  fontFamily: "inherit",
  cursor: "pointer",
  padding: 0,
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  gap: 3,
  flex: 1,
};

function NavItem({
  active,
  label,
  onClick,
  icon,
}: {
  active: boolean;
  label: string;
  onClick: () => void;
  icon: (color: string) => ReactNode;
}) {
  const color = active ? colors.primary : colors.textMutedSoft;
  return (
    <button onClick={onClick} style={navBtn} aria-label={label} aria-current={active}>
      {icon(color)}
      <span style={{ fontSize: 9.5, color, fontWeight: 600 }}>{label}</span>
    </button>
  );
}

/** Bottom tab bar. Center + button is always the accented FAB. */
export function BottomNav() {
  const { tab, nav } = useRouter();
  const is = (t: Tab) => tab === t;

  return (
    <div
      style={{
        position: "absolute",
        bottom: 0,
        left: 0,
        right: 0,
        height: 72,
        background: "rgba(255,255,255,.96)",
        backdropFilter: "blur(10px)",
        WebkitBackdropFilter: "blur(10px)",
        borderTop: `1px solid ${colors.borderSofter}`,
        display: "flex",
        alignItems: "center",
        padding: "0 12px 14px",
        zIndex: 20,
      }}
    >
      <NavItem
        active={is("home")}
        label="ホーム"
        onClick={() => nav("home", "home")}
        icon={(c) => <HomeIcon color={c} />}
      />
      <NavItem
        active={is("search")}
        label="さがす"
        onClick={() => nav("search", "search")}
        icon={(c) => <SearchIcon size={23} color={c} />}
      />
      {/* center FAB */}
      <button onClick={() => nav("create")} style={navBtn} aria-label="併せ募集を作成">
        <span
          style={{
            width: 46,
            height: 46,
            borderRadius: 16,
            background: `linear-gradient(135deg, ${colors.primary}, ${colors.primaryGradientLight})`,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            boxShadow: shadow.fab,
            marginTop: -8,
          }}
        >
          <PlusIcon />
        </span>
      </button>
      <NavItem
        active={is("notify")}
        label="おしらせ"
        onClick={() => nav("notify", "notify")}
        icon={(c) => <BellIcon color={c} />}
      />
      <NavItem
        active={is("mypage")}
        label="マイページ"
        onClick={() => nav("profile", "mypage")}
        icon={(c) => <UserIcon color={c} />}
      />
    </div>
  );
}
