"use client";

import { colors } from "@/lib/tokens";
import { useRouter } from "./AppRouter";
import { useAuth } from "@/lib/auth/useAuth";
import { useProfile } from "@/lib/queries/profile";
import { useFollowedWorks } from "@/lib/queries/works";
import { useMyApplicationCount } from "@/lib/queries/awase";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import type { Screen } from "@/lib/types";

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

  const doneCount = steps.filter((s) => s.done).length;

  return (
    <div style={{ padding: "16px 22px 0" }}>
      <div
        style={{
          border: `1px solid ${colors.borderSoft}`,
          borderRadius: 18,
          background: "linear-gradient(160deg,#F6F1FD,#FCF2F8)",
          padding: "16px 16px 8px",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ fontSize: 14, fontWeight: 700, color: colors.textPrimary }}>はじめてガイド</div>
          <span style={{ fontSize: 11, fontWeight: 700, color: colors.primary }}>{doneCount}/3 完了</span>
        </div>
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
        <div style={{ height: 8 }} />
      </div>
    </div>
  );
}
