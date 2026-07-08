"use client";

import { colors } from "@/lib/tokens";
import { marketItems } from "@/lib/data";
import { useRouter } from "../AppRouter";
import { ImageSlot } from "../ImageSlot";
import { AppBar } from "../ui";

export function MarketScreen() {
  const { back, nav } = useRouter();

  return (
    <div>
      <AppBar title="フリマ（衣装売買）" onBack={back} />

      {/* note: peer-to-peer, in-app payment not yet implemented */}
      <div style={{ padding: "6px 22px 0" }}>
        <div
          style={{
            fontSize: 11,
            color: colors.textMutedAlt,
            background: colors.primaryBg4,
            border: `1px solid ${colors.borderSoft}`,
            borderRadius: 12,
            padding: "10px 12px",
            lineHeight: 1.6,
          }}
        >
          衣装・小道具の個人間売買スペースです。取引は出品者と直接メッセージで行います。
        </div>
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: 12,
          padding: "16px 22px 30px",
        }}
      >
        {marketItems.map((it) => (
          <button
            key={it.key}
            onClick={() => nav("marketDetail")}
            style={{
              border: `1px solid ${colors.borderSoft}`,
              borderRadius: 16,
              background: colors.white,
              padding: 0,
              overflow: "hidden",
              cursor: "pointer",
              fontFamily: "inherit",
              textAlign: "left",
            }}
          >
            <div style={{ position: "relative", height: 118 }}>
              <ImageSlot radius={0} />
              {it.sold && (
                <div
                  style={{
                    position: "absolute",
                    inset: 0,
                    background: "rgba(42,38,52,.45)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <span
                    style={{
                      fontSize: 12,
                      fontWeight: 700,
                      color: colors.white,
                      border: "1.5px solid #fff",
                      borderRadius: 999,
                      padding: "4px 12px",
                    }}
                  >
                    SOLD
                  </span>
                </div>
              )}
              <span
                style={{
                  position: "absolute",
                  left: 6,
                  top: 6,
                  fontSize: 9,
                  fontWeight: 600,
                  color: colors.primary,
                  background: "rgba(255,255,255,.94)",
                  padding: "3px 8px",
                  borderRadius: 999,
                }}
              >
                {it.size}
              </span>
            </div>
            <div style={{ padding: "9px 11px 12px" }}>
              <div
                style={{
                  fontSize: 12,
                  fontWeight: 700,
                  color: colors.textPrimary,
                  lineHeight: 1.4,
                  overflow: "hidden",
                  display: "-webkit-box",
                  WebkitLineClamp: 2,
                  WebkitBoxOrient: "vertical",
                  minHeight: 34,
                }}
              >
                {it.title}
              </div>
              <div style={{ fontSize: 10.5, color: colors.textMutedAlt, marginTop: 5 }}>{it.work}</div>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "baseline",
                  marginTop: 7,
                }}
              >
                <span style={{ fontSize: 15, fontWeight: 700, color: colors.textPrimary }}>{it.price}</span>
                <span style={{ fontSize: 10, color: colors.textMutedAlt }}>{it.condition}</span>
              </div>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
