"use client";

import { colors } from "@/lib/tokens";
import { useRouter } from "../AppRouter";
import { PrimaryButton } from "../ui";
import { OnboardProgress } from "./onboardProgress";
import { CheckIcon, ShieldIcon } from "../icons";

const benefits = [
  "なりすまし・トラブルを防止",
  "確認済バッジがプロフィールに付く",
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
          本人確認をして
          <br />
          安心してつながろう
        </h2>
        <p style={{ margin: "13px 0 0", fontSize: 12.5, color: colors.textMuted, lineHeight: 1.85 }}>
          身分証で確認した人だけが、女性限定募集や併せに参加できます。情報は暗号化して安全に扱われます。
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

      {/* eKYC note (Constraints: 本人確認は外部eKYCに委任・自動判定) */}
      <div style={{ padding: "16px 22px 0" }}>
        <p style={{ margin: 0, fontSize: 10.5, color: colors.textMutedSoft, lineHeight: 1.6, textAlign: "center" }}>
          確認は外部の本人確認サービスで自動的に行われます。
        </p>
      </div>

      <div style={{ padding: "18px 22px 0", marginTop: "auto" }}>
        <PrimaryButton onClick={() => nav("home", "home")}>本人確認をはじめる</PrimaryButton>
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
