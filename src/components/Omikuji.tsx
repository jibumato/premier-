"use client";

import { useEffect, useRef, useState } from "react";
import { colors } from "@/lib/tokens";
import { useRouter } from "./AppRouter";
import type { Screen, Tab } from "@/lib/types";

/**
 * 併せ運おみくじ — おしらせ画面の最下部にひっそり置かれた遊び心。
 * 1日1回（毎朝5時リセット）、端末のlocalStorageだけで完結する
 * （DB・ログイン不要。プレビュー環境でもそのまま動く）。
 * 結果ごとにサイト内の別画面へのCTAが付き、占いがそのまま回遊導線になる。
 */

interface Fortune {
  grade: string;
  /** 大大吉だけの特別演出（虹色グラデ＋紙吹雪） */
  rare?: boolean;
  msg: string;
  item: string;
  color: string;
  ctaLabel: string;
  ctaScreen: Screen;
  ctaTab?: Tab;
}

const FORTUNES: Fortune[] = [
  {
    grade: "大大吉",
    rare: true,
    msg: "奇跡の一日。憧れのあの人に併せを申し込むなら今日です。シャッター音が鳴り止まない予感。",
    item: "🎀 ラッキーアイテム：リボン",
    color: "🌈 ラッキーカラー：虹色",
    ctaLabel: "この運気で募集を見る →",
    ctaScreen: "search",
    ctaTab: "search",
  },
  {
    grade: "大吉",
    msg: "最高の併せ日和。気になっていた募集に思い切って応募すると、素敵な出会いが待っています。",
    item: "📌 ラッキーアイテム：安全ピン",
    color: "💜 ラッキーカラー：ラベンダー",
    ctaLabel: "募集をさがす →",
    ctaScreen: "search",
    ctaTab: "search",
  },
  {
    grade: "中吉",
    msg: "じわじわ運気上昇中。プロフィールを整えると、フォローが増える予感。写真の並び替えも吉。",
    item: "🪞 ラッキーアイテム：手鏡",
    color: "💗 ラッキーカラー：ピンク",
    ctaLabel: "プロフィールを整える →",
    ctaScreen: "profile",
    ctaTab: "mypage",
  },
  {
    grade: "吉",
    msg: "穏やかな一日。談話室でひとこと呟くと、思わぬ共通の推しが見つかるかも。",
    item: "🧵 ラッキーアイテム：ミシン糸",
    color: "🤍 ラッキーカラー：白",
    ctaLabel: "談話室をのぞく →",
    ctaScreen: "lounge",
  },
  {
    grade: "小吉",
    msg: "焦らずコツコツ。ウィッグのお手入れや衣装の補修など、次の併せへの準備が実を結びます。",
    item: "🔧 ラッキーアイテム：グルーガン",
    color: "💛 ラッキーカラー：金色",
    ctaLabel: "知恵袋で情報収集 →",
    ctaScreen: "qa",
  },
  {
    grade: "末吉",
    msg: "今日は充電日。無理せずゆっくり。イベントカレンダーを眺めて、次の楽しみを見つけましょう。",
    item: "🍵 ラッキーアイテム：あたたかいお茶",
    color: "💚 ラッキーカラー：若草色",
    ctaLabel: "イベントを見る →",
    ctaScreen: "events",
  },
];

const STORAGE_KEY = "pt_omikuji_v1";
/** 談話室の投稿欄にシェア文をプリフィルするための受け渡しキー。 */
export const LOUNGE_DRAFT_KEY = "pt_lounge_draft";

/** 「おみくじの日」キー。毎朝5時に日付が切り替わる（深夜0時に引き直せると
 * ありがたみが薄いので、朝までを同じ日として扱う）。 */
function omikujiDay(): string {
  const d = new Date(Date.now() - 5 * 3600 * 1000);
  return `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`;
}

interface Stored {
  day: string;
  index: number;
}

function readStored(): Stored | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const v = JSON.parse(raw) as Stored;
    if (v && v.day === omikujiDay() && typeof v.index === "number" && FORTUNES[v.index]) return v;
    return null;
  } catch {
    return null;
  }
}

export function Omikuji() {
  const { nav } = useRouter();
  // idle: まだ引いていない / shaking: 演出中 / result: 結果表示
  const [phase, setPhase] = useState<"idle" | "shaking" | "result">("idle");
  const [index, setIndex] = useState<number | null>(null);
  const [confetti, setConfetti] = useState<{ key: number; left: number; delay: number; emoji: string }[]>([]);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // 初回マウント時: 今日すでに引いていたら結果をそのまま出す（演出なし）。
  // localStorage は SSR に無いので effect で読む。
  useEffect(() => {
    const stored = readStored();
    if (stored) {
      setIndex(stored.index);
      setPhase("result");
    }
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  const draw = () => {
    if (phase !== "idle") return;
    setPhase("shaking");
    timerRef.current = setTimeout(() => {
      const i = Math.floor(Math.random() * FORTUNES.length);
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify({ day: omikujiDay(), index: i } satisfies Stored));
      } catch {
        // ストレージが使えない環境（プライベートモード等）でも引くこと自体はできる
      }
      setIndex(i);
      setPhase("result");
      if (FORTUNES[i].rare) {
        const emojis = ["🎉", "✨", "💜", "🩷", "⭐"];
        setConfetti(
          Array.from({ length: 18 }, (_, k) => ({
            key: k,
            left: 5 + Math.random() * 90,
            delay: Math.random() * 0.5,
            emoji: emojis[k % emojis.length],
          })),
        );
        timerRef.current = setTimeout(() => setConfetti([]), 2400);
      }
    }, 900);
  };

  const share = (f: Fortune) => {
    try {
      sessionStorage.setItem(LOUNGE_DRAFT_KEY, `今日の併せ運おみくじは【${f.grade}】でした🎋`);
    } catch {
      // プリフィルできなくても談話室には遷移する
    }
    nav("lounge");
  };

  const fortune = index !== null ? FORTUNES[index] : null;

  return (
    <div style={{ padding: "26px 22px 8px" }}>
      <div
        style={{
          position: "relative",
          overflow: "hidden",
          borderRadius: 18,
          border: `1px solid ${colors.border}`,
          background: `linear-gradient(160deg, ${colors.primaryBg2}, ${colors.pinkBg1})`,
          padding: "18px 16px 16px",
          textAlign: "center",
        }}
      >
        <span
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 5,
            fontSize: 10,
            fontWeight: 700,
            color: colors.primary,
            background: "rgba(255,255,255,.85)",
            borderRadius: 999,
            padding: "4px 10px",
            letterSpacing: ".05em",
          }}
        >
          ✨ 1日1回
        </span>

        {phase !== "result" && (
          <div>
            <button
              onClick={draw}
              aria-label="おみくじを引く"
              className={phase === "shaking" ? "pt-omikuji-shake" : undefined}
              style={{
                border: "none",
                background: "none",
                cursor: "pointer",
                fontSize: 52,
                lineHeight: 1,
                marginTop: 12,
                padding: 0,
                display: "inline-block",
                filter: "drop-shadow(0 8px 14px rgba(109,93,171,.35))",
              }}
            >
              🎋
            </button>
            <h3 style={{ margin: "10px 0 0", fontSize: 14.5, fontWeight: 700, color: colors.textPrimary }}>
              今日の併せ運おみくじ
            </h3>
            <p style={{ margin: "5px 0 0", fontSize: 11, lineHeight: 1.7, color: colors.textMuted }}>
              今日のあなたのコス活運勢を占ってみましょう
            </p>
            <button
              onClick={draw}
              disabled={phase === "shaking"}
              style={{
                marginTop: 13,
                border: "none",
                cursor: "pointer",
                fontFamily: "inherit",
                fontSize: 13,
                fontWeight: 700,
                color: colors.white,
                background: `linear-gradient(135deg, ${colors.primaryGradientLight}, ${colors.primary})`,
                padding: "12px 34px",
                borderRadius: 999,
                boxShadow: "0 8px 18px -8px rgba(109,93,171,.7)",
                opacity: phase === "shaking" ? 0.55 : 1,
              }}
            >
              {phase === "shaking" ? "占い中…" : "おみくじを引く"}
            </button>
          </div>
        )}

        {phase === "result" && fortune && (
          <div className="pt-omikuji-pop">
            <div style={{ fontSize: 30, marginTop: 6 }}>📜</div>
            <div
              style={{
                display: "inline-block",
                marginTop: 10,
                fontSize: 34,
                fontWeight: 800,
                letterSpacing: ".08em",
                background: fortune.rare
                  ? `linear-gradient(90deg, ${colors.starGold}, ${colors.pink}, ${colors.primary}, ${colors.starGold})`
                  : `linear-gradient(135deg, ${colors.pinkText}, ${colors.primary})`,
                WebkitBackgroundClip: "text",
                backgroundClip: "text",
                WebkitTextFillColor: "transparent",
              }}
            >
              {fortune.grade}
            </div>
            <p
              style={{
                margin: "10px auto 0",
                maxWidth: 280,
                fontSize: 12.5,
                lineHeight: 1.9,
                color: colors.textSecondary,
              }}
            >
              {fortune.msg}
            </p>
            <div style={{ display: "flex", justifyContent: "center", gap: 8, marginTop: 13, flexWrap: "wrap" }}>
              {[fortune.item, fortune.color].map((t) => (
                <span
                  key={t}
                  style={{
                    fontSize: 10.5,
                    fontWeight: 700,
                    color: colors.primary,
                    background: "rgba(255,255,255,.9)",
                    border: `1px solid ${colors.border}`,
                    padding: "5px 11px",
                    borderRadius: 999,
                  }}
                >
                  {t}
                </span>
              ))}
            </div>
            <button
              onClick={() => nav(fortune.ctaScreen, fortune.ctaTab)}
              style={{
                marginTop: 15,
                border: "none",
                cursor: "pointer",
                fontFamily: "inherit",
                fontSize: 12.5,
                fontWeight: 700,
                color: colors.white,
                background: colors.pink,
                padding: "11px 26px",
                borderRadius: 999,
              }}
            >
              {fortune.ctaLabel}
            </button>
            <button
              onClick={() => share(fortune)}
              style={{
                display: "block",
                margin: "11px auto 0",
                border: "none",
                background: "none",
                cursor: "pointer",
                fontFamily: "inherit",
                fontSize: 11,
                fontWeight: 700,
                color: colors.textMuted,
              }}
            >
              💬 談話室に結果をシェア
            </button>
            <div style={{ marginTop: 12, fontSize: 10, color: colors.textMutedSoft }}>
              また明日引けます（毎朝5時にリセット）
            </div>
          </div>
        )}

        {confetti.map((c) => (
          <span
            key={c.key}
            className="pt-omikuji-fall"
            aria-hidden
            style={{
              position: "absolute",
              top: -8,
              left: `${c.left}%`,
              fontSize: 14,
              animationDelay: `${c.delay}s`,
              pointerEvents: "none",
            }}
          >
            {c.emoji}
          </span>
        ))}
      </div>
    </div>
  );
}
