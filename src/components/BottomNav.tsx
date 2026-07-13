"use client";

import type { ReactNode } from "react";
import { colors, shadow } from "@/lib/tokens";
import { useRouter } from "./AppRouter";
import { BellIcon, HomeIcon, PlusIcon, SearchIcon, UserIcon } from "./icons";
import { useAuth } from "@/lib/auth/useAuth";
import { useNotifications } from "@/lib/queries/notifications";
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
  badge,
}: {
  active: boolean;
  label: string;
  onClick: () => void;
  icon: (color: string) => ReactNode;
  /** 未読件数。0/未指定ならバッジ非表示。 */
  badge?: number;
}) {
  const color = active ? colors.primary : colors.textMutedSoft;
  return (
    <button onClick={onClick} style={navBtn} aria-label={label} aria-current={active}>
      <span style={{ position: "relative", display: "inline-flex" }}>
        {icon(color)}
        {badge != null && badge > 0 && (
          <span
            aria-label={`未読${badge}件`}
            style={{
              position: "absolute",
              top: -4,
              right: -7,
              minWidth: 15,
              height: 15,
              padding: "0 4px",
              borderRadius: 999,
              background: colors.pink,
              color: colors.white,
              fontSize: 9,
              fontWeight: 700,
              lineHeight: "15px",
              textAlign: "center",
              boxShadow: "0 0 0 2px #fff",
            }}
          >
            {badge > 9 ? "9+" : badge}
          </span>
        )}
      </span>
      <span style={{ fontSize: 9.5, color, fontWeight: 600 }}>{label}</span>
    </button>
  );
}

/** Bottom tab bar. Center + button is always the accented FAB. */
export function BottomNav() {
  const { tab, nav } = useRouter();
  const is = (t: Tab) => tab === t;
  const { user } = useAuth();
  const notifs = useNotifications(user?.id);
  const unread = notifs.data?.filter((n) => n.unread).length ?? 0;

  return (
    <div
      className="pt-bottomnav"
      style={{
        flex: "0 0 72px",
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
        badge={unread}
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
