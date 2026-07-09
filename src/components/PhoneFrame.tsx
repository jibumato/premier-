"use client";

import type { ReactNode } from "react";
import { colors, shadow } from "@/lib/tokens";
import { StatusBar } from "./StatusBar";
import { BottomNav } from "./BottomNav";
import { useRouter } from "./AppRouter";

/** Pre-login / full-bleed screens that hide the bottom tab bar. */
const CHROMELESS = new Set(["onboardRole", "onboardWorks", "onboardVerify"]);

/**
 * 390px mobile frame (the only breakpoint the design covers). The status bar
 * and bottom nav are fixed; `children` scroll inside the middle region. The
 * bottom nav persists on every logged-in screen, but is hidden for the
 * pre-login onboarding flow (chromeless).
 */
export function PhoneFrame({
  children,
  forceChromeless = false,
}: {
  children: ReactNode;
  /** Hide the bottom nav regardless of the current router screen (e.g. the auth gate). */
  forceChromeless?: boolean;
}) {
  const { scrollRef, screen } = useRouter();
  const chromeless = forceChromeless || CHROMELESS.has(screen);

  return (
    <div
      style={{
        width: 390,
        height: 822,
        maxWidth: "100vw",
        background: colors.white,
        borderRadius: 46,
        overflow: "hidden",
        position: "relative",
        boxShadow: shadow.phone,
      }}
    >
      <StatusBar />
      <div
        ref={scrollRef}
        className="pt-scroll"
        style={{
          position: "absolute",
          top: 44,
          bottom: chromeless ? 0 : 72,
          left: 0,
          right: 0,
          overflowY: "auto",
        }}
      >
        {children}
      </div>
      {!chromeless && <BottomNav />}
    </div>
  );
}
