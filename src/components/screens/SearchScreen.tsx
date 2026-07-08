"use client";

import { colors } from "@/lib/tokens";
import { regions, searchResults } from "@/lib/data";
import { useRouter } from "../AppRouter";
import { ImageSlot } from "../ImageSlot";
import { ChevronLeftIcon, PinIcon, SearchIcon, SlidersIcon } from "../icons";

export function SearchScreen() {
  const { back, nav, region, setRegion } = useRouter();

  const filtered =
    region === "すべて" ? searchResults : searchResults.filter((r) => r.region === region);
  const isEmpty = filtered.length === 0;

  return (
    <div>
      {/* app bar + search field */}
      <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 18px 0" }}>
        <button
          onClick={back}
          style={{ background: "none", border: "none", cursor: "pointer", padding: 0 }}
          aria-label="戻る"
        >
          <ChevronLeftIcon />
        </button>
        <div
          style={{
            flex: 1,
            display: "flex",
            alignItems: "center",
            gap: 9,
            border: `1px solid ${colors.border}`,
            borderRadius: 13,
            padding: "11px 14px",
            background: colors.primaryBg4,
          }}
        >
          <SearchIcon size={16} color={colors.textMuted} />
          <span style={{ fontSize: 13, color: colors.textPrimary, fontWeight: 500 }}>
            葬送のフリーレン
          </span>
        </div>
      </div>

      {/* filter chips */}
      <div
        className="noscroll"
        style={{ display: "flex", gap: 8, overflowX: "auto", padding: "14px 18px 0" }}
      >
        <span
          style={{
            display: "flex",
            alignItems: "center",
            gap: 5,
            fontSize: 12,
            fontWeight: 600,
            color: colors.white,
            background: colors.primary,
            padding: "8px 13px",
            borderRadius: 999,
            whiteSpace: "nowrap",
          }}
        >
          <SlidersIcon />
          絞り込み
        </span>
        {regions.map((r) => {
          const active = r === region;
          return (
            <button
              key={r}
              onClick={() => setRegion(r)}
              style={{
                fontSize: 12,
                color: active ? colors.white : "#4A4458",
                background: active ? colors.primary : colors.white,
                border: `1px solid ${active ? colors.primary : colors.border}`,
                padding: "8px 13px",
                borderRadius: 999,
                whiteSpace: "nowrap",
                fontWeight: active ? 600 : 400,
                cursor: "pointer",
                fontFamily: "inherit",
              }}
            >
              {r}
            </button>
          );
        })}
        <span
          style={{
            fontSize: 12,
            color: colors.pinkText,
            background: colors.pinkBg1,
            padding: "8px 13px",
            borderRadius: 999,
            whiteSpace: "nowrap",
            fontWeight: 600,
          }}
        >
          女性限定
        </span>
      </div>

      {/* tabs */}
      <div style={{ display: "flex", padding: "16px 18px 0" }}>
        <div
          style={{
            flex: 1,
            textAlign: "center",
            paddingBottom: 11,
            borderBottom: `2px solid ${colors.primary}`,
          }}
        >
          <span style={{ fontSize: 13.5, fontWeight: 700, color: colors.primary }}>
            併せ募集 {filtered.length}
          </span>
        </div>
        <div
          style={{
            flex: 1,
            textAlign: "center",
            paddingBottom: 11,
            borderBottom: "2px solid #EEEAF6",
          }}
        >
          <span style={{ fontSize: 13.5, fontWeight: 600, color: colors.textMutedAlt }}>
            レイヤー 58
          </span>
        </div>
        <div
          style={{
            flex: 1,
            textAlign: "center",
            paddingBottom: 11,
            borderBottom: "2px solid #EEEAF6",
          }}
        >
          <span style={{ fontSize: 13.5, fontWeight: 600, color: colors.textMutedAlt }}>投稿</span>
        </div>
      </div>

      {/* results / empty state */}
      <div
        style={{
          padding: "16px 18px 30px",
          display: "flex",
          flexDirection: "column",
          gap: 12,
        }}
      >
        {filtered.map((res) => (
          <button
            key={res.key}
            onClick={() => nav("detail")}
            style={{
              display: "flex",
              gap: 13,
              border: `1px solid ${colors.borderSoft}`,
              borderRadius: 18,
              padding: 12,
              background: colors.white,
              cursor: "pointer",
              fontFamily: "inherit",
              textAlign: "left",
              width: "100%",
            }}
          >
            <div style={{ flex: "0 0 92px", height: 92, position: "relative" }}>
              <ImageSlot radius={14} />
              {res.womenOnly && (
                <span
                  style={{
                    position: "absolute",
                    left: 6,
                    top: 6,
                    fontSize: 9,
                    fontWeight: 600,
                    color: colors.pinkText,
                    background: "rgba(255,255,255,.94)",
                    padding: "3px 7px",
                    borderRadius: 999,
                  }}
                >
                  女性限定
                </span>
              )}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div
                style={{
                  fontSize: 14,
                  fontWeight: 700,
                  color: colors.textPrimary,
                  lineHeight: 1.4,
                }}
              >
                {res.title}
              </div>
              <div style={{ fontSize: 11, color: colors.textMutedAlt, marginTop: 4 }}>
                {res.work}
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 8 }}>
                <span
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 3,
                    fontSize: 10.5,
                    color: "#877FA0",
                  }}
                >
                  <PinIcon />
                  {res.region}
                </span>
                <span
                  style={{
                    fontSize: 10.5,
                    color: colors.primary,
                    background: colors.primaryBg1,
                    padding: "4px 9px",
                    borderRadius: 999,
                  }}
                >
                  {res.world}
                </span>
              </div>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  marginTop: 10,
                }}
              >
                <span style={{ fontSize: 11, color: colors.textSecondaryAlt }}>{res.date}</span>
                <span style={{ fontSize: 11, fontWeight: 600, color: colors.primary }}>
                  {res.members}
                </span>
              </div>
            </div>
          </button>
        ))}

        {isEmpty && (
          <div style={{ padding: "36px 20px", textAlign: "center" }}>
            <div
              style={{
                width: 56,
                height: 56,
                margin: "0 auto",
                borderRadius: "50%",
                background: "#F4F1FA",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <PinIcon size={26} color={colors.textMutedSoft} />
            </div>
            <p style={{ margin: "14px 0 0", fontSize: 13, color: colors.textMutedAlt, lineHeight: 1.8 }}>
              このエリアの募集はまだありません。
              <br />
              あなたが最初に募集してみませんか？
            </p>
            <button
              onClick={() => nav("create")}
              style={{
                marginTop: 16,
                border: "none",
                background: colors.primary,
                color: colors.white,
                fontFamily: "inherit",
                fontSize: 13,
                fontWeight: 700,
                padding: "12px 24px",
                borderRadius: 13,
                cursor: "pointer",
              }}
            >
              併せを募集する
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
