"use client";

import { colors } from "@/lib/tokens";
import { useRouter } from "../AppRouter";
import { ImageSlot } from "../ImageSlot";
import { AppBar, PrimaryButton, SectionHeading } from "../ui";
import { FlagIcon } from "../icons";
import { useAuth } from "@/lib/auth/useAuth";
import { useGetOrCreateConversation } from "@/lib/queries/messages";
import { useMarketItem, useMarkSold } from "@/lib/queries/market";
import { isSupabaseConfigured } from "@/lib/supabase/config";

const mockSpec = [
  { label: "サイズ", value: "M（レディース）" },
  { label: "状態", value: "美品（2回着用）" },
  { label: "発送", value: "全国一律 ¥800" },
  { label: "作品", value: "葬送のフリーレン" },
];

export function MarketDetailScreen() {
  const { back, nav, openChat, openProfile, selectedMarketItemId } = useRouter();
  const { user } = useAuth();
  const configured = isSupabaseConfigured();

  const itemQuery = useMarketItem(selectedMarketItemId);
  const getOrCreateConversation = useGetOrCreateConversation();
  const markSold = useMarkSold();

  const real = configured && selectedMarketItemId ? itemQuery.data : undefined;
  const isSeller = Boolean(real && user && real.sellerId === user.id);

  const title = real?.title ?? "魔法使い衣装 一式（Mサイズ）";
  const price = real?.price ?? "¥8,500";
  const sellerName = real?.sellerName ?? "すず";
  const sellerVerified = real?.sellerVerified ?? true;
  const sold = real?.sold ?? false;
  const spec = real
    ? [
        { label: "サイズ", value: real.size || "—" },
        { label: "状態", value: real.condition || "—" },
        { label: "発送", value: real.shipping || "応相談" },
        { label: "作品", value: real.work },
      ]
    : mockSpec;
  const bodyText =
    real?.body ||
    "魔法学園シリーズの魔法使い衣装一式です。上着・スカート・マント・小物のセット。自宅保管・喫煙者ペットなし。数回の撮影で着用しました。目立った傷や汚れはありません。ウィッグは別途出品しています。";

  const handleMessage = () => {
    if (real && user && !isSeller) {
      getOrCreateConversation.mutate(
        { userId: user.id, otherUserId: real.sellerId },
        { onSuccess: (conversationId) => openChat(conversationId) },
      );
    } else {
      nav("chat");
    }
  };

  const handleSeller = () => {
    if (real) {
      openProfile(real.sellerId);
    } else {
      nav("profile", "mypage");
    }
  };

  return (
    <div>
      <AppBar title="商品の詳細" onBack={back} />

      <div style={{ padding: "6px 22px 0" }}>
        <div style={{ height: 240, position: "relative" }}>
          <ImageSlot radius={18} src={real?.imageUrl} />
          {sold && (
            <div
              style={{
                position: "absolute",
                inset: 0,
                borderRadius: 18,
                background: "rgba(42,38,52,.45)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <span
                style={{
                  fontSize: 16,
                  fontWeight: 700,
                  color: colors.white,
                  border: "2px solid #fff",
                  borderRadius: 999,
                  padding: "6px 18px",
                }}
              >
                SOLD
              </span>
            </div>
          )}
        </div>
      </div>

      <div style={{ padding: "18px 22px 0" }}>
        <h2 style={{ margin: 0, fontSize: 19, lineHeight: 1.4, fontWeight: 700, color: colors.textPrimary }}>
          {title}
        </h2>
        <div style={{ fontSize: 24, fontWeight: 700, color: colors.textPrimary, marginTop: 10 }}>{price}</div>
      </div>

      {/* seller */}
      <div style={{ padding: "18px 22px 0" }}>
        <button
          onClick={handleSeller}
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
            <div style={{ fontSize: 13, fontWeight: 700, color: colors.textPrimary }}>出品・{sellerName}</div>
            <div style={{ fontSize: 11, color: colors.textMutedAlt, marginTop: 2 }}>
              {sellerVerified ? "本人確認済" : "本人確認前"}
            </div>
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
          {bodyText}
        </p>
      </div>

      {/* actions */}
      <div style={{ padding: "24px 22px 30px", display: "flex", flexDirection: "column", gap: 10 }}>
        {isSeller ? (
          !sold && (
            <PrimaryButton onClick={() => markSold.mutate({ itemId: real!.id })}>売却済みにする</PrimaryButton>
          )
        ) : (
          <PrimaryButton
            onClick={sold ? undefined : handleMessage}
            style={sold ? { opacity: 0.5, cursor: "not-allowed" } : undefined}
          >
            {sold ? "売却済みです" : "出品者にメッセージ"}
          </PrimaryButton>
        )}
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
