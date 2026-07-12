"use client";

import { colors } from "@/lib/tokens";
import { useRouter } from "../AppRouter";
import { PrimaryButton } from "../ui";
import { OnboardProgress } from "./onboardProgress";
import { CheckIcon, ShieldIcon } from "../icons";

const benefits = [
  "プロフィールに「確認済バッジ」が付く",
  "なりすまし対策になり、相手も安心",
  "年齢確認で応援リンクも利用可",
];

export function OnboardVerifyScreen() {
  const { nav } = useRouter();

  return (
    <div style={{ minHeight: "100%", display: "flex", flexDirection: "column" }}>
      <OnboardProgress step={3} />

      <div style={{ padding: "34px 26px 0", textAlign: "center" }}>
        <div
          style={{
            width: 82,
            height: 82,
            margin: "0 auto",
            borderRadius: "50%",
            background: "linear-gradient(155deg,#F2EDFB,#F7EEF6)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <ShieldIcon size={38} />
        </div>
        <h2 style={{ margin: "22px 0 0", fontSize: 23, lineHeight: 1.5, fontWeight: 700, color: colors.textPrimary }}>
          確認済バッジで
          <br />
          安心してつながろう
        </h2>
        <p style={{ margin: "13px 0 0", fontSize: 12.5, color: colors.textMuted, lineHeight: 1.85 }}>
          本人確認は<strong>任意</strong>です。確認すると「確認済バッジ」がプロフィールに付き、相手に安心感を伝えられます。確認しなくても通常どおりご利用いただけます。
        </p>
      </div>

      <div style={{ padding: "24px 22px 0", display: "flex", flexDirection: "column", gap: 10 }}>
        {benefits.map((b) => (
          <div key={b} style={{ display: "flex", alignItems: "center", gap: 11, fontSize: 12.5, color: colors.textSecondary }}>
            <CheckIcon size={18} color={colors.primary} />
            {b}
          </div>
        ))}
      </div>

      {/* 本人確認は当面「手動レビュー」で運用（eKYC はスケール時に移行） */}
      <div style={{ padding: "16px 22px 0" }}>
        <p style={{ margin: 0, fontSize: 10.5, color: colors.textMutedSoft, lineHeight: 1.6, textAlign: "center" }}>
          身分証の画像を運営が確認して反映します。画像は確認後すぐに削除されます。
        </p>
      </div>

      <div style={{ padding: "18px 22px 0", marginTop: "auto" }}>
        <PrimaryButton onClick={() => nav("verify")}>本人確認をはじめる</PrimaryButton>
      </div>
      <div style={{ padding: "12px 22px 30px", textAlign: "center" }}>
        <button
          onClick={() => nav("home", "home")}
          style={{ background: "none", border: "none", fontFamily: "inherit", fontSize: 12.5, color: colors.textMutedAlt, cursor: "pointer" }}
        >
          あとで設定する
        </button>
      </div>
    </div>
  );
}
