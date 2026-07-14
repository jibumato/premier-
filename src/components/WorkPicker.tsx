"use client";

import { useEffect, useRef, useState } from "react";
import type { CSSProperties } from "react";
import { colors } from "@/lib/tokens";
import { readingMatch } from "@/lib/reading";
import { SearchIcon, ChevronRightIcon } from "./icons";

export interface WorkOption {
  id: string;
  name: string;
}

/**
 * 作品を「検索して選ぶ」コンボボックス。作品数が多いので、あいうえお順の一覧
 * ＋読み検索（ナルト/naruto/なると）で目的の作品にすぐ辿り着けるようにする。
 * 素の <select> の置き換え。トリガーの見た目は親の入力欄に合わせられる。
 */
export function WorkPicker({
  works,
  value,
  onChange,
  triggerStyle,
  placeholder = "作品を検索して選ぶ",
}: {
  works: WorkOption[];
  value: string;
  onChange: (id: string) => void;
  triggerStyle?: CSSProperties;
  placeholder?: string;
}) {
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");
  const rootRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const selected = works.find((w) => w.id === value) ?? null;
  const filtered = q.trim() ? works.filter((w) => readingMatch(w.name, q)) : works;

  // 外側クリック / Esc で閉じる
  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    // 開いたら検索欄にフォーカス
    inputRef.current?.focus();
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const pick = (id: string) => {
    onChange(id);
    setOpen(false);
    setQ("");
  };

  return (
    <div ref={rootRef} style={{ position: "relative" }}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        style={{
          ...triggerStyle,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 8,
          cursor: "pointer",
          textAlign: "left",
        }}
      >
        <span style={{ color: selected ? colors.textPrimary : "#AFAABB", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
          {selected ? selected.name : "選択してください"}
        </span>
        <span style={{ flex: "0 0 auto", transform: `rotate(${open ? 270 : 90}deg)`, opacity: 0.5 }}>
          <ChevronRightIcon />
        </span>
      </button>

      {open && (
        <div
          style={{
            position: "absolute",
            zIndex: 40,
            left: 0,
            right: 0,
            top: "calc(100% + 6px)",
            background: colors.white,
            border: `1px solid ${colors.border}`,
            borderRadius: 14,
            boxShadow: "0 18px 44px -18px rgba(58,40,84,.4)",
            overflow: "hidden",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 9, padding: "10px 13px", borderBottom: `1px solid ${colors.borderSoft}` }}>
            <SearchIcon size={18} />
            <input
              ref={inputRef}
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder={placeholder}
              style={{
                flex: 1,
                minWidth: 0,
                border: "none",
                outline: "none",
                fontSize: 13.5,
                fontFamily: "inherit",
                background: "transparent",
                color: colors.textPrimary,
              }}
            />
          </div>
          <div style={{ maxHeight: 260, overflowY: "auto" }}>
            {filtered.length === 0 ? (
              <div style={{ padding: "22px 14px", textAlign: "center", fontSize: 12.5, color: colors.textMutedAlt }}>
                該当する作品がありません
              </div>
            ) : (
              filtered.map((w) => {
                const active = w.id === value;
                return (
                  <button
                    key={w.id}
                    type="button"
                    onClick={() => pick(w.id)}
                    style={{
                      display: "block",
                      width: "100%",
                      textAlign: "left",
                      border: "none",
                      borderBottom: `1px solid ${colors.borderSofter}`,
                      background: active ? colors.primaryBg1 : colors.white,
                      color: active ? colors.primary : colors.textPrimary,
                      fontFamily: "inherit",
                      fontSize: 13,
                      fontWeight: active ? 700 : 400,
                      padding: "12px 14px",
                      cursor: "pointer",
                    }}
                  >
                    {w.name}
                  </button>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}
