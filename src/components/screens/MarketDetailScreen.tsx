"use client";

import { colors } from "@/lib/tokens";
import { useRouter } from "../AppRouter";
import { ImageSlot } from "../ImageSlot";
import { AppBar, PrimaryButton, SectionHeading } from "../ui";
import { FlagIcon } from "../icons";

const spec = [
  { label: "サイズ", value: "M（レディース）" },
  { label: "状態", value: "美品（2回着用）" },
  { label: "発送", value: "全国一律 ¥800" },
  { label: "作品", value: "葬送のフリーレン" },
];

export function MarketDetailScreen() {
  const { back, nav } = useRouter();

  return (
    <div>
      <AppBar title="商品の詳細" onBack={back} />

      <div style={{ padding: "6px 22px 0" }}>
        <div style={{ height: 240 }}>
          <ImageSlot radius={18} />
        </div>
      </div>

      <div style={{ padding: "18px 22px 0" }}>
        <h2 style={{ margin: 0, fontSize: 19, lineHeight: 1.4, fontWeight: 700, color: colors.textPrimary }}>
          魔法使い衣装 一式（Mサイズ）
        </h2>
        <div style={{ fontSize: 24, fontWeight: 700, color: colors.textPrimary, marginTop: 10 }}>¥8,500</div>
      </div>

      {/* seller */}
      <div style={{ padding: "18px 22px 0" }}>
        <button
          onClick={() => nav("profile", "mypage")}
          style={{
            width: "100%",
            display: "flex",
            alignItems: "center",
            gap: 12,
            border: `1px solid ${colors.borderSoft}`,
            borderRadius: 16,
            padding: "12px 14px",
            background: colors.primaryBg5,
            cursor: "pointer",
            fontFamily: "inherit",
            textAlign: "left",
          }}
        >
          <div style={{ width: 40, height: 40, borderRadius: "50%", overflow: "hidden", flex: "0 0 auto" }}>
            <ImageSlot circle />
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: colors.textPrimary }}>出品・すず</div>
            <div style={{ fontSize: 11, color: colors.textMutedAlt, marginTop: 2 }}>本人確認済 · 取引 18回</div>
          </div>
          <span style={{ fontSize: 11.5, color: colors.primary, fontWeight: 600 }}>プロフ →</span>
        </button>
      </div>

      {/* spec grid */}
      <div style={{ padding: "20px 22px 0" }}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
          {spec.map((s) => (
            <div key={s.label} style={{ border: `1px solid ${colors.borderSoft}`, borderRadius: 14, padding: "12px 14px" }}>
              <div style={{ fontSize: 10.5, color: colors.textMutedAlt }}>{s.label}</div>
              <div style={{ fontSize: 12.5, fontWeight: 700, color: colors.textPrimary, marginTop: 5 }}>{s.value}</div>
            </div>
          ))}
        </div>
      </div>

      {/* description */}
      <div style={{ padding: "24px 22px 0" }}>
        <SectionHeading size={15}>商品説明</SectionHeading>
        <p style={{ margin: "12px 0 0", fontSize: 13, lineHeight: 1.9, color: colors.textSecondary }}>
          魔法学園シリーズの魔法使い衣装一式です。上着・スカート・マント・小物のセット。自宅保管・喫煙者ペットなし。数回の撮影で着用しました。目立った傷や汚れはありません。ウィッグは別途出品しています。
        </p>
      </div>

      {/* actions */}
      <div style={{ padding: "24px 22px 30px", display: "flex", flexDirection: "column", gap: 10 }}>
        <PrimaryButton onClick={() => nav("chat")}>出品者にメッセージ</PrimaryButton>
        <button
          onClick={() => nav("report")}
          style={{
            width: "100%",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 6,
            border: "none",
            background: "none",
            color: colors.textMutedAlt,
            fontFamily: "inherit",
            fontSize: 12,
            padding: 8,
            cursor: "pointer",
          }}
        >
          <FlagIcon size={14} color={colors.textMutedAlt} />
          この商品を通報する
        </button>
      </div>
    </div>
  );
}
