"use client";

import { useState } from "react";
import { colors } from "@/lib/tokens";
import { useRouter } from "../AppRouter";
import { ImageSlot } from "../ImageSlot";
import { AppBar, PrimaryButton } from "../ui";
import { useAuth } from "@/lib/auth/useAuth";
import {
  useCreateQaAnswer,
  useMarkBestAnswer,
  useQaAnswers,
  useQaQuestion,
  useToggleQaLike,
} from "@/lib/queries/qa";
import { useModerationFilter } from "@/lib/queries/moderation";
import { isSupabaseConfigured } from "@/lib/supabase/config";

interface Answer {
  key: string;
  name: string;
  text: string;
  best: boolean;
  likes: number;
}

const initialAnswers: Answer[] = [
  {
    key: "an1",
    name: "澪 / mio",
    text: "モバイルバッテリー、両面テープ、安全ピン、着替え用の圧縮袋は必須です！あとメイク直しセットも忘れずに◎",
    best: true,
    likes: 42,
  },
  {
    key: "an2",
    name: "photographer_r",
    text: "カメラマン目線だと、レフ板代わりの白いハンカチや、汗ふきシートがあると助かります。撮影がスムーズになりますよ。",
    best: false,
    likes: 18,
  },
  {
    key: "an3",
    name: "すず",
    text: "私はいつも絆創膏とヘアピンを多めに持っていきます。ウィッグ用ネットの予備もあると安心です！",
    best: false,
    likes: 9,
  },
];

export function QaDetailScreen() {
  const { back, selectedQaQuestionId } = useRouter();
  const { user } = useAuth();
  const configured = isSupabaseConfigured();

  const moderation = useModerationFilter(user?.id);
  const questionQuery = useQaQuestion(selectedQaQuestionId);
  const answersQuery = useQaAnswers(selectedQaQuestionId, user?.id, moderation.data?.blockedUserIds);
  const createAnswer = useCreateQaAnswer();
  const toggleLike = useToggleQaLike();
  const markBest = useMarkBestAnswer();

  const [mockAnswers, setMockAnswers] = useState(initialAnswers);
  const [draft, setDraft] = useState("");

  // モック（澪/かな等のダミー）は「プロトタイプ＝未接続」時だけ使う。本番（接続済）では
  // 読み込み中にダミーを出さず、ローディング表示にする（実データ取得の一瞬にモックが
  // チラ見えする不具合を防ぐ）。
  const real = configured && selectedQaQuestionId ? questionQuery.data : undefined;
  const answers = real ? (answersQuery.data ?? []) : undefined;
  const isQuestionAuthor = Boolean(real && user && real.authorId === user.id);

  // 接続済で質問がまだ読み込めていない間はローディング（モックを見せない）
  const loading = configured && Boolean(selectedQaQuestionId) && !questionQuery.data && questionQuery.isPending;

  const title = real?.title ?? (configured ? "" : "併せ初心者です。当日の持ち物で必須なものは？");
  const bodyText =
    real?.body ?? (configured ? "" : "来月はじめて併せに参加します。衣装以外で持っていくと良いものを教えてください。会場は屋内スタジオです。");
  const tag = real?.tag ?? (configured ? "" : "初心者");
  const authorLine = real ? `${real.authorName} · ${real.time}` : configured ? "" : "かな · 2日前";
  const displayAnswers = (
    answers ?? (configured ? [] : mockAnswers.map((a) => ({ ...a, likedByMe: false })))
  ).map((a) => ({ key: a.key, name: a.name, text: a.text, best: a.best, likes: a.likes, likedByMe: a.likedByMe }));
  const answerCount = displayAnswers.length;
  const solved = answers ? answers.some((a) => a.best) : !configured;

  const handleLike = (answerId: string, liked: boolean) => {
    if (real && selectedQaQuestionId && user) {
      toggleLike.mutate({ answerId, userId: user.id, liked, questionId: selectedQaQuestionId });
    } else {
      setMockAnswers((a) => a.map((x) => (x.key === answerId ? { ...x, likes: x.likes + 1 } : x)));
    }
  };

  const handleMarkBest = (answerId: string) => {
    if (selectedQaQuestionId) {
      markBest.mutate({ answerId, questionId: selectedQaQuestionId });
    }
  };

  const post = () => {
    const text = draft.trim();
    if (!text) return;
    if (real && selectedQaQuestionId && user) {
      createAnswer.mutate({ questionId: selectedQaQuestionId, authorId: user.id, body: text });
    } else {
      setMockAnswers((a) => [...a, { key: `me-${a.length}`, name: "あなた", text, best: false, likes: 0 }]);
    }
    setDraft("");
  };

  if (loading) {
    return (
      <div>
        <AppBar title="質問の詳細" onBack={back} />
        <div style={{ padding: "60px 22px", textAlign: "center", fontSize: 13, color: colors.textMutedAlt }}>
          読み込み中…
        </div>
      </div>
    );
  }

  return (
    <div>
      <AppBar title="質問の詳細" onBack={back} />

      {/* question */}
      <div style={{ padding: "10px 22px 0" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
          {solved && (
            <span style={{ fontSize: 9.5, fontWeight: 700, color: colors.positive, background: "#E7F4EC", padding: "3px 8px", borderRadius: 999 }}>
              解決済
            </span>
          )}
          <span style={{ fontSize: 10.5, color: colors.primary, background: colors.primaryBg1, padding: "3px 9px", borderRadius: 999 }}>
            {tag}
          </span>
        </div>
        <h2 style={{ margin: "10px 0 0", fontSize: 18, lineHeight: 1.5, fontWeight: 700, color: colors.textPrimary }}>
          {title}
        </h2>
        <p style={{ margin: "10px 0 0", fontSize: 13, lineHeight: 1.9, color: colors.textSecondary }}>
          {bodyText}
        </p>
        <div style={{ fontSize: 11, color: colors.textMutedSoft, marginTop: 12 }}>{authorLine}</div>
      </div>

      <div style={{ height: 8, background: colors.primaryBg4, margin: "18px 0 0" }} />

      {/* answers */}
      <div style={{ padding: "16px 22px 0" }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: colors.textPrimary }}>回答 {answerCount}件</div>
        <div style={{ display: "flex", flexDirection: "column", gap: 12, marginTop: 14 }}>
          {displayAnswers.map((a) => (
            <div
              key={a.key}
              style={{
                border: `1px solid ${a.best ? "#C9DECF" : colors.borderSoft}`,
                borderRadius: 16,
                padding: 14,
                background: a.best ? "#F3FAF5" : colors.white,
              }}
            >
              {a.best && (
                <div style={{ fontSize: 10.5, fontWeight: 700, color: colors.positive, marginBottom: 8 }}>
                  ★ ベストアンサー
                </div>
              )}
              <div style={{ display: "flex", alignItems: "center", gap: 9 }}>
                <div style={{ width: 30, height: 30, borderRadius: "50%", overflow: "hidden", flex: "0 0 auto" }}>
                  <ImageSlot circle />
                </div>
                <span style={{ fontSize: 12.5, fontWeight: 700, color: colors.textPrimary }}>{a.name}</span>
              </div>
              <p style={{ margin: "10px 0 0", fontSize: 13, lineHeight: 1.8, color: colors.textSecondary }}>{a.text}</p>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 10 }}>
                <button
                  onClick={() => handleLike(a.key, a.likedByMe)}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 5,
                    border: `1px solid ${a.likedByMe ? colors.primary : colors.border}`,
                    background: a.likedByMe ? colors.primaryBg1 : colors.white,
                    color: a.likedByMe ? colors.primary : colors.textSecondaryAlt,
                    borderRadius: 999,
                    padding: "5px 12px",
                    fontSize: 11,
                    cursor: "pointer",
                    fontFamily: "inherit",
                    fontWeight: a.likedByMe ? 700 : 400,
                  }}
                >
                  役に立った {a.likes}
                </button>
                {isQuestionAuthor && !a.best && (
                  <button
                    onClick={() => handleMarkBest(a.key)}
                    style={{
                      border: `1px solid ${colors.border}`,
                      background: colors.white,
                      color: colors.textSecondaryAlt,
                      borderRadius: 999,
                      padding: "5px 12px",
                      fontSize: 11,
                      cursor: "pointer",
                      fontFamily: "inherit",
                    }}
                  >
                    ベストに選ぶ
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* post answer */}
      <div style={{ padding: "20px 22px 30px" }}>
        <textarea
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          placeholder="あなたの回答を書く"
          rows={3}
          style={{
            width: "100%",
            border: `1px solid ${colors.border}`,
            borderRadius: 13,
            padding: "12px 14px",
            fontSize: 13,
            fontFamily: "inherit",
            lineHeight: 1.7,
            color: colors.textPrimary,
            resize: "none",
            outline: "none",
            background: colors.primaryBg5,
          }}
        />
        <PrimaryButton
          onClick={post}
          style={{ marginTop: 10, ...(draft.trim() ? {} : { opacity: 0.45, cursor: "not-allowed" }) }}
        >
          回答を投稿する
        </PrimaryButton>
      </div>
    </div>
  );
}
