"use client";

import { useState } from "react";
import { colors } from "@/lib/tokens";
import { marketItems as mockMarketItems } from "@/lib/data";
import { useRouter } from "../AppRouter";
import { ImageSlot } from "../ImageSlot";
import { AppBar } from "../ui";
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

  const real = configured ? itemsQuery.data : undefined;
  const loading = configured && itemsQuery.isPending && !itemsQuery.data;
  const items: {
    key: string;
    title: string;
    work: string;
    price: string;
    size: string;
    condition: string;
    sold: boolean;
    imageUrl: string | null;
  }[] = real
    ? real.map((it) => ({ ...it }))
    : configured
      ? []
      : mockMarketItems.map((it) => ({
          key: it.key,
          title: it.title,
          work: it.work,
          price: it.price,
          size: it.size,
          condition: it.condition,
          sold: Boolean(it.sold),
          imageUrl: null,
        }));
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
  const canSubmit = Boolean(title.trim()) && priceNum > 0;

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
        }
      />

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

      {loading && !listing ? (
        <div style={{ padding: "60px 22px", textAlign: "center", fontSize: 13, color: colors.textMutedAlt }}>読み込み中…</div>
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
          {items.map((it) => (
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
    </div>
  );
}
