"use client";

import { useState } from "react";
import { colors } from "@/lib/tokens";
import { useRouter } from "../AppRouter";
import { ImageSlot } from "../ImageSlot";
import { AppBar, PrimaryButton } from "../ui";
import { CheckIcon, ShieldIcon } from "../icons";
import { useAuth } from "@/lib/auth/useAuth";
import { useProfile } from "@/lib/queries/profile";
import { useLatestVerification, useSubmitVerification } from "@/lib/queries/verification";
import { useUploadImage } from "@/lib/queries/upload";
import { isSupabaseConfigured } from "@/lib/supabase/config";

const benefits = [
  "なりすまし・トラブルを防止",
  "確認済バッジがプロフィールに付く",
  "年齢確認で応援リンクも利用可",
];

export function VerifyScreen() {
  const { back, nav } = useRouter();
  const { user } = useAuth();
  const configured = isSupabaseConfigured();

  const profileQuery = useProfile(user?.id);
  const verification = useLatestVerification(user?.id);
  const submit = useSubmitVerification();
  const uploadImage = useUploadImage();

  const [docUrl, setDocUrl] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);

  const real = configured ? profileQuery.data : undefined;
  const alreadyVerified = Boolean(real?.is_verified);
  // "none" | "pending" | "approved" | "rejected" — drives the status banner.
  const status = configured ? verification.data?.status ?? "none" : "none";
  const isPending = status === "pending";

  const handlePick = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    setUploading(true);
    try {
      const result = await uploadImage.mutateAsync({ file, kind: "kyc" });
      if (result.url) setDocUrl(result.url);
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = () => {
    if (!user || !docUrl) return;
    submit.mutate({ userId: user.id, docUrl });
  };

  // --- already verified ------------------------------------------------------
  if (alreadyVerified) {
    return (
      <div>
        <AppBar title="本人確認" onBack={back} />
        <div style={{ padding: "56px 30px 0", textAlign: "center" }}>
          <div
            style={{
              width: 86,
              height: 86,
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
          <h2 style={{ margin: "24px 0 0", fontSize: 21, fontWeight: 700, color: colors.textPrimary }}>
            本人確認済みです
          </h2>
          <p style={{ margin: "12px 0 0", fontSize: 13, color: colors.textMuted, lineHeight: 1.9 }}>
            確認済バッジがプロフィールに表示されています。
          </p>
          <PrimaryButton onClick={() => nav("profile", "mypage")} style={{ marginTop: 28 }}>
            プロフィールを見る
          </PrimaryButton>
        </div>
      </div>
    );
  }

  return (
    <div style={{ paddingBottom: 30 }}>
      <AppBar title="本人確認" onBack={back} />

      <div style={{ padding: "18px 22px 0", textAlign: "center" }}>
        <div
          style={{
            width: 72,
            height: 72,
            margin: "0 auto",
            borderRadius: "50%",
            background: "linear-gradient(155deg,#F2EDFB,#F7EEF6)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <ShieldIcon size={34} />
        </div>
        <h2 style={{ margin: "16px 0 0", fontSize: 19, fontWeight: 700, color: colors.textPrimary }}>
          身分証で本人確認
        </h2>
        <p style={{ margin: "10px 0 0", fontSize: 12.5, color: colors.textMuted, lineHeight: 1.85 }}>
          運営が内容を確認のうえ、確認済バッジと年齢確認を反映します。画像は確認後すぐに削除されます。
        </p>
      </div>

      <div style={{ padding: "20px 22px 0", display: "flex", flexDirection: "column", gap: 10 }}>
        {benefits.map((b) => (
          <div key={b} style={{ display: "flex", alignItems: "center", gap: 11, fontSize: 12.5, color: colors.textSecondary }}>
            <CheckIcon size={17} color={colors.primary} />
            {b}
          </div>
        ))}
      </div>

      {/* status banner */}
      {isPending ? (
        <div style={{ padding: "22px 22px 0" }}>
          <div
            style={{
              border: `1px solid ${colors.borderSoft}`,
              borderRadius: 16,
              padding: "18px 16px",
              background: colors.primaryBg5,
              textAlign: "center",
            }}
          >
            <div style={{ fontSize: 14, fontWeight: 700, color: colors.textPrimary }}>審査中です</div>
            <p style={{ margin: "6px 0 0", fontSize: 12, color: colors.textMutedAlt, lineHeight: 1.8 }}>
              申請を受け付けました。運営の確認が完了するまでお待ちください。
            </p>
          </div>
        </div>
      ) : (
        <>
          {status === "rejected" && (
            <div style={{ padding: "18px 22px 0" }}>
              <div
                style={{
                  border: `1px solid ${colors.pinkBg1}`,
                  borderRadius: 14,
                  padding: "12px 14px",
                  background: colors.pinkBg1,
                }}
              >
                <div style={{ fontSize: 12.5, fontWeight: 700, color: colors.pinkText }}>
                  前回の申請は承認されませんでした
                </div>
                {verification.data?.note && (
                  <div style={{ fontSize: 11.5, color: colors.textMutedAlt, marginTop: 4, lineHeight: 1.7 }}>
                    {verification.data.note}
                  </div>
                )}
                <div style={{ fontSize: 11.5, color: colors.textMutedAlt, marginTop: 4 }}>
                  もう一度、鮮明な画像で申請してください。
                </div>
              </div>
            </div>
          )}

          {/* uploader */}
          <div style={{ padding: "20px 22px 0" }}>
            <label
              style={{
                height: 150,
                borderRadius: 14,
                border: `1.5px dashed ${colors.border}`,
                background: colors.primaryBg5,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                cursor: configured ? "pointer" : "not-allowed",
                overflow: "hidden",
                position: "relative",
              }}
            >
              {docUrl ? (
                <ImageSlot radius={14} src={docUrl} />
              ) : (
                <span style={{ fontSize: 12.5, color: colors.textMutedAlt }}>
                  {uploading ? "アップロード中…" : "＋ 身分証の画像を選ぶ"}
                </span>
              )}
              <input
                type="file"
                accept="image/*"
                onChange={handlePick}
                disabled={!configured}
                style={{ display: "none" }}
              />
            </label>
            <p style={{ margin: "8px 2px 0", fontSize: 10.5, color: colors.textMutedSoft, lineHeight: 1.6 }}>
              運転免許証・パスポート・マイナンバーカード（表面のみ）などの顔写真付き身分証。マイナンバーの番号は隠して撮影してください。
            </p>
          </div>

          <div style={{ padding: "22px 22px 0" }}>
            <PrimaryButton
              onClick={handleSubmit}
              style={docUrl && !submit.isPending ? undefined : { opacity: 0.45, cursor: "not-allowed" }}
            >
              {submit.isPending ? "送信中…" : "本人確認を申請する"}
            </PrimaryButton>
            {!configured && (
              <p style={{ margin: "10px 0 0", fontSize: 11, color: colors.textMutedSoft, textAlign: "center", lineHeight: 1.6 }}>
                （プレビュー環境では申請は送信されません）
              </p>
            )}
          </div>
        </>
      )}
    </div>
  );
}
