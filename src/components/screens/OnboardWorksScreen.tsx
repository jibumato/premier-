"use client";

import { useEffect, useState } from "react";
import { colors } from "@/lib/tokens";
import { onboardWorks as mockWorks } from "@/lib/data";
import { useRouter } from "../AppRouter";
import { PrimaryButton } from "../ui";
import { OnboardProgress } from "./onboardProgress";
import { ImageSlot } from "../ImageSlot";
import { SearchIcon } from "../icons";
import { useAuth } from "@/lib/auth/useAuth";
import { useFollowedWorks, useFollowWorks, useWorks } from "@/lib/queries/works";

export function OnboardWorksScreen() {
  const { nav } = useRouter();
  const { user, configured } = useAuth();

  const worksQuery = useWorks();
  const followedQuery = useFollowedWorks(user?.id);
  const followWorks = useFollowWorks();

  // Real works (id/name from Supabase) once connected; the handoff's mock
  // list (key/name) otherwise — same shape, so rendering doesn't branch.
  const works = configured
    ? (worksQuery.data ?? []).map((w) => ({ key: w.id, name: w.name }))
    : mockWorks;

  const [selected, setSelected] = useState<string[]>(configured ? [] : ["ow1", "ow3", "ow5"]);
  const [query, setQuery] = useState("");

  const q = query.trim().toLowerCase();
  const shownWorks = q ? works.filter((w) => w.name.toLowerCase().includes(q)) : works;

  // Seed the selection from the server once the user's existing follows load.
  useEffect(() => {
    if (configured && followedQuery.data) setSelected(followedQuery.data);
  }, [configured, followedQuery.data]);

  const toggle = (key: string) =>
    setSelected((cur) => (cur.includes(key) ? cur.filter((k) => k !== key) : [...cur, key]));

  const handleNext = () => {
    if (configured && user) {
      followWorks.mutate({ userId: user.id, workIds: selected });
    }
    nav("onboardVerify");
  };

  return (
    <div style={{ minHeight: "100%", display: "flex", flexDirection: "column" }}>
      <OnboardProgress step={2} />

      <div style={{ padding: "26px 26px 0" }}>
        <h2 style={{ margin: 0, fontSize: 23, lineHeight: 1.5, fontWeight: 700, color: colors.textPrimary }}>
          好きな作品を
          <br />
          フォローしよう
        </h2>
        <p style={{ margin: "12px 0 0", fontSize: 13, color: colors.textMuted, lineHeight: 1.8 }}>
          同じ作品が好きな仲間や併せが、タイムラインに届きます。
        </p>
      </div>

      <div style={{ padding: "22px 22px 0" }}>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 9,
            border: `1px solid ${colors.border}`,
            borderRadius: 13,
            padding: "12px 14px",
            background: colors.primaryBg4,
            marginBottom: 16,
          }}
        >
          <SearchIcon size={16} color={colors.textMuted} />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="作品を検索"
            aria-label="作品を検索"
            style={{
              flex: 1,
              minWidth: 0,
              border: "none",
              outline: "none",
              background: "transparent",
              fontFamily: "inherit",
              fontSize: 13,
              color: colors.textPrimary,
            }}
          />
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 11 }}>
          {shownWorks.map((w) => {
            const on = selected.includes(w.key);
            return (
              <button
                key={w.key}
                onClick={() => toggle(w.key)}
                style={{
                  position: "relative",
                  borderRadius: 15,
                  overflow: "hidden",
                  height: 104,
                  border: "none",
                  padding: 0,
                  cursor: "pointer",
                  fontFamily: "inherit",
                }}
              >
                <ImageSlot radius={0} />
                <span
                  style={{
                    position: "absolute",
                    inset: 0,
                    background: "linear-gradient(to top,rgba(38,34,47,.72),transparent 60%)",
                  }}
                />
                <span
                  style={{
                    position: "absolute",
                    left: 11,
                    bottom: 10,
                    right: 34,
                    fontSize: 11.5,
                    fontWeight: 700,
                    color: colors.white,
                    lineHeight: 1.3,
                    textAlign: "left",
                  }}
                >
                  {w.name}
                </span>
                <span
                  style={{
                    position: "absolute",
                    right: 9,
                    bottom: 9,
                    width: 24,
                    height: 24,
                    borderRadius: "50%",
                    background: on ? colors.primary : "rgba(255,255,255,.35)",
                    border: on ? "none" : "1.5px solid rgba(255,255,255,.9)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  {on && (
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M5 13l4 4L19 7" />
                    </svg>
                  )}
                </span>
              </button>
            );
          })}
        </div>
        {q && shownWorks.length === 0 && (
          <p style={{ margin: "18px 0 0", textAlign: "center", fontSize: 12.5, color: colors.textMutedAlt }}>
            「{query}」に一致する作品が見つかりませんでした。
          </p>
        )}
      </div>

      <div style={{ padding: "24px 22px 30px", marginTop: "auto" }}>
        <PrimaryButton
          onClick={handleNext}
          style={selected.length === 0 ? { opacity: 0.45, cursor: "not-allowed" } : undefined}
        >
          {selected.length > 0 ? `${selected.length}つ選択中 · 次へ` : "1つ以上えらんでください"}
        </PrimaryButton>
      </div>
    </div>
  );
}
