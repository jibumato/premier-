"use client";

import { colors } from "@/lib/tokens";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { useHomePickups, type HomePickup as Pickup } from "@/lib/queries/pickups";
import { ImageSlot } from "./ImageSlot";

/**
 * トップの「プルミエ！ピックアップ」コーナー。
 * 運営がキュレーションしたレイヤーさん写真を並べるショーケース（タップ導線なし）。
 *
 * 表示枚数は「8枚あれば8、なければ4」を自動で出し分ける（中途半端な枚数で
 * グリッドが欠けないように）。4枚に満たなければコーナーごと非表示にする。
 * 未接続（プロトタイプ）時はレイアウト確認用にプレースホルダーを8枚出す。
 */
export function HomePickup() {
  const configured = isSupabaseConfigured();
  const query = useHomePickups();

  // 実データ: 8枚以上→8、4〜7枚→4、4枚未満→非表示。
  const real = configured ? (query.data ?? []) : undefined;
  let shown: Pickup[] | null = null;
  if (real) {
    if (real.length >= 8) shown = real.slice(0, 8);
    else if (real.length >= 4) shown = real.slice(0, 4);
    else shown = null; // 4枚未満は見栄えが悪いのでコーナーごと隠す
  }

  // 接続済で登録がまだ無い/読込中は何も出さない（プレースホルダーを見せない）。
  if (configured && !shown) return null;

  // プロトタイプ時はレイアウト確認のためプレースホルダーを8枚。
  const placeholders = !configured ? Array.from({ length: 8 }, (_, i) => i) : [];

  return (
    <section style={{ padding: "28px 0 0" }}>
      <div style={{ padding: "0 22px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
          <span style={{ fontSize: 15 }}>✨</span>
          <h2
            style={{
              margin: 0,
              fontSize: 15,
              fontWeight: 700,
              color: colors.textPrimary,
              letterSpacing: ".01em",
            }}
          >
            プルミエ<span style={{ color: colors.pink }}>！</span>ピックアップ
          </h2>
        </div>
        <p style={{ margin: "7px 0 0", fontSize: 12, lineHeight: 1.7, color: colors.textMutedAlt }}>
          コスプレをもっと楽しみたい人へ。
          <br />
          素敵な作品と、新しい仲間との出会い。
        </p>
      </div>

      <div className="pt-pickup-grid" style={{ padding: "14px 22px 0" }}>
        {configured
          ? shown!.map((p) => <PickupTile key={p.key} imageUrl={p.imageUrl} caption={p.caption} />)
          : placeholders.map((i) => <PickupTile key={i} imageUrl={null} caption={null} />)}
      </div>
    </section>
  );
}

/** 3:4 のポートレートタイル。レイヤー写真は縦構図が映えるため縦長にしている。 */
function PickupTile({ imageUrl, caption }: { imageUrl: string | null; caption: string | null }) {
  return (
    <div
      style={{
        position: "relative",
        aspectRatio: "3 / 4",
        borderRadius: 14,
        overflow: "hidden",
        background: colors.primaryBg4,
      }}
    >
      {imageUrl ? (
        // eslint-disable-next-line @next/next/no-img-element -- remote R2/URL, no next/image domain config
        <img
          src={imageUrl}
          alt={caption ?? ""}
          style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
        />
      ) : (
        <ImageSlot radius={14} />
      )}
      {caption && (
        <>
          <div
            aria-hidden
            style={{
              position: "absolute",
              left: 0,
              right: 0,
              bottom: 0,
              height: "45%",
              background: "linear-gradient(180deg, rgba(30,20,50,0), rgba(30,20,50,.42))",
              pointerEvents: "none",
            }}
          />
          <span
            style={{
              position: "absolute",
              left: 9,
              right: 9,
              bottom: 8,
              fontSize: 11,
              fontWeight: 600,
              color: "#fff",
              textShadow: "0 1px 5px rgba(30,20,50,.5)",
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}
          >
            {caption}
          </span>
        </>
      )}
    </div>
  );
}
