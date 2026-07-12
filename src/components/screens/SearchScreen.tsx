"use client";

import { useState } from "react";
import { colors } from "@/lib/tokens";
import { popularWorks, regions, searchResults } from "@/lib/data";
import { useRouter } from "../AppRouter";
import { ImageSlot } from "../ImageSlot";
import { ChevronLeftIcon, PinIcon, SearchIcon } from "../icons";
import { useAwaseSearch } from "@/lib/queries/awase";
import { useModerationFilter } from "@/lib/queries/moderation";
import { useAuth } from "@/lib/auth/useAuth";
import { isSupabaseConfigured } from "@/lib/supabase/config";

export function SearchScreen() {
  const { back, nav, openAwase, region, setRegion } = useRouter();
  const { user } = useAuth();
  const configured = isSupabaseConfigured();
  const [keyword, setKeyword] = useState("");
  const [womenOnly, setWomenOnly] = useState(false);
  const moderation = useModerationFilter(user?.id);
  const results = useAwaseSearch({ region, keyword, womenOnly }, moderation.data);

  // Mock mode filters the sample list client-side so the same controls work
  // without a backend; configured mode gets already-filtered rows from the query.
  const kw = keyword.trim().toLowerCase();
  const mockFiltered = searchResults.filter(
    (r) =>
      (region === "すべて" || r.region === region) &&
      (!womenOnly || r.womenOnly) &&
      (!kw || r.title.toLowerCase().includes(kw) || r.work.toLowerCase().includes(kw)),
  );
  const filtered = configured && results.data ? results.data : mockFiltered;
  const isEmpty = filtered.length === 0;

  // Keyword suggestions: popular works matching what's typed (excluding an
  // exact match). Empty input shows the whole popular list as quick picks.
  const suggestions = kw
    ? popularWorks.filter((w) => w.toLowerCase().includes(kw) && w.toLowerCase() !== kw)
    : [];

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
          <input
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            placeholder="作品・キャラ・募集タイトルで探す"
            aria-label="キーワード検索"
            style={{
              flex: 1,
              minWidth: 0,
              border: "none",
              outline: "none",
              background: "transparent",
              fontFamily: "inherit",
              fontSize: 13,
              fontWeight: 500,
              color: colors.textPrimary,
            }}
          />
          {keyword && (
            <button
              onClick={() => setKeyword("")}
              aria-label="クリア"
              style={{
                border: "none",
                background: "none",
                padding: 0,
                cursor: "pointer",
                color: colors.textMutedAlt,
                fontSize: 16,
                lineHeight: 1,
              }}
            >
              ×
            </button>
          )}
        </div>
      </div>

      {/* suggestions: quick picks when empty, matching候補 while typing */}
      {keyword.trim() === "" ? (
        <div style={{ padding: "14px 18px 0" }}>
          <div style={{ fontSize: 11.5, fontWeight: 700, color: colors.textMutedAlt, marginBottom: 9, paddingLeft: 2 }}>
            人気のキーワード
          </div>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            {popularWorks.map((w) => (
              <button
                key={w}
                onClick={() => setKeyword(w)}
                style={{
                  fontSize: 12.5,
                  color: "#4A4458",
                  border: `1px solid ${colors.border}`,
                  background: colors.white,
                  padding: "8px 14px",
                  borderRadius: 999,
                  cursor: "pointer",
                  fontFamily: "inherit",
                  whiteSpace: "nowrap",
                }}
              >
                {w}
              </button>
            ))}
          </div>
        </div>
      ) : suggestions.length > 0 ? (
        <div style={{ padding: "8px 18px 0" }}>
          <div style={{ border: `1px solid ${colors.borderSoft}`, borderRadius: 12, overflow: "hidden", background: colors.white }}>
            {suggestions.map((w, i) => (
              <button
                key={w}
                onClick={() => setKeyword(w)}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 9,
                  width: "100%",
                  border: "none",
                  borderTop: i === 0 ? "none" : `1px solid ${colors.borderSofter}`,
                  background: colors.white,
                  padding: "11px 14px",
                  cursor: "pointer",
                  fontFamily: "inherit",
                  textAlign: "left",
                }}
              >
                <SearchIcon size={14} color={colors.textMutedAlt} />
                <span style={{ fontSize: 13, color: colors.textPrimary }}>{w}</span>
              </button>
            ))}
          </div>
        </div>
      ) : null}

      {/* filter chips — region (single-select) + women-only toggle */}
      <div
        className="noscroll"
        style={{ display: "flex", gap: 8, overflowX: "auto", padding: "14px 18px 0" }}
      >
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
        <button
          onClick={() => setWomenOnly((v) => !v)}
          aria-pressed={womenOnly}
          style={{
            fontSize: 12,
            color: womenOnly ? colors.white : colors.pinkText,
            background: womenOnly ? colors.pink : colors.pinkBg1,
            border: `1px solid ${womenOnly ? colors.pink : colors.pinkBg1}`,
            padding: "8px 13px",
            borderRadius: 999,
            whiteSpace: "nowrap",
            fontWeight: 600,
            cursor: "pointer",
            fontFamily: "inherit",
          }}
        >
          女性限定
        </button>
      </div>

      {/* result count */}
      <div style={{ display: "flex", alignItems: "baseline", gap: 8, padding: "18px 20px 0" }}>
        <span style={{ fontSize: 14, fontWeight: 700, color: colors.textPrimary }}>併せ募集</span>
        <span style={{ fontSize: 12, fontWeight: 600, color: colors.primary }}>
          {filtered.length}件
        </span>
      </div>

      {/* results / empty state */}
      <div style={{ padding: "16px 18px 30px" }} className="pt-grid">
        {filtered.map((res) => (
          <button
            key={res.key}
            onClick={() => (configured && results.data ? openAwase(res.key) : nav("detail"))}
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
