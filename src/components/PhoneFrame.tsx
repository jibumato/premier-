"use client";

import type { ReactNode } from "react";
import { colors, shadow } from "@/lib/tokens";
import { StatusBar } from "./StatusBar";
import { BottomNav } from "./BottomNav";
import { useRouter } from "./AppRouter";

/**
 * 390px mobile frame (the only breakpoint the design covers). The status bar
 * and bottom nav are fixed; `children` scroll inside the middle region.
 * Matching the prototype, the bottom nav persists on every screen.
 */
export function PhoneFrame({ children }: { children: ReactNode }) {
  const { scrollRef } = useRouter();

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
          bottom: 72,
          left: 0,
          right: 0,
          overflowY: "auto",
        }}
      >
        {children}
      </div>
      <BottomNav />
    </div>
  );
}
