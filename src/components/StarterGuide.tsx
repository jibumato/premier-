"use client";

import { useEffect, useState } from "react";
import { colors } from "@/lib/tokens";
import { useRouter } from "./AppRouter";
import { useAuth } from "@/lib/auth/useAuth";
import { useProfile } from "@/lib/queries/profile";
import { useFollowedWorks } from "@/lib/queries/works";
import { useMyApplicationCount } from "@/lib/queries/awase";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import type { Screen } from "@/lib/types";

/** タップで閉じたときの「このタブでは出さない」用（ブラウザを閉じるまで）。
 * チェックボックスで「今後は表示しない」を選ぶと localStorage に永続化される。 */
const SESSION_DISMISS_KEY = "pt_starter_guide_dismissed_session";
const PERMANENT_DISMISS_KEY = "pt_starter_guide_hidden_v1";

interface Step {
  label: string;
  hint: string;
  done: boolean;
  target: Screen;
}

function CheckMark() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
      <path d="M5 13l4 4L19 7" />
    </svg>
  );
}

/**
 * 新規ユーザー向けの「はじめてガイド」。プロフィール整備・作品フォロー・初応募の
 * 3ステップの進捗を既存データから導出し、各ステップから該当画面へ誘導する。
 * 全ステップ完了で自動的に非表示（役目を終えたら消える）。プロトタイプ（未接続）
 * では雰囲気が伝わるデモ状態（①のみ完了）で表示する。
 */
export function StarterGuide() {
  const { nav } = useRouter();
  const { user } = useAuth();
  const configured = isSupabaseConfigured();

  const profile = useProfile(user?.id);
  const followed = useFollowedWorks(user?.id);
  const applied = useMyApplicationCount(user?.id);

  // 閉じた状態の判定。サーバー描画時と一致させるため、初期値は「まだ確認していない
  // （= 表示しない）」にしておき、確認が取れたら（dismissed=false なら）表示する。
  const [dismissed, setDismissed] = useState<boolean | null>(null);
  const [neverShowAgain, setNeverShowAgain] = useState(false);
  // 折りたたみの手動切替。既定は「1つでも完了していれば畳む」（＝リピーターの
  // トップを本命コンテンツに譲る）。null のあいだは既定に従う。
  const [expandedOverride, setExpandedOverride] = useState<boolean | null>(null);

  useEffect(() => {
    try {
      const permanent = localStorage.getItem(PERMANENT_DISMISS_KEY) === "1";
      const session = sessionStorage.getItem(SESSION_DISMISS_KEY) === "1";
      setDismissed(permanent || session);
    } catch {
      setDismissed(false);
    }
  }, []);

  const handleDismiss = () => {
    try {
      if (neverShowAgain) {
        localStorage.setItem(PERMANENT_DISMISS_KEY, "1");
      } else {
        sessionStorage.setItem(SESSION_DISMISS_KEY, "1");
      }
    } catch {
      /* ignore */
    }
    setDismissed(true);
  };

  let steps: Step[];
  if (configured && user) {
    const p = profile.data;
    const profileDone = Boolean((p?.bio && p.bio.trim()) || p?.avatar_url);
    const followDone = (followed.data?.length ?? 0) > 0;
    const appliedDone = (applied.data ?? 0) > 0;
    steps = [
      { label: "プロフィールを整える", hint: "自己紹介やアイコンを設定", done: profileDone, target: "profile" },
      { label: "好きな作品をフォロー", hint: "同じ作品の仲間・募集が届く", done: followDone, target: "onboardWorks" },
      { label: "気になる募集に応募", hint: "初心者歓迎の併せから気軽に", done: appliedDone, target: "search" },
    ];
    // 全部終わったら表示しない（データ読込中の早すぎる非表示は避ける）
    const loaded = !profile.isLoading && !followed.isLoading && !applied.isLoading;
    if (loaded && steps.every((s) => s.done)) return null;
  } else if (!configured) {
    // プロトタイプ用のデモ（①のみ完了）
    steps = [
      { label: "プロフィールを整える", hint: "自己紹介やアイコンを設定", done: true, target: "profile" },
      { label: "好きな作品をフォロー", hint: "同じ作品の仲間・募集が届く", done: false, target: "onboardWorks" },
      { label: "気になる募集に応募", hint: "初心者歓迎の併せから気軽に", done: false, target: "search" },
    ];
  } else {
    return null; // configured だが未ログイン（ログインゲート表示中）
  }

  // まだ localStorage/sessionStorage の確認が済んでいない、またはすでに閉じている
  if (dismissed !== false) return null;

  const doneCount = steps.filter((s) => s.done).length;
  // 1つでも完了していれば既定で畳む（トップの縦を本命コンテンツに譲る）。
  // まだ何も済んでいない新規は展開のまま丁寧に案内する。手動切替を優先。
  const expanded = expandedOverride ?? doneCount === 0;

  return (
    <div style={{ padding: "16px 22px 0" }}>
      <div
        style={{
          position: "relative",
          border: `1px solid ${colors.borderSoft}`,
          borderRadius: 18,
          background: "linear-gradient(160deg,#F6F1FD,#FCF2F8)",
          padding: expanded ? "16px 16px 8px" : "13px 16px",
        }}
      >
        <button
          onClick={handleDismiss}
          aria-label="閉じる"
          style={{
            position: "absolute",
            right: 10,
            top: 10,
            width: 24,
            height: 24,
            borderRadius: "50%",
            border: "none",
            background: "rgba(90,70,120,.10)",
            color: colors.textMutedAlt,
            fontSize: 14,
            lineHeight: 1,
            cursor: "pointer",
            fontFamily: "inherit",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          ×
        </button>
        {/* ヘッダー = 折りたたみトグル。進捗と開閉シェブロンを出す。 */}
        <button
          onClick={() => setExpandedOverride(!expanded)}
          aria-label={expanded ? "はじめてガイドを畳む" : "はじめてガイドを開く"}
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 8,
            width: "100%",
            paddingRight: 22,
            border: "none",
            background: "none",
            cursor: "pointer",
            fontFamily: "inherit",
            textAlign: "left",
          }}
        >
          <span style={{ fontSize: 14, fontWeight: 700, color: colors.textPrimary }}>はじめてガイド</span>
          <span style={{ display: "flex", alignItems: "center", gap: 6, flex: "0 0 auto" }}>
            <span style={{ fontSize: 11, fontWeight: 700, color: colors.primary }}>{doneCount}/3 完了</span>
            <span style={{ fontSize: 10, color: colors.textMutedAlt }}>{expanded ? "▲" : "▼"}</span>
          </span>
        </button>

        {!expanded && (
          <p style={{ margin: "5px 0 0", fontSize: 11, color: colors.textMutedAlt, lineHeight: 1.5 }}>
            残りのステップを開いて、併せデビューの準備を進めましょう。
          </p>
        )}

        {expanded && (
          <>
        <p style={{ margin: "4px 0 12px", fontSize: 11.5, color: colors.textMutedAlt, lineHeight: 1.6 }}>
          3ステップで、併せデビューの準備が整います。
        </p>

        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {steps.map((s, i) => (
            <button
              key={s.label}
              onClick={() => nav(s.target, s.target === "search" ? "search" : s.target === "profile" ? "mypage" : undefined)}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 12,
                border: "none",
                background: colors.white,
                borderRadius: 13,
                padding: "11px 13px",
                cursor: "pointer",
                fontFamily: "inherit",
                textAlign: "left",
                width: "100%",
                opacity: s.done ? 0.7 : 1,
              }}
            >
              <span
                style={{
                  flex: "0 0 auto",
                  width: 26,
                  height: 26,
                  borderRadius: "50%",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  background: s.done ? colors.primary : colors.primaryBg1,
                  color: s.done ? colors.white : colors.primary,
                  fontSize: 12.5,
                  fontWeight: 700,
                }}
              >
                {s.done ? <CheckMark /> : i + 1}
              </span>
              <span style={{ flex: 1, minWidth: 0 }}>
                <span
                  style={{
                    display: "block",
                    fontSize: 13,
                    fontWeight: 700,
                    color: colors.textPrimary,
                    textDecoration: s.done ? "line-through" : "none",
                  }}
                >
                  {s.label}
                </span>
                <span style={{ display: "block", fontSize: 10.5, color: colors.textMutedAlt, marginTop: 2 }}>{s.hint}</span>
              </span>
              {!s.done && (
                <span style={{ flex: "0 0 auto", fontSize: 11.5, color: colors.primary, fontWeight: 700 }}>やってみる →</span>
              )}
            </button>
          ))}
        </div>
        <label
          style={{
            display: "flex",
            alignItems: "center",
            gap: 6,
            marginTop: 12,
            padding: "0 0 12px",
            fontSize: 11,
            color: colors.textMutedAlt,
            cursor: "pointer",
          }}
        >
          <input
            type="checkbox"
            checked={neverShowAgain}
            onChange={(e) => setNeverShowAgain(e.target.checked)}
            style={{ width: 14, height: 14, accentColor: colors.primary }}
          />
          今後は表示しない（× で閉じると適用されます）
        </label>
          </>
        )}
      </div>
    </div>
  );
}
