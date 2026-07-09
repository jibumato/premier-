"use client";

import { useState } from "react";
import { colors } from "@/lib/tokens";
import { qaItems } from "@/lib/data";
import { useRouter } from "../AppRouter";
import { AppBar } from "../ui";
import { MessageIcon } from "../icons";
import { useAuth } from "@/lib/auth/useAuth";
import { useCreateQaQuestion, useQaQuestions } from "@/lib/queries/qa";
import { isSupabaseConfigured } from "@/lib/supabase/config";

export function QaScreen() {
  const { back, nav, openQaQuestion } = useRouter();
  const { user } = useAuth();
  const configured = isSupabaseConfigured();

  const questionsQuery = useQaQuestions();
  const createQuestion = useCreateQaQuestion();
  const [asking, setAsking] = useState(false);
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [tag, setTag] = useState("");

  const real = configured ? questionsQuery.data : undefined;
  const questions = real ?? qaItems;

  const handleAskClick = () => {
    if (configured && user) {
      setAsking(true);
    } else {
      nav("qaDetail");
    }
  };

  const handleSubmitQuestion = () => {
    if (!user || !title.trim() || !body.trim()) return;
    createQuestion.mutate(
      { authorId: user.id, title: title.trim(), body: body.trim(), tag: tag.trim() || "その他" },
      {
        onSuccess: () => {
          setAsking(false);
          setTitle("");
          setBody("");
          setTag("");
        },
      },
    );
  };

  const handleOpen = (key: string) => {
    if (real) {
      openQaQuestion(key);
    } else {
      nav("qaDetail");
    }
  };

  return (
    <div>
      <AppBar
        title="知恵袋（Q&A）"
        onBack={back}
        right={
          <button
            onClick={handleAskClick}
            style={{
              border: "none",
              background: colors.primary,
              color: colors.white,
              fontFamily: "inherit",
              fontSize: 11.5,
              fontWeight: 700,
              padding: "6px 12px",
              borderRadius: 999,
              cursor: "pointer",
              whiteSpace: "nowrap",
            }}
          >
            質問する
          </button>
        }
      />

      {asking && (
        <div style={{ padding: "12px 22px 0" }}>
          <div
            style={{
              border: `1px solid ${colors.borderSoft}`,
              borderRadius: 16,
              padding: 15,
              background: colors.primaryBg5,
              display: "flex",
              flexDirection: "column",
              gap: 10,
            }}
          >
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="質問のタイトル"
              style={{
                border: `1px solid ${colors.border}`,
                borderRadius: 12,
                padding: "10px 13px",
                fontSize: 13,
                fontFamily: "inherit",
                outline: "none",
                background: colors.white,
              }}
            />
            <input
              value={tag}
              onChange={(e) => setTag(e.target.value)}
              placeholder="タグ（例: 初心者、ウィッグ）"
              style={{
                border: `1px solid ${colors.border}`,
                borderRadius: 12,
                padding: "10px 13px",
                fontSize: 13,
                fontFamily: "inherit",
                outline: "none",
                background: colors.white,
              }}
            />
            <textarea
              value={body}
              onChange={(e) => setBody(e.target.value)}
              placeholder="質問の内容を書く"
              rows={3}
              style={{
                border: `1px solid ${colors.border}`,
                borderRadius: 12,
                padding: "10px 13px",
                fontSize: 13,
                fontFamily: "inherit",
                lineHeight: 1.7,
                resize: "none",
                outline: "none",
                background: colors.white,
              }}
            />
            <div style={{ display: "flex", gap: 8 }}>
              <button
                onClick={() => setAsking(false)}
                style={{
                  flex: 1,
                  border: `1px solid ${colors.border}`,
                  background: colors.white,
                  color: colors.textSecondary,
                  fontFamily: "inherit",
                  fontSize: 12.5,
                  fontWeight: 600,
                  padding: "10px 0",
                  borderRadius: 11,
                  cursor: "pointer",
                }}
              >
                キャンセル
              </button>
              <button
                onClick={handleSubmitQuestion}
                disabled={!title.trim() || !body.trim()}
                style={{
                  flex: 2,
                  border: "none",
                  background: colors.primary,
                  color: colors.white,
                  fontFamily: "inherit",
                  fontSize: 12.5,
                  fontWeight: 700,
                  padding: "10px 0",
                  borderRadius: 11,
                  cursor: "pointer",
                  opacity: title.trim() && body.trim() ? 1 : 0.5,
                }}
              >
                質問を投稿する
              </button>
            </div>
          </div>
        </div>
      )}

      <div style={{ padding: "10px 22px 30px", display: "flex", flexDirection: "column", gap: 12 }}>
        {questions.map((q) => (
          <button
            key={q.key}
            onClick={() => handleOpen(q.key)}
            style={{
              border: `1px solid ${colors.borderSoft}`,
              borderRadius: 16,
              padding: 15,
              background: colors.white,
              cursor: "pointer",
              fontFamily: "inherit",
              textAlign: "left",
              width: "100%",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
              {q.solved && (
                <span
                  style={{
                    fontSize: 9.5,
                    fontWeight: 700,
                    color: colors.positive,
                    background: "#E7F4EC",
                    padding: "3px 8px",
                    borderRadius: 999,
                  }}
                >
                  解決済
                </span>
              )}
              <span
                style={{
                  fontSize: 10.5,
                  color: colors.primary,
                  background: colors.primaryBg1,
                  padding: "3px 9px",
                  borderRadius: 999,
                }}
              >
                {q.tag}
              </span>
            </div>
            <div style={{ fontSize: 14, fontWeight: 700, color: colors.textPrimary, lineHeight: 1.5, marginTop: 9 }}>
              {q.title}
            </div>
            <p
              style={{
                margin: "6px 0 0",
                fontSize: 12,
                color: colors.textMutedAlt,
                lineHeight: 1.7,
                overflow: "hidden",
                display: "-webkit-box",
                WebkitLineClamp: 2,
                WebkitBoxOrient: "vertical",
              }}
            >
              {q.excerpt}
            </p>
            <div style={{ display: "flex", alignItems: "center", gap: 5, marginTop: 10, fontSize: 11, color: colors.textSecondaryAlt }}>
              <MessageIcon size={14} color={colors.textMutedSoft} />
              回答 {q.answers}件
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
