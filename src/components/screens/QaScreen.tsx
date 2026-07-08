"use client";

import { colors } from "@/lib/tokens";
import { qaItems } from "@/lib/data";
import { useRouter } from "../AppRouter";
import { AppBar } from "../ui";
import { MessageIcon } from "../icons";

export function QaScreen() {
  const { back, nav } = useRouter();

  return (
    <div>
      <AppBar
        title="知恵袋（Q&A）"
        onBack={back}
        right={
          <button
            onClick={() => nav("qaDetail")}
            style={{
              border: "none",
              background: colors.primary,
              color: colors.white,
              fontFamily: "inherit",
              fontSize: 11.5,
              fontWeight: 700,
              padding: "6px 12px",
              borderRadius: 999,
              cursor: "pointer",
              whiteSpace: "nowrap",
            }}
          >
            質問する
          </button>
        }
      />

      <div style={{ padding: "10px 22px 30px", display: "flex", flexDirection: "column", gap: 12 }}>
        {qaItems.map((q) => (
          <button
            key={q.key}
            onClick={() => nav("qaDetail")}
            style={{
              border: `1px solid ${colors.borderSoft}`,
              borderRadius: 16,
              padding: 15,
              background: colors.white,
              cursor: "pointer",
              fontFamily: "inherit",
              textAlign: "left",
              width: "100%",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
              {q.solved && (
                <span
                  style={{
                    fontSize: 9.5,
                    fontWeight: 700,
                    color: colors.positive,
                    background: "#E7F4EC",
                    padding: "3px 8px",
                    borderRadius: 999,
                  }}
                >
                  解決済
                </span>
              )}
              <span
                style={{
                  fontSize: 10.5,
                  color: colors.primary,
                  background: colors.primaryBg1,
                  padding: "3px 9px",
                  borderRadius: 999,
                }}
              >
                {q.tag}
              </span>
            </div>
            <div style={{ fontSize: 14, fontWeight: 700, color: colors.textPrimary, lineHeight: 1.5, marginTop: 9 }}>
              {q.title}
            </div>
            <p
              style={{
                margin: "6px 0 0",
                fontSize: 12,
                color: colors.textMutedAlt,
                lineHeight: 1.7,
                overflow: "hidden",
                display: "-webkit-box",
                WebkitLineClamp: 2,
                WebkitBoxOrient: "vertical",
              }}
            >
              {q.excerpt}
            </p>
            <div style={{ display: "flex", alignItems: "center", gap: 5, marginTop: 10, fontSize: 11, color: colors.textSecondaryAlt }}>
              <MessageIcon size={14} color={colors.textMutedSoft} />
              回答 {q.answers}件
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
