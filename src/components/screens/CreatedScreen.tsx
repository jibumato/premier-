"use client";

import { colors } from "@/lib/tokens";
import { useRouter } from "../AppRouter";
import { PrimaryButton } from "../ui";
import { SparkleIcon } from "../icons";

export function CreatedScreen() {
  const { nav } = useRouter();

  return (
    <div style={{ padding: "70px 30px 0", textAlign: "center" }}>
      <div
        style={{
          width: 96,
          height: 96,
          margin: "0 auto",
          borderRadius: "50%",
          background: "linear-gradient(155deg,#FBE9F2,#F2EDFB)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <SparkleIcon />
      </div>
      <h2 style={{ margin: "26px 0 0", fontSize: 23, lineHeight: 1.5, fontWeight: 700, color: colors.textPrimary }}>
        募集を公開しました！
      </h2>
      <p style={{ margin: "14px 0 0", fontSize: 13, color: colors.textMuted, lineHeight: 1.9 }}>
        好きな作品が同じ仲間に届きます。
        <br />
        応募が来たら通知でお知らせします。
      </p>
      <PrimaryButton onClick={() => nav("home", "home")} style={{ marginTop: 30 }}>
        ホームに戻る
      </PrimaryButton>
    </div>
  );
}
