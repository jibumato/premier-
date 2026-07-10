"use client";

import { useState } from "react";
import { colors } from "@/lib/tokens";
import { useRouter } from "../AppRouter";
import { AppBar, PrimaryButton, SectionHeading } from "../ui";
import { BuildingIcon, CalendarIcon, BagIcon, CheckIcon } from "../icons";
import { useSubmitCorporateLead } from "@/lib/queries/corporate";
import { isSupabaseConfigured } from "@/lib/supabase/config";

const plans = [
  {
    icon: <BuildingIcon size={26} />,
    name: "スタジオ掲載",
    price: "¥9,800 / 月〜",
    desc: "撮影スタジオを検索面に掲載。空き枠の予約導線・作例ギャラリー付き。",
  },
  {
    icon: <CalendarIcon size={26} />,
    name: "イベント掲載",
    price: "¥19,800 / 回〜",
    desc: "コスプレイベントをカレンダーに掲載。参加表明・当日の併せ募集を集約。",
  },
  {
    icon: <BagIcon size={26} />,
    name: "メーカー広告",
    price: "お問い合わせ",
    desc: "ウィッグ・衣装・カラコン等のブランドを作品タグ連動でネイティブ配信。",
  },
];

const points = [
  "コスプレ・撮影に特化した高感度ユーザー層にリーチ",
  "作品・地域・イベント単位のターゲティング配信",
  "掲載枠の入稿・停止はセルフサーブで完結（審査は自動）",
];

export function CorporateScreen() {
  const { back } = useRouter();
  const configured = isSupabaseConfigured();
  const submitLead = useSubmitCorporateLead();
  const [sent, setSent] = useState(false);
  const [company, setCompany] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const emailValid = /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email);
  const canSubmit = Boolean(company.trim()) && emailValid;

  const handleSubmit = async () => {
    if (!canSubmit) return;
    if (configured) {
      setSubmitting(true);
      try {
        await submitLead.mutateAsync({ company: company.trim(), email: email.trim(), message: message.trim() });
        setSent(true);
      } finally {
        setSubmitting(false);
      }
    } else {
      setSent(true);
    }
  };

  return (
    <div style={{ paddingBottom: 30 }}>
      <AppBar title="法人のお客様へ" onBack={back} />

      {/* hero */}
      <div style={{ padding: "10px 22px 0" }}>
        <div
          style={{
            borderRadius: 20,
            padding: "28px 22px",
            background: "linear-gradient(150deg,#6D5DAB,#4C3E82)",
            color: colors.white,
          }}
        >
          <div style={{ fontSize: 12, opacity: 0.85, fontWeight: 600 }}>プルミエ！ for Business</div>
          <div style={{ fontSize: 22, fontWeight: 700, lineHeight: 1.5, marginTop: 8 }}>
            コスプレイヤーに、
            <br />
            まっすぐ届く。
          </div>
          <p style={{ margin: "10px 0 0", fontSize: 12.5, lineHeight: 1.8, opacity: 0.9 }}>
            スタジオ・イベント・メーカー向けの掲載メニュー。好きな作品でつながるアクティブユーザーに、作品タグ連動でアプローチできます。
          </p>
        </div>
      </div>

      {/* points */}
      <div style={{ padding: "22px 22px 0" }}>
        <div style={{ display: "flex", flexDirection: "column", gap: 11 }}>
          {points.map((p) => (
            <div key={p} style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
              <span
                style={{
                  flex: "0 0 auto",
                  width: 22,
                  height: 22,
                  borderRadius: "50%",
                  background: colors.primaryBg1,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <CheckIcon size={13} />
              </span>
              <span style={{ fontSize: 13, color: colors.textSecondary, lineHeight: 1.6 }}>{p}</span>
            </div>
          ))}
        </div>
      </div>

      {/* plans */}
      <div style={{ padding: "26px 22px 0" }}>
        <SectionHeading size={15}>掲載メニュー</SectionHeading>
        <div style={{ display: "flex", flexDirection: "column", gap: 12, marginTop: 14 }}>
          {plans.map((pl) => (
            <div
              key={pl.name}
              style={{
                display: "flex",
                gap: 13,
                border: `1px solid ${colors.borderSoft}`,
                borderRadius: 16,
                padding: 15,
                background: colors.white,
              }}
            >
              <div
                style={{
                  flex: "0 0 48px",
                  height: 48,
                  borderRadius: 13,
                  background: "linear-gradient(155deg,#F2EDFB,#F7EEF6)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                {pl.icon}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: 8 }}>
                  <span style={{ fontSize: 14, fontWeight: 700, color: colors.textPrimary }}>{pl.name}</span>
                  <span style={{ fontSize: 12, fontWeight: 700, color: colors.primary, whiteSpace: "nowrap" }}>
                    {pl.price}
                  </span>
                </div>
                <p style={{ margin: "6px 0 0", fontSize: 12, color: colors.textSecondary, lineHeight: 1.7 }}>{pl.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* CTA */}
      <div style={{ padding: "26px 22px 0" }}>
        {sent ? (
          <div
            style={{
              border: `1px solid ${colors.borderSoft}`,
              borderRadius: 16,
              padding: "20px 16px",
              background: colors.primaryBg5,
              textAlign: "center",
            }}
          >
            <div style={{ fontSize: 14, fontWeight: 700, color: colors.textPrimary }}>資料請求を受け付けました</div>
            <p style={{ margin: "8px 0 0", fontSize: 12, color: colors.textMutedAlt, lineHeight: 1.8 }}>
              担当より2営業日以内にご連絡します。ありがとうございます。
            </p>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            <input
              value={company}
              onChange={(e) => setCompany(e.target.value)}
              placeholder="会社名"
              style={{
                border: `1px solid ${colors.border}`,
                borderRadius: 12,
                padding: "12px 14px",
                fontSize: 13,
                fontFamily: "inherit",
                outline: "none",
                background: colors.white,
              }}
            />
            <input
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              type="email"
              inputMode="email"
              placeholder="ご連絡先メールアドレス"
              style={{
                border: `1px solid ${colors.border}`,
                borderRadius: 12,
                padding: "12px 14px",
                fontSize: 13,
                fontFamily: "inherit",
                outline: "none",
                background: colors.white,
              }}
            />
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="ご相談内容（任意）"
              rows={3}
              style={{
                border: `1px solid ${colors.border}`,
                borderRadius: 12,
                padding: "12px 14px",
                fontSize: 13,
                fontFamily: "inherit",
                lineHeight: 1.7,
                resize: "none",
                outline: "none",
                background: colors.white,
              }}
            />
            <PrimaryButton
              onClick={handleSubmit}
              style={canSubmit && !submitting ? undefined : { opacity: 0.45, cursor: "not-allowed" }}
            >
              {submitting ? "送信中…" : "資料請求 / お問い合わせ"}
            </PrimaryButton>
          </div>
        )}
      </div>
    </div>
  );
}
