"use client";

import { colors } from "@/lib/tokens";

/** Three-segment progress bar for the onboarding flow (step: 1–3). */
export function OnboardProgress({ step }: { step: 1 | 2 | 3 }) {
  return (
    <div style={{ padding: "14px 22px 0" }}>
      <div style={{ display: "flex", gap: 6 }}>
        {[1, 2, 3].map((n) => (
          <div
            key={n}
            style={{
              flex: 1,
              height: 4,
              borderRadius: 99,
              background: n <= step ? colors.primary : "#EEEAF6",
            }}
          />
        ))}
      </div>
    </div>
  );
}
