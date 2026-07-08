"use client";

import { useState } from "react";
import { colors } from "@/lib/tokens";
import { onboardWorks } from "@/lib/data";
import { useRouter } from "../AppRouter";
import { PrimaryButton } from "../ui";
import { OnboardProgress } from "./onboardProgress";
import { ImageSlot } from "../ImageSlot";
import { SearchIcon } from "../icons";

export function OnboardWorksScreen() {
  const { nav } = useRouter();
  const [selected, setSelected] = useState<string[]>(["ow1", "ow3", "ow5"]);

  const toggle = (key: string) =>
    setSelected((cur) => (cur.includes(key) ? cur.filter((k) => k !== key) : [...cur, key]));

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
          <span style={{ fontSize: 13, color: "#AFAABB" }}>作品を検索</span>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 11 }}>
          {onboardWorks.map((w) => {
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
      </div>

      <div style={{ padding: "24px 22px 30px", marginTop: "auto" }}>
        <PrimaryButton
          onClick={() => nav("onboardVerify")}
          style={selected.length === 0 ? { opacity: 0.45, cursor: "not-allowed" } : undefined}
        >
          {selected.length > 0 ? `${selected.length}つ選択中 · 次へ` : "1つ以上えらんでください"}
        </PrimaryButton>
      </div>
    </div>
  );
}
