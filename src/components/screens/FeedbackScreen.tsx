"use client";

import { useState } from "react";
import type { CSSProperties } from "react";
import { colors } from "@/lib/tokens";
import { useRouter } from "../AppRouter";
import { AppBar, PrimaryButton } from "../ui";
import { CheckIcon } from "../icons";
import { useAuth } from "@/lib/auth/useAuth";
import {
  FEEDBACK_CATEGORY_LABELS,
  useSubmitFeedback,
  type FeedbackCategory,
} from "@/lib/queries/feedback";
import { isSupabaseConfigured } from "@/lib/supabase/config";

const CATEGORIES: FeedbackCategory[] = ["request", "bug", "other"];

const textArea: CSSProperties = {
  width: "100%",
  boxSizing: "border-box",
  minWidth: 0,
  marginTop: 6,
  border: `1px solid ${colors.border}`,
  borderRadius: 12,
  padding: "12px 14px",
  fontSize: 13.5,
  fontFamily: "inherit",
  lineHeight: 1.8,
  color: "#26222F",
  background: colors.white,
  outline: "none",
  resize: "none",
};

/**
 * 運営へ要望・不具合報告を送るフォーム。サイドバー最下部（モバイルは設定内）
 * から遷移。送信内容は feedback テーブルに入り、運営だけが管理画面
 * （設定 → 運営 → 要望の管理）で閲覧・消し込みできる（RLS・0045）。
 */
export function FeedbackScreen() {
  const { back } = useRouter();
  const { user } = useAuth();
  const configured = isSupabaseConfigured();
  const submit = useSubmitFeedback();

  const [category, setCategory] = useState<FeedbackCategory>("request");
  const [body, setBody] = useState("");
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const canSubmit = body.trim().length > 0 && !submit.isPending;

  const handleSubmit = async () => {
    if (!canSubmit) return;
    setError(null);
    if (configured && user) {
      try {
        await submit.mutateAsync({ userId: user.id, category, body: body.trim() });
        setSent(true);
      } catch (err) {
        setError(err instanceof Error ? err.message : "送信に失敗しました");
      }
    } else {
      // プレビュー環境（未接続）でも画面の流れは確認できるようにする
      setSent(true);
    }
  };

  if (sent) {
    return (
      <div>
        <AppBar title="運営へ要望" onBack={back} />
        <div style={{ padding: "60px 30px", textAlign: "center" }}>
          <div
            style={{
              width: 64,
              height: 64,
              margin: "0 auto",
              borderRadius: "50%",
              background: "linear-gradient(155deg,#F2EDFB,#F7EEF6)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <CheckIcon size={30} />
          </div>
          <div style={{ fontSize: 16, fontWeight: 700, color: colors.textPrimary, marginTop: 16 }}>
            送信しました
          </div>
          <p style={{ margin: "10px 0 0", fontSize: 12.5, color: colors.textMutedAlt, lineHeight: 1.9 }}>
            ご意見ありがとうございます！
            <br />
            いただいた内容は運営が確認し、今後の改善に活用します。
            <br />
            （個別の返信は行っていません）
          </p>
          <PrimaryButton onClick={back} style={{ marginTop: 24, fontSize: 13, padding: 13 }}>
            戻る
          </PrimaryButton>
        </div>
      </div>
    );
  }

  return (
    <div style={{ paddingBottom: 30 }}>
      <AppBar title="運営へ要望" onBack={back} />

      <div style={{ padding: "10px 22px 0" }}>
        <div style={{ fontSize: 11.5, color: colors.textMutedAlt, lineHeight: 1.7, background: colors.primaryBg5, border: `1px solid ${colors.borderSoft}`, borderRadius: 12, padding: "11px 13px" }}>
          「こんな機能がほしい」「ここが使いにくい」「動きがおかしい」など、
          なんでもお送りください。今後の改善の参考にします。
          ユーザー同士のトラブルや利用者の通報は、各画面の<b>通報</b>からお願いします。
        </div>
      </div>

      {/* category */}
      <div style={{ padding: "18px 22px 0" }}>
        <div style={{ fontSize: 12, fontWeight: 700, color: colors.textSecondary }}>種類</div>
        <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
          {CATEGORIES.map((c) => {
            const on = category === c;
            return (
              <button
                key={c}
                type="button"
                onClick={() => setCategory(c)}
                style={{
                  fontSize: 12.5,
                  fontWeight: 600,
                  color: on ? colors.white : "#4A4458",
                  background: on ? colors.primary : colors.white,
                  border: `1px solid ${on ? colors.primary : colors.border}`,
                  borderRadius: 999,
                  padding: "8px 16px",
                  cursor: "pointer",
                  fontFamily: "inherit",
                }}
              >
                {FEEDBACK_CATEGORY_LABELS[c]}
              </button>
            );
          })}
        </div>
      </div>

      {/* body */}
      <div style={{ padding: "18px 22px 0" }}>
        <div style={{ fontSize: 12, fontWeight: 700, color: colors.textSecondary }}>内容 *</div>
        <textarea
          value={body}
          onChange={(e) => setBody(e.target.value.slice(0, 2000))}
          rows={7}
          style={textArea}
          placeholder={
            category === "bug"
              ? "例：〇〇画面で△△をタップすると□□になります（機種・ブラウザも書いていただけると助かります）"
              : "例：〇〇できる機能がほしいです。理由は…"
          }
        />
        <div style={{ fontSize: 10.5, color: colors.textMutedSoft, marginTop: 4, textAlign: "right" }}>
          {body.length}/2000
        </div>
      </div>

      <div style={{ padding: "10px 22px 0" }}>
        <PrimaryButton
          onClick={handleSubmit}
          style={{ opacity: canSubmit ? 1 : 0.55, cursor: canSubmit ? "pointer" : "default" }}
        >
          {submit.isPending ? "送信中…" : "送信する"}
        </PrimaryButton>
        {error && <div style={{ fontSize: 11.5, color: "#C0453F", marginTop: 8 }}>{error}</div>}
        <p style={{ margin: "12px 0 0", fontSize: 10.5, color: colors.textMutedSoft, lineHeight: 1.7 }}>
          送信内容はアカウントに紐づいて運営にのみ届きます。他のユーザーには公開されません。
        </p>
      </div>
    </div>
  );
}
