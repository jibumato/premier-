"use client";

import type { ReactNode } from "react";
import { colors } from "@/lib/tokens";
import { BottomNav } from "./BottomNav";
import { Sidebar } from "./Sidebar";
import { useRouter } from "./AppRouter";

/** Pre-login / full-bleed screens that hide the bottom tab bar. */
const CHROMELESS = new Set(["onboardRole", "onboardWorks", "onboardVerify", "login"]);

/**
 * Responsive app shell.
 *
 * - Mobile (≤640px): a full-bleed column — content with a bottom tab bar at the
 *   base. Feels like a native phone app.
 * - Desktop (≥641px): a centered app window with a left `Sidebar` and a wide
 *   content column. The bottom nav is hidden (see the `.pt-frame` /
 *   `.pt-bottomnav` rules in globals.css).
 *
 * Layout is flexbox in both cases; the breakpoints only swap which chrome is
 * visible, so screen bodies render unchanged in either mode.
 */
export function PhoneFrame({
  children,
  forceChromeless = false,
}: {
  children: ReactNode;
  /** Hide the nav chrome regardless of the current router screen (e.g. the auth gate). */
  forceChromeless?: boolean;
}) {
  const { scrollRef, screen } = useRouter();
  const chromeless = forceChromeless || CHROMELESS.has(screen);

  return (
    <div className="pt-frame" style={{ background: colors.white }}>
      {!chromeless && <Sidebar />}
      <div className="pt-col">
        <div ref={scrollRef} className="pt-scroll">
          {children}
        </div>
        {!chromeless && <BottomNav />}
      </div>
    </div>
  );
}
