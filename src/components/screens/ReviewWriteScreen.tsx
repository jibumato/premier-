"use client";

import { useState } from "react";
import { colors } from "@/lib/tokens";
import { useRouter } from "../AppRouter";
import { ImageSlot } from "../ImageSlot";
import { AppBar, PrimaryButton } from "../ui";
import { CheckIcon, StarIcon } from "../icons";

const tagOptions = ["時間を守る", "コミュ○", "写真が上手", "衣装クオリティ高", "また併せたい"];

export function ReviewWriteScreen() {
  const { back, nav } = useRouter();
  const [rating, setRating] = useState(0);
  const [hover, setHover] = useState(0);
  const [tags, setTags] = useState<string[]>([]);
  const [text, setText] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const toggleTag = (t: string) =>
    setTags((cur) => (cur.includes(t) ? cur.filter((x) => x !== t) : [...cur, t]));

  if (submitted) {
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
        <h2 style={{ margin: "26px 0 0", fontSize: 23, fontWeight: 700, color: colors.textPrimary }}>
          レビューを投稿しました！
        </h2>
        <p style={{ margin: "14px 0 0", fontSize: 13, color: colors.textMuted, lineHeight: 1.9 }}>
          あなたの評価が相手の実績に反映されます。
          <br />
          安心して併せができるコミュニティづくりに感謝します。
        </p>
        <PrimaryButton onClick={() => nav("home", "home")} style={{ marginTop: 30 }}>
          ホームに戻る
        </PrimaryButton>
      </div>
    );
  }

  return (
    <div>
      <AppBar title="レビューを書く" onBack={back} />

      {/* target */}
      <div style={{ padding: "14px 22px 0" }}>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 12,
            border: `1px solid ${colors.borderSoft}`,
            borderRadius: 16,
            padding: "12px 14px",
            background: colors.primaryBg5,
          }}
        >
          <div style={{ width: 44, height: 44, borderRadius: "50%", overflow: "hidden", flex: "0 0 auto" }}>
            <ImageSlot circle />
          </div>
          <div>
            <div style={{ fontSize: 13.5, fontWeight: 700, color: colors.textPrimary }}>かな さんへの評価</div>
            <div style={{ fontSize: 11, color: colors.textMutedAlt, marginTop: 2 }}>魔法学園 生徒会併せ · 7/26</div>
          </div>
        </div>
      </div>

      {/* rating */}
      <div style={{ padding: "24px 22px 0", textAlign: "center" }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: colors.textPrimary }}>併せはいかがでしたか？</div>
        <div style={{ display: "flex", justifyContent: "center", gap: 8, marginTop: 14 }}>
          {[1, 2, 3, 4, 5].map((n) => (
            <button
              key={n}
              onClick={() => setRating(n)}
              onMouseEnter={() => setHover(n)}
              onMouseLeave={() => setHover(0)}
              aria-label={`${n}つ星`}
              style={{ background: "none", border: "none", cursor: "pointer", padding: 2 }}
            >
              <StarIcon size={34} filled={(hover || rating) >= n} />
            </button>
          ))}
        </div>
        <div style={{ fontSize: 11.5, color: colors.textMutedAlt, marginTop: 8, minHeight: 16 }}>
          {rating > 0 ? ["", "うーん…", "まあまあ", "よかった", "とても良い", "最高！"][rating] : "タップして評価"}
        </div>
      </div>

      {/* good points */}
      <div style={{ padding: "22px 22px 0" }}>
        <div style={{ fontSize: 12.5, fontWeight: 700, color: "#3A3548" }}>よかった点（任意）</div>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginTop: 11 }}>
          {tagOptions.map((t) => {
            const on = tags.includes(t);
            return (
              <button
                key={t}
                onClick={() => toggleTag(t)}
                style={{
                  fontSize: 12,
                  color: on ? colors.white : "#4A4458",
                  background: on ? colors.primary : colors.white,
                  border: `1px solid ${on ? colors.primary : colors.border}`,
                  padding: "8px 13px",
                  borderRadius: 999,
                  cursor: "pointer",
                  fontFamily: "inherit",
                  fontWeight: on ? 600 : 400,
                }}
              >
                {t}
              </button>
            );
          })}
        </div>
      </div>

      {/* free text */}
      <div style={{ padding: "22px 22px 0" }}>
        <div style={{ fontSize: 12.5, fontWeight: 700, color: "#3A3548" }}>コメント（任意）</div>
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="当日の様子や、これから併せる人へのひとことなど"
          rows={4}
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

      <div style={{ padding: "24px 22px 30px" }}>
        <PrimaryButton
          onClick={() => rating > 0 && setSubmitted(true)}
          style={rating === 0 ? { opacity: 0.45, cursor: "not-allowed" } : undefined}
        >
          レビューを投稿する
        </PrimaryButton>
      </div>
    </div>
  );
}
