"use client";

import { useState } from "react";
import { colors } from "@/lib/tokens";
import { marketItems as mockMarketItems } from "@/lib/data";
import { useRouter } from "../AppRouter";
import { ImageSlot } from "../ImageSlot";
import { AppBar } from "../ui";
import { RefreshIcon } from "../icons";
import { MarketCardSkeleton } from "../Skeleton";
import { ErrorState } from "../ErrorState";
import { PullToRefresh } from "../PullToRefresh";
import { useAuth } from "@/lib/auth/useAuth";
import { useWorks } from "@/lib/queries/works";
import { useCreateMarketItem, useMarketItems } from "@/lib/queries/market";
import { useModerationFilter } from "@/lib/queries/moderation";
import { useUploadImage } from "@/lib/queries/upload";
import { isSupabaseConfigured } from "@/lib/supabase/config";

const inputStyle = {
  border: `1px solid ${colors.border}`,
  borderRadius: 12,
  padding: "10px 13px",
  fontSize: 13,
  fontFamily: "inherit",
  outline: "none",
  background: colors.white,
  width: "100%",
} as const;

export function MarketScreen() {
  const { back, nav, openMarketItem } = useRouter();
  const { user } = useAuth();
  const configured = isSupabaseConfigured();

  const moderation = useModerationFilter(user?.id);
  const itemsQuery = useMarketItems(moderation.data);
  const worksQuery = useWorks();
  const createItem = useCreateMarketItem();
  const uploadImage = useUploadImage();

  const [listing, setListing] = useState(false);
  const [title, setTitle] = useState("");
  const [workId, setWorkId] = useState("");
  const [price, setPrice] = useState("");
  const [size, setSize] = useState("");
  const [condition, setCondition] = useState("");
  const [shipping, setShipping] = useState("");
  const [body, setBody] = useState("");
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  // 出品前の同意（自分の正当な私物である／権利侵害・禁止物でない）。責任の所在を
  // 出品者側に明確化する。チェックしないと出品できない。
  const [agreed, setAgreed] = useState(false);

  const real = configured ? itemsQuery.data : undefined;
  const loading = configured && itemsQuery.isPending && !itemsQuery.data;
  const hasError = configured && itemsQuery.isError && !itemsQuery.data;
  // 「本人確認済みの出品者のみ」表示するかの絞り込み（安心して買える取引の可視化）。
  const [verifiedOnly, setVerifiedOnly] = useState(false);
  const items: {
    key: string;
    title: string;
    work: string;
    price: string;
    size: string;
    condition: string;
    sold: boolean;
    imageUrl: string | null;
    sellerVerified: boolean;
  }[] = real
    ? real.map((it) => ({ ...it }))
    : configured
      ? []
      : mockMarketItems.map((it, i) => ({
          key: it.key,
          title: it.title,
          work: it.work,
          price: it.price,
          size: it.size,
          condition: it.condition,
          sold: Boolean(it.sold),
          imageUrl: null,
          // プレビュー（モック）では一部を本人確認済みに見立ててバッジを確認できるように。
          sellerVerified: i % 2 === 0,
        }));
  const shownItems = verifiedOnly ? items.filter((it) => it.sellerVerified) : items;
  const works = worksQuery.data ?? [];

  const resetForm = () => {
    setListing(false);
    setTitle("");
    setWorkId("");
    setPrice("");
    setSize("");
    setCondition("");
    setShipping("");
    setBody("");
    setImageUrl(null);
    setAgreed(false);
  };

  const handleListClick = () => {
    if (configured && user) {
      setListing((v) => !v);
    } else {
      nav("marketDetail");
    }
  };

  const handlePickImage = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    setUploading(true);
    try {
      const result = await uploadImage.mutateAsync({ file, kind: "market" });
      if (result.url) setImageUrl(result.url);
    } finally {
      setUploading(false);
    }
  };

  const priceNum = Number(price.replace(/[^0-9]/g, ""));
  const canSubmit = Boolean(title.trim()) && priceNum > 0 && agreed;

  const handleSubmit = () => {
    if (!user || !canSubmit) return;
    createItem.mutate(
      {
        sellerId: user.id,
        title: title.trim(),
        workId: workId || null,
        price: priceNum,
        size: size.trim(),
        condition: condition.trim(),
        shipping: shipping.trim(),
        body: body.trim(),
        imageUrl,
      },
      { onSuccess: resetForm },
    );
  };

  const handleOpen = (key: string) => {
    if (real) {
      openMarketItem(key);
    } else {
      nav("marketDetail");
    }
  };

  return (
    <div>
      <AppBar
        title="フリマ（衣装売買）"
        onBack={back}
        right={
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            {configured && (
              <button
                onClick={() => itemsQuery.refetch()}
                aria-label="更新"
                disabled={itemsQuery.isFetching}
                style={{
                  background: "none",
                  border: "none",
                  padding: 10,
                  margin: -10,
                  cursor: itemsQuery.isFetching ? "default" : "pointer",
                  display: "flex",
                  opacity: itemsQuery.isFetching ? 0.4 : 1,
                }}
              >
                <RefreshIcon size={18} color={colors.textSecondary} />
              </button>
            )}
            <button
              onClick={handleListClick}
              style={{
                border: "none",
                background: colors.primary,
                color: colors.white,
                fontFamily: "inherit",
                fontSize: 11.5,
                fontWeight: 700,
                padding: "6px 12px",
                borderRadius: 999,
                cursor: "pointer",
                whiteSpace: "nowrap",
              }}
            >
              出品する
            </button>
          </div>
        }
      />

      <PullToRefresh onRefresh={() => itemsQuery.refetch()} refreshing={itemsQuery.isFetching}>
      {/* note: peer-to-peer, in-app payment not yet implemented */}
      <div style={{ padding: "6px 22px 0" }}>
        <div
          style={{
            fontSize: 11,
            color: colors.textMutedAlt,
            background: colors.primaryBg4,
            border: `1px solid ${colors.borderSoft}`,
            borderRadius: 12,
            padding: "10px 12px",
            lineHeight: 1.6,
          }}
        >
          衣装・小道具の個人間売買スペースです。取引は出品者と直接メッセージで行います。
        </div>
      </div>

      {listing && (
        <div style={{ padding: "12px 22px 0" }}>
          <div
            style={{
              border: `1px solid ${colors.borderSoft}`,
              borderRadius: 16,
              padding: 15,
              background: colors.primaryBg5,
              display: "flex",
              flexDirection: "column",
              gap: 10,
            }}
          >
            <label
              style={{
                height: 120,
                borderRadius: 12,
                border: `1.5px dashed ${colors.border}`,
                background: colors.white,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                cursor: "pointer",
                overflow: "hidden",
                position: "relative",
              }}
            >
              {imageUrl ? (
                <ImageSlot radius={12} src={imageUrl} />
              ) : (
                <span style={{ fontSize: 12, color: colors.textMutedAlt }}>
                  {uploading ? "アップロード中…" : "＋ 商品画像を追加"}
                </span>
              )}
              <input type="file" accept="image/*" onChange={handlePickImage} style={{ display: "none" }} />
            </label>
            <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="商品名（例: 魔法使い衣装 一式）" style={inputStyle} />
            <select value={workId} onChange={(e) => setWorkId(e.target.value)} style={{ ...inputStyle, color: workId ? colors.textPrimary : colors.textMutedAlt }}>
              <option value="">作品を選択（任意）</option>
              {works.map((w) => (
                <option key={w.id} value={w.id} style={{ color: colors.textPrimary }}>
                  {w.name}
                </option>
              ))}
            </select>
            <input value={price} onChange={(e) => setPrice(e.target.value)} inputMode="numeric" placeholder="価格（円）" style={inputStyle} />
            <div style={{ display: "flex", gap: 8 }}>
              <input value={size} onChange={(e) => setSize(e.target.value)} placeholder="サイズ（例: M）" style={inputStyle} />
              <input value={condition} onChange={(e) => setCondition(e.target.value)} placeholder="状態（例: 美品）" style={inputStyle} />
            </div>
            <input value={shipping} onChange={(e) => setShipping(e.target.value)} placeholder="発送（例: 全国一律 ¥800）" style={inputStyle} />
            <textarea
              value={body}
              onChange={(e) => setBody(e.target.value)}
              placeholder="商品説明"
              rows={3}
              style={{ ...inputStyle, lineHeight: 1.7, resize: "none" }}
            />

            {/* 出品前の同意（禁止物の注意＋自己申告チェック）。取引は当事者間の直接
                取引で、運営は代金・配送・返金に関与しない旨をここでも明示する。 */}
            <div
              style={{
                border: `1px solid ${colors.borderSoft}`,
                borderRadius: 12,
                padding: "11px 13px",
                background: colors.primaryBg4,
                display: "flex",
                flexDirection: "column",
                gap: 8,
              }}
            >
              <div style={{ fontSize: 11, color: colors.textMutedAlt, lineHeight: 1.7 }}>
                <strong style={{ color: colors.textSecondary }}>出品できないもの：</strong>
                偽ブランド品・海賊版・無許諾の公式/二次創作グッズ、着用済み下着など性的な物、
                その他法令や規約で禁止された物品。取引は出品者と購入者の直接取引です（運営は代金の
                預かり・配送・返金に関与しません）。
              </div>
              <label style={{ display: "flex", alignItems: "flex-start", gap: 9, cursor: "pointer" }}>
                <input
                  type="checkbox"
                  checked={agreed}
                  onChange={(e) => setAgreed(e.target.checked)}
                  style={{ marginTop: 1, width: 16, height: 16, accentColor: colors.primary, flex: "0 0 auto" }}
                />
                <span style={{ fontSize: 11.5, lineHeight: 1.6, color: colors.textSecondary }}>
                  これは自分が正当に処分できる私物で、権利侵害品・禁止物ではありません。
                  <button
                    type="button"
                    onClick={() => nav("terms")}
                    style={{
                      border: "none",
                      background: "none",
                      padding: 0,
                      marginLeft: 4,
                      color: colors.primary,
                      fontFamily: "inherit",
                      fontSize: 11.5,
                      fontWeight: 600,
                      cursor: "pointer",
                      textDecoration: "underline",
                    }}
                  >
                    ガイドラインを見る
                  </button>
                </span>
              </label>
            </div>

            <div style={{ display: "flex", gap: 8 }}>
              <button
                onClick={resetForm}
                style={{
                  flex: 1,
                  border: `1px solid ${colors.border}`,
                  background: colors.white,
                  color: colors.textSecondary,
                  fontFamily: "inherit",
                  fontSize: 12.5,
                  fontWeight: 600,
                  padding: "10px 0",
                  borderRadius: 11,
                  cursor: "pointer",
                }}
              >
                キャンセル
              </button>
              <button
                onClick={handleSubmit}
                disabled={!canSubmit}
                style={{
                  flex: 2,
                  border: "none",
                  background: colors.primary,
                  color: colors.white,
                  fontFamily: "inherit",
                  fontSize: 12.5,
                  fontWeight: 700,
                  padding: "10px 0",
                  borderRadius: 11,
                  cursor: "pointer",
                  opacity: canSubmit ? 1 : 0.5,
                }}
              >
                出品する
              </button>
            </div>
          </div>
        </div>
      )}

      {!listing && items.length > 0 && (
        <div style={{ padding: "14px 22px 0", display: "flex", justifyContent: "flex-end" }}>
          <button
            onClick={() => setVerifiedOnly((v) => !v)}
            aria-pressed={verifiedOnly}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 6,
              border: `1px solid ${verifiedOnly ? colors.primary : colors.border}`,
              background: verifiedOnly ? colors.primaryBg5 : colors.white,
              color: verifiedOnly ? colors.primary : colors.textSecondary,
              fontFamily: "inherit",
              fontSize: 11.5,
              fontWeight: 600,
              padding: "7px 13px",
              borderRadius: 999,
              cursor: "pointer",
            }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/verified-badge.png" alt="" width={13} height={13} style={{ display: "block" }} />
            本人確認済みのみ
          </button>
        </div>
      )}

      {loading && !listing ? (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, padding: "16px 22px 30px" }}>
          {[0, 1, 2, 3].map((i) => (
            <MarketCardSkeleton key={i} />
          ))}
        </div>
      ) : hasError && !listing ? (
        <ErrorState onRetry={() => itemsQuery.refetch()} />
      ) : verifiedOnly && shownItems.length === 0 && items.length > 0 && !listing ? (
        <div style={{ padding: "40px 22px", textAlign: "center", fontSize: 12.5, color: colors.textMutedAlt, lineHeight: 1.8 }}>
          本人確認済みの出品者による商品はまだありません。
          <br />
          絞り込みを解除すると、すべての出品を表示します。
        </div>
      ) : real && items.length === 0 && !listing ? (
        <div style={{ padding: "40px 22px", textAlign: "center", fontSize: 12.5, color: colors.textMutedAlt, lineHeight: 1.8 }}>
          まだ出品はありません。
          <br />
          右上の「出品する」から最初の1点を掲載してみましょう。
        </div>
      ) : (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: 12,
            padding: "16px 22px 30px",
          }}
        >
          {shownItems.map((it) => (
            <button
              key={it.key}
              onClick={() => handleOpen(it.key)}
              style={{
                border: `1px solid ${colors.borderSoft}`,
                borderRadius: 16,
                background: colors.white,
                padding: 0,
                overflow: "hidden",
                cursor: "pointer",
                fontFamily: "inherit",
                textAlign: "left",
              }}
            >
              <div style={{ position: "relative", height: 118 }}>
                <ImageSlot radius={0} src={it.imageUrl} />
                {it.sellerVerified && !it.sold && (
                  <span
                    style={{
                      position: "absolute",
                      right: 6,
                      top: 6,
                      display: "flex",
                      alignItems: "center",
                      gap: 3,
                      fontSize: 9,
                      fontWeight: 700,
                      color: colors.primary,
                      background: "rgba(255,255,255,.94)",
                      padding: "3px 7px 3px 5px",
                      borderRadius: 999,
                    }}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src="/verified-badge.png" alt="" width={11} height={11} style={{ display: "block" }} />
                    本人確認済
                  </span>
                )}
                {it.sold && (
                  <div
                    style={{
                      position: "absolute",
                      inset: 0,
                      background: "rgba(42,38,52,.45)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <span
                      style={{
                        fontSize: 12,
                        fontWeight: 700,
                        color: colors.white,
                        border: "1.5px solid #fff",
                        borderRadius: 999,
                        padding: "4px 12px",
                      }}
                    >
                      SOLD
                    </span>
                  </div>
                )}
                {it.size && (
                  <span
                    style={{
                      position: "absolute",
                      left: 6,
                      top: 6,
                      fontSize: 9,
                      fontWeight: 600,
                      color: colors.primary,
                      background: "rgba(255,255,255,.94)",
                      padding: "3px 8px",
                      borderRadius: 999,
                    }}
                  >
                    {it.size}
                  </span>
                )}
              </div>
              <div style={{ padding: "9px 11px 12px" }}>
                <div
                  style={{
                    fontSize: 12,
                    fontWeight: 700,
                    color: colors.textPrimary,
                    lineHeight: 1.4,
                    overflow: "hidden",
                    display: "-webkit-box",
                    WebkitLineClamp: 2,
                    WebkitBoxOrient: "vertical",
                    minHeight: 34,
                  }}
                >
                  {it.title}
                </div>
                <div style={{ fontSize: 10.5, color: colors.textMutedAlt, marginTop: 5 }}>{it.work}</div>
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "baseline",
                    marginTop: 7,
                  }}
                >
                  <span style={{ fontSize: 15, fontWeight: 700, color: colors.textPrimary }}>{it.price}</span>
                  <span style={{ fontSize: 10, color: colors.textMutedAlt }}>{it.condition}</span>
                </div>
              </div>
            </button>
          ))}
        </div>
      )}
      </PullToRefresh>
    </div>
  );
}
