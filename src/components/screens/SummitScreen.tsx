"use client";

import { colors } from "@/lib/tokens";
import { homeAwase } from "@/lib/data";
import { useRouter } from "../AppRouter";
import { AppBar } from "../ui";
import { CalendarIcon, PinIcon } from "../icons";
import { useAuth } from "@/lib/auth/useAuth";
import { useModerationFilter } from "@/lib/queries/moderation";
import { useSummitAwase } from "@/lib/queries/awase";
import { isSupabaseConfigured } from "@/lib/supabase/config";

/** 開催日（日本時間 2026-07-31）。過ぎたら「開催中」表示に切り替える。 */
const SUMMIT_DATE = "2026-07-31T00:00:00+09:00";

/** はじめてのサミット ミニガイド（自作の一般的なコツ。運営が随時追記できる）。 */
const FIRST_TIME_TIPS = [
  { icon: "🎒", title: "持ち物の基本", body: "衣装・ウィッグ・小道具のほか、着替え袋・安全ピン・両面テープ・モバイルバッテリーがあると安心。" },
  { icon: "🤝", title: "併せ・撮影は事前に", body: "当日いきなりより、プルミエ！で事前に集合場所・時間・役割を決めておくとスムーズ。" },
  { icon: "📸", title: "撮影マナー", body: "撮影は許可を取ってから。会場ルール・更衣室の場所は公式情報を必ず確認。" },
];

export function SummitScreen() {
  const { back, nav, openAwase } = useRouter();
  const { user } = useAuth();
  const configured = isSupabaseConfigured();
  const signedOut = configured && !user;

  const moderation = useModerationFilter(user?.id);
  const summitQuery = useSummitAwase(moderation.data);
  // 実データ（接続時）: サミット関連の募集。未接続（プロトタイプ）はデモとして数件表示。
  const lane = configured ? (summitQuery.data ?? []) : homeAwase.slice(0, 3);
  const laneLoading = configured && summitQuery.isPending && !summitQuery.data;

  // カウントダウン（クライアントで算出）。開催後は0。
  const daysLeft = Math.max(0, Math.ceil((new Date(SUMMIT_DATE).getTime() - Date.now()) / 86_400_000));
  const started = daysLeft <= 0;

  const goCreate = () => {
    if (configured && !user) {
      nav("login");
      return;
    }
    nav("create");
  };

  const openLaneItem = (key: string) => {
    if (configured && summitQuery.data) {
      openAwase(key);
    } else {
      nav("detail");
    }
  };

  return (
    <div>
      <AppBar title="サミット2026特集" onBack={back} />

      {/* ① カウントダウンヒーロー */}
      <div style={{ padding: "12px 22px 0" }}>
        <div
          style={{
            borderRadius: 20,
            padding: "20px 20px",
            background: "linear-gradient(150deg,#FFA13D,#E8531F)",
            boxShadow: "0 14px 30px -14px rgba(242,92,42,.6)",
            color: colors.white,
          }}
        >
          <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: ".06em", opacity: 0.9 }}>
            国内最大級のコスプレの祭典
          </div>
          <div style={{ fontSize: 19, fontWeight: 700, marginTop: 4, lineHeight: 1.4 }}>
            世界コスプレサミット2026
          </div>
          <div style={{ marginTop: 12, display: "flex", alignItems: "baseline", gap: 8 }}>
            {started ? (
              <span style={{ fontSize: 22, fontWeight: 700 }}>開催中！</span>
            ) : (
              <>
                <span style={{ fontSize: 12, opacity: 0.9 }}>開催まであと</span>
                <span style={{ fontSize: 34, fontWeight: 700, lineHeight: 1 }}>{daysLeft}</span>
                <span style={{ fontSize: 12, opacity: 0.9 }}>日</span>
              </>
            )}
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 8, fontSize: 12, opacity: 0.92 }}>
            <CalendarIcon size={14} color={colors.white} />
            2026年7月31日（金）開催
          </div>
        </div>
      </div>

      <div style={{ padding: "16px 22px 0" }}>
        <p style={{ margin: 0, fontSize: 12.5, color: colors.textMutedAlt, lineHeight: 1.9 }}>
          サミットで一緒に回る仲間、当日の撮影相手を、プルミエ！で今から見つけておきましょう。事前に集合や役割を決めておくと、当日をもっと楽しめます。
        </p>
      </div>

      {/* ② サミット関連の併せ募集レーン */}
      <div style={{ padding: "22px 22px 0" }}>
        <div style={{ fontSize: 14, fontWeight: 700, color: colors.textPrimary }}>サミットで会おう！仲間募集</div>
        <div style={{ marginTop: 12, display: "flex", flexDirection: "column", gap: 10 }}>
          {laneLoading && (
            <div style={{ padding: "24px 0", textAlign: "center", fontSize: 12.5, color: colors.textMutedAlt }}>読み込み中…</div>
          )}
          {!laneLoading && lane.length === 0 && (
            <div
              style={{
                border: `1.5px dashed ${colors.border}`,
                borderRadius: 16,
                padding: "20px 16px",
                background: colors.primaryBg5,
                textAlign: "center",
              }}
            >
              <div style={{ fontSize: 13, fontWeight: 700, color: colors.textPrimary }}>
                まだサミット向けの募集がありません
              </div>
              <p style={{ margin: "6px 0 12px", fontSize: 11.5, color: colors.textMutedAlt, lineHeight: 1.7 }}>
                あなたが最初の「サミットで会おう！」募集を作りませんか？
              </p>
              <button
                onClick={goCreate}
                style={{
                  border: "none",
                  background: colors.primary,
                  color: colors.white,
                  fontFamily: "inherit",
                  fontSize: 12.5,
                  fontWeight: 700,
                  padding: "10px 20px",
                  borderRadius: 999,
                  cursor: "pointer",
                }}
              >
                募集を作成する
              </button>
            </div>
          )}
          {lane.map((a) => (
            <button
              key={a.key}
              onClick={() => openLaneItem(a.key)}
              style={{
                border: `1px solid ${colors.borderSoft}`,
                borderRadius: 16,
                padding: 14,
                background: colors.white,
                cursor: "pointer",
                fontFamily: "inherit",
                textAlign: "left",
                width: "100%",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
                <span
                  style={{
                    fontSize: 10.5,
                    color: colors.primary,
                    background: colors.primaryBg1,
                    padding: "3px 9px",
                    borderRadius: 999,
                  }}
                >
                  {a.work}
                </span>
                <span style={{ fontSize: 10.5, color: colors.pinkText, fontWeight: 700 }}>{a.tag}</span>
              </div>
              <div style={{ fontSize: 14, fontWeight: 700, color: colors.textPrimary, lineHeight: 1.5, marginTop: 9 }}>
                {a.title}
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginTop: 9, fontSize: 11, color: colors.textSecondaryAlt }}>
                <span style={{ display: "flex", alignItems: "center", gap: 3 }}>
                  <CalendarIcon size={13} color={colors.textMutedSoft} />
                  {a.date}
                </span>
                <span style={{ display: "flex", alignItems: "center", gap: 3 }}>
                  <PinIcon size={13} color={colors.textMutedSoft} />
                  {a.region}
                </span>
              </div>
            </button>
          ))}
          {lane.length > 0 && (
            <button
              onClick={goCreate}
              style={{
                border: `1px solid ${colors.border}`,
                borderRadius: 14,
                padding: "11px 0",
                background: colors.white,
                color: colors.primary,
                fontFamily: "inherit",
                fontSize: 12.5,
                fontWeight: 700,
                cursor: "pointer",
              }}
            >
              ＋ サミット向けに募集を作る
            </button>
          )}
        </div>
      </div>

      {/* ④ はじめてのサミット ミニガイド */}
      <div style={{ padding: "26px 22px 0" }}>
        <div style={{ fontSize: 14, fontWeight: 700, color: colors.textPrimary }}>はじめてのサミット ガイド</div>
        <div style={{ marginTop: 12, display: "flex", flexDirection: "column", gap: 9 }}>
          {FIRST_TIME_TIPS.map((t) => (
            <div
              key={t.title}
              style={{
                border: `1px solid ${colors.borderSoft}`,
                borderRadius: 14,
                padding: "12px 14px",
                background: colors.white,
                display: "flex",
                gap: 11,
              }}
            >
              <span style={{ fontSize: 20, flex: "0 0 auto", lineHeight: 1.2 }}>{t.icon}</span>
              <div>
                <div style={{ fontSize: 13, fontWeight: 700, color: colors.textPrimary }}>{t.title}</div>
                <p style={{ margin: "4px 0 0", fontSize: 11.5, color: colors.textMutedAlt, lineHeight: 1.7 }}>{t.body}</p>
              </div>
            </div>
          ))}
          <button
            onClick={() => nav("qa")}
            style={{
              border: `1px solid ${colors.border}`,
              borderRadius: 14,
              padding: "11px 0",
              background: colors.white,
              color: colors.primary,
              fontFamily: "inherit",
              fontSize: 12.5,
              fontWeight: 700,
              cursor: "pointer",
            }}
          >
            もっと知りたいことは知恵袋で聞く →
          </button>
        </div>
      </div>

      {/* 未ログイン向けの登録CTA */}
      {signedOut && (
        <div style={{ padding: "26px 22px 0" }}>
          <div
            style={{
              borderRadius: 18,
              padding: "16px 18px",
              background: "linear-gradient(150deg,#6D5DAB,#4C3E82)",
              color: colors.white,
            }}
          >
            <div style={{ fontSize: 14, fontWeight: 700 }}>サミットで会う仲間を見つけよう</div>
            <p style={{ margin: "6px 0 12px", fontSize: 11.5, lineHeight: 1.7, color: "rgba(255,255,255,.9)" }}>
              応募・募集・メッセージは無料登録から（1分で完了）。
            </p>
            <button
              onClick={() => nav("login")}
              style={{
                width: "100%",
                border: "none",
                background: colors.white,
                color: colors.primary,
                fontFamily: "inherit",
                fontSize: 13,
                fontWeight: 700,
                padding: "11px 0",
                borderRadius: 12,
                cursor: "pointer",
              }}
            >
              無料で登録する
            </button>
          </div>
        </div>
      )}

      <div style={{ height: 30 }} />
    </div>
  );
}
