"use client";

import { useState } from "react";
import { colors } from "@/lib/tokens";
import { reportReasons } from "@/lib/data";
import { useRouter } from "../AppRouter";
import { AppBar, PrimaryButton, Toggle } from "../ui";
import { CheckIcon } from "../icons";

export function ReportScreen() {
  const { back, nav } = useRouter();
  const [reason, setReason] = useState<string | null>(null);
  const [detail, setDetail] = useState("");
  const [alsoBlock, setAlsoBlock] = useState(false);
  const [done, setDone] = useState(false);

  if (done) {
    return (
      <div style={{ padding: "70px 30px 0", textAlign: "center" }}>
        <div
          style={{
            width: 96,
            height: 96,
            margin: "0 auto",
            borderRadius: "50%",
            background: "linear-gradient(155deg,#F2EDFB,#F7EEF6)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <CheckIcon />
        </div>
        <h2 style={{ margin: "26px 0 0", fontSize: 21, fontWeight: 700, color: colors.textPrimary }}>
          通報を受け付けました
        </h2>
        <p style={{ margin: "14px 0 0", fontSize: 13, color: colors.textMuted, lineHeight: 1.9 }}>
          該当のコンテンツはあなたの画面から自動的に非表示になり、確認キューに送られました。
          {alsoBlock && (
            <>
              <br />
              このユーザーをブロックしました。
            </>
          )}
        </p>
        <PrimaryButton onClick={() => nav("home", "home")} style={{ marginTop: 30 }}>
          ホームに戻る
        </PrimaryButton>
      </div>
    );
  }

  return (
    <div>
      <AppBar title="通報する" onBack={back} />

      <div style={{ padding: "10px 22px 0" }}>
        <p style={{ margin: 0, fontSize: 12.5, color: colors.textMutedAlt, lineHeight: 1.8 }}>
          通報の理由を選んでください。受付後、該当コンテンツは自動的に一時非表示となり、内容が確認されます。緊急性の高い内容は優先的に対応されます。
        </p>
      </div>

      {/* reasons */}
      <div style={{ padding: "18px 22px 0", display: "flex", flexDirection: "column", gap: 9 }}>
        {reportReasons.map((r) => {
          const on = reason === r;
          return (
            <button
              key={r}
              onClick={() => setReason(r)}
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                border: `1.5px solid ${on ? colors.primary : colors.border}`,
                borderRadius: 13,
                padding: "13px 15px",
                background: on ? colors.primaryBg2 : colors.white,
                cursor: "pointer",
                fontFamily: "inherit",
                textAlign: "left",
                width: "100%",
              }}
            >
              <span style={{ fontSize: 13.5, fontWeight: on ? 700 : 500, color: colors.textPrimary }}>{r}</span>
              <span
                style={{
                  width: 20,
                  height: 20,
                  borderRadius: "50%",
                  border: `2px solid ${on ? colors.primary : "#D6D0E4"}`,
                  background: on ? colors.primary : colors.white,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flex: "0 0 auto",
                }}
              >
                {on && <span style={{ width: 8, height: 8, borderRadius: "50%", background: colors.white }} />}
              </span>
            </button>
          );
        })}
      </div>

      {/* detail */}
      <div style={{ padding: "20px 22px 0" }}>
        <div style={{ fontSize: 12.5, fontWeight: 700, color: "#3A3548" }}>詳細（任意）</div>
        <textarea
          value={detail}
          onChange={(e) => setDetail(e.target.value)}
          placeholder="状況をできるだけ具体的に教えてください"
          rows={3}
          style={{
            width: "100%",
            marginTop: 8,
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
      </div>

      {/* also block */}
      <div style={{ padding: "16px 22px 0" }}>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            border: `1px solid ${colors.borderSoft}`,
            borderRadius: 14,
            padding: "13px 15px",
            background: colors.primaryBg5,
          }}
        >
          <div>
            <div style={{ fontSize: 13, fontWeight: 700, color: colors.textPrimary }}>このユーザーもブロック</div>
            <div style={{ fontSize: 11, color: colors.textMutedAlt, marginTop: 2 }}>
              今後お互いの投稿・メッセージが表示されなくなります
            </div>
          </div>
          <Toggle on={alsoBlock} onChange={setAlsoBlock} ariaLabel="ブロックする" />
        </div>
      </div>

      <div style={{ padding: "24px 22px 30px" }}>
        <PrimaryButton
          onClick={() => reason && setDone(true)}
          style={reason ? undefined : { opacity: 0.45, cursor: "not-allowed" }}
        >
          通報を送信する
        </PrimaryButton>
      </div>
    </div>
  );
}
