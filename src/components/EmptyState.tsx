"use client";

import { colors } from "@/lib/tokens";

/**
 * Friendly empty state for list screens once a backend is connected but there
 * is no data yet (launch day, filtered-to-empty, etc.). Prototype/mock mode
 * always has seed data, so this only appears in the real, connected app.
 */
export function EmptyState({
  icon,
  title,
  body,
  action,
}: {
  icon?: string;
  title: string;
  body?: string;
  action?: React.ReactNode;
}) {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        textAlign: "center",
        padding: "40px 30px",
        gap: 10,
      }}
    >
      {icon && (
        <div
          style={{
            width: 60,
            height: 60,
            borderRadius: "50%",
            background: "linear-gradient(155deg,#F2EDFB,#F7EEF6)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 26,
            lineHeight: 1,
          }}
        >
          {icon}
        </div>
      )}
      <div style={{ fontSize: 14, fontWeight: 700, color: colors.textPrimary }}>{title}</div>
      {body && (
        <p style={{ margin: 0, fontSize: 12, color: colors.textMutedAlt, lineHeight: 1.8, maxWidth: 260 }}>{body}</p>
      )}
      {action && <div style={{ marginTop: 6 }}>{action}</div>}
    </div>
  );
}
