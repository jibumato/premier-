"use client";

import { useMemo, useState } from "react";
import { colors } from "@/lib/tokens";
import { mockStudios, type StudioItem } from "@/lib/data";
import { useRouter } from "../AppRouter";
import { EmptyState } from "../EmptyState";
import { ChevronLeftIcon, PinIcon } from "../icons";
import { useStudios } from "@/lib/queries/studios";
import { isSupabaseConfigured } from "@/lib/supabase/config";

/** 読込中の安定した空配列参照（useMemo の依存が毎回変わるのを防ぐ）。 */
const EMPTY_STUDIOS: StudioItem[] = [];

/**
 * 撮影スタジオ検索。老舗コスプレSNSで最後まで使われ続けた「スタジオDB」を
 * プルミエ！流に。運営キュレーションのスタジオを地域・シチュエーションタグで
 * 絞り込める。掲載情報の追加・更新は運営（migration / ダッシュボード）から。
 */
export function StudiosScreen() {
  const { back } = useRouter();
  const configured = isSupabaseConfigured();
  const studiosQuery = useStudios();
  const studios = configured ? (studiosQuery.data ?? EMPTY_STUDIOS) : mockStudios;
  const loading = configured && studiosQuery.isPending && !studiosQuery.data;

  const [region, setRegion] = useState("すべて");
  const [tag, setTag] = useState<string | null>(null);

  const regionChips = useMemo(
    () => ["すべて", ...Array.from(new Set(studios.map((s) => s.region)))],
    [studios],
  );
  const tagChips = useMemo(
    () => Array.from(new Set(studios.flatMap((s) => s.tags))).slice(0, 10),
    [studios],
  );

  const shown = studios.filter(
    (s) => (region === "すべて" || s.region === region) && (!tag || s.tags.includes(tag)),
  );

  return (
    <div>
      {/* app bar */}
      <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "10px 18px 8px" }}>
        <button onClick={back} style={{ background: "none", border: "none", cursor: "pointer", padding: 0 }} aria-label="戻る">
          <ChevronLeftIcon size={24} />
        </button>
        <div style={{ fontSize: 14, fontWeight: 600, color: colors.textPrimaryAlt }}>撮影スタジオ</div>
      </div>

      <p style={{ margin: "6px 22px 0", fontSize: 11.5, color: colors.textMutedAlt, lineHeight: 1.7 }}>
        併せの場所探しに。気になるスタジオは公式サイトで最新の料金・空き状況を確認してください。
      </p>

      {/* region filter */}
      <div className="noscroll" style={{ display: "flex", gap: 8, overflowX: "auto", padding: "14px 22px 0" }}>
        {regionChips.map((r) => (
          <button
            key={r}
            onClick={() => setRegion(r)}
            style={{
              flex: "0 0 auto",
              fontSize: 12,
              fontWeight: region === r ? 700 : 500,
              color: region === r ? colors.white : "#4A4458",
              background: region === r ? colors.primary : colors.white,
              border: `1px solid ${region === r ? colors.primary : colors.border}`,
              padding: "7px 14px",
              borderRadius: 999,
              cursor: "pointer",
              fontFamily: "inherit",
            }}
          >
            {r}
          </button>
        ))}
      </div>

      {/* situation tag filter */}
      <div className="noscroll" style={{ display: "flex", gap: 8, overflowX: "auto", padding: "10px 22px 0" }}>
        {tagChips.map((t) => {
          const on = tag === t;
          return (
            <button
              key={t}
              onClick={() => setTag(on ? null : t)}
              style={{
                flex: "0 0 auto",
                fontSize: 11.5,
                fontWeight: on ? 700 : 500,
                color: on ? colors.primary : colors.textMutedAlt,
                background: on ? colors.primaryBg1 : colors.primaryBg5,
                border: `1px solid ${on ? colors.primary : colors.borderSoft}`,
                padding: "6px 12px",
                borderRadius: 999,
                cursor: "pointer",
                fontFamily: "inherit",
              }}
            >
              #{t}
            </button>
          );
        })}
      </div>

      {/* list */}
      <div style={{ display: "flex", flexDirection: "column", gap: 11, padding: "16px 22px 30px" }}>
        {loading && (
          <div style={{ padding: "60px 22px", textAlign: "center", fontSize: 13, color: colors.textMutedAlt }}>読み込み中…</div>
        )}
        {!loading && shown.length === 0 && (
          <EmptyState icon="📷" title="条件に合うスタジオがありません" body="絞り込みを変えてみてください。" />
        )}
        {shown.map((s) => (
          <div
            key={s.key}
            style={{ border: `1px solid ${colors.borderSoft}`, borderRadius: 16, padding: "14px 15px", background: colors.white }}
          >
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8 }}>
              <div style={{ fontSize: 14, fontWeight: 700, color: colors.textPrimary }}>{s.name}</div>
              <span style={{ fontSize: 10.5, fontWeight: 700, color: colors.primary, background: colors.primaryBg1, padding: "4px 10px", borderRadius: 999, whiteSpace: "nowrap" }}>
                {s.region}
              </span>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 4, marginTop: 6, fontSize: 11, color: "#877FA0" }}>
              <PinIcon />
              <span>{s.area}</span>
            </div>
            {s.description && (
              <p style={{ margin: "8px 0 0", fontSize: 12, color: colors.textSecondary, lineHeight: 1.7 }}>{s.description}</p>
            )}
            <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginTop: 9 }}>
              {s.tags.map((t) => (
                <span key={t} style={{ fontSize: 10.5, color: colors.textMutedAlt, background: colors.primaryBg5, border: `1px solid ${colors.borderSoft}`, padding: "3px 9px", borderRadius: 999 }}>
                  #{t}
                </span>
              ))}
            </div>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8, marginTop: 11 }}>
              <span style={{ fontSize: 11, color: colors.textMutedAlt }}>{s.price}</span>
              {s.url && (
                <button
                  onClick={() => window.open(s.url!, "_blank", "noopener,noreferrer")}
                  style={{ border: `1px solid ${colors.border}`, background: colors.white, color: colors.primary, fontFamily: "inherit", fontSize: 11.5, fontWeight: 700, padding: "7px 14px", borderRadius: 999, cursor: "pointer" }}
                >
                  公式サイト →
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
