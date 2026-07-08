"use client";

import { avatarRing, colors } from "@/lib/tokens";
import { galleryKeys, giftTiers } from "@/lib/data";
import { useRouter } from "../AppRouter";
import { ImageSlot } from "../ImageSlot";
import { SectionHeading } from "../ui";
import { ChevronLeftIcon, FlagIcon, MeisterIcon, MessageIcon, SettingsIcon, VerifiedBadge } from "../icons";

/**
 * External support links (Fantia / pixivFANBOX / Skeb). Per the handoff
 * Constraints, in-app payments are NOT implemented — only outbound links to
 * external services, shown ONLY to age-verified (18+) users (zoning).
 */
const supportLinks = [
  { key: "fantia", name: "Fantia", handle: "@mio_cos" },
  { key: "fanbox", name: "pixivFANBOX", handle: "mio-fanbox" },
  { key: "skeb", name: "Skeb", handle: "@mio" },
];

export function ProfileScreen() {
  const { back, nav } = useRouter();
  // In production this comes from the eKYC age-verification result.
  const ageVerified = true;

  return (
    <div>
      {/* cover + avatar */}
      <div style={{ position: "relative" }}>
        <div style={{ height: 140 }}>
          <ImageSlot radius={0} />
        </div>
        <button
          onClick={back}
          style={{
            position: "absolute",
            left: 16,
            top: 12,
            width: 34,
            height: 34,
            border: "none",
            borderRadius: "50%",
            background: "rgba(255,255,255,.9)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            cursor: "pointer",
          }}
          aria-label="戻る"
        >
          <ChevronLeftIcon size={20} />
        </button>
        <button
          onClick={() => nav("settings")}
          style={{
            position: "absolute",
            right: 16,
            top: 12,
            width: 34,
            height: 34,
            border: "none",
            borderRadius: "50%",
            background: "rgba(255,255,255,.9)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            cursor: "pointer",
          }}
          aria-label="設定"
        >
          <SettingsIcon size={19} />
        </button>
        <div
          style={{
            position: "absolute",
            left: 20,
            bottom: -38,
            width: 90,
            height: 90,
            borderRadius: "50%",
            padding: 3,
            background: avatarRing,
          }}
        >
          <div
            style={{
              width: "100%",
              height: "100%",
              borderRadius: "50%",
              border: `3px solid ${colors.white}`,
              overflow: "hidden",
            }}
          >
            <ImageSlot circle />
          </div>
        </div>
      </div>

      {/* identity */}
      <div style={{ padding: "46px 22px 0" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <h2 style={{ margin: 0, fontSize: 20, fontWeight: 700, color: colors.textPrimary }}>澪 / mio</h2>
          <VerifiedBadge />
        </div>
        <div
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 5,
            marginTop: 9,
            padding: "5px 11px",
            borderRadius: 999,
            background: "linear-gradient(135deg,#FBE9F2,#EFEBF8)",
            border: "1px solid #EBDCF0",
          }}
        >
          <MeisterIcon />
          <span style={{ fontSize: 11, fontWeight: 700, color: "#8A4E86" }}>併せマイスター</span>
        </div>
        <p style={{ margin: "13px 0 0", fontSize: 13, lineHeight: 1.85, color: colors.textSecondary }}>
          ファンタジー系と和風がすき。透明感のある世界観で活動中。併せ・撮影のお声がけ歓迎です◎
        </p>

        {/* stats */}
        <div
          style={{
            display: "flex",
            marginTop: 16,
            border: `1px solid ${colors.borderSoft}`,
            borderRadius: 16,
            overflow: "hidden",
            background: colors.primaryBg5,
          }}
        >
          {[
            { n: "128", l: "投稿" },
            { n: "4.2k", l: "フォロワー" },
            { n: "36", l: "併せ実績" },
          ].map((s, i) => (
            <div
              key={s.l}
              style={{
                flex: 1,
                textAlign: "center",
                padding: "12px 0",
                borderLeft: i === 0 ? "none" : `1px solid ${colors.borderSoft}`,
              }}
            >
              <div style={{ fontSize: 16, fontWeight: 700, color: colors.textPrimary }}>{s.n}</div>
              <div style={{ fontSize: 10, color: colors.textMutedAlt, marginTop: 2 }}>{s.l}</div>
            </div>
          ))}
        </div>

        {/* action buttons */}
        <div style={{ display: "flex", gap: 9, marginTop: 14 }}>
          <button
            onClick={() => nav("chat")}
            style={{
              flex: 1,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 6,
              border: "none",
              background: colors.primary,
              color: colors.white,
              fontFamily: "inherit",
              fontSize: 13,
              fontWeight: 700,
              padding: "12px 0",
              borderRadius: 13,
              cursor: "pointer",
            }}
          >
            <MessageIcon size={16} color={colors.white} />
            メッセージ
          </button>
          <button
            onClick={() => nav("create")}
            style={{
              flex: 1,
              border: `1px solid ${colors.border}`,
              background: colors.white,
              color: colors.primary,
              fontFamily: "inherit",
              fontSize: 13,
              fontWeight: 700,
              padding: "12px 0",
              borderRadius: 13,
              cursor: "pointer",
            }}
          >
            併せに誘う
          </button>
        </div>
      </div>

      {/* support links (age-gated, external only) */}
      {ageVerified && (
        <div style={{ padding: "26px 22px 0" }}>
          <SectionHeading accent={colors.pink} size={15}>
            応援・支援リンク
          </SectionHeading>
          <p style={{ margin: "8px 0 0", fontSize: 10.5, color: colors.textMutedSoft, lineHeight: 1.7 }}>
            外部サービスへのリンクです。サイト内にアダルトコンテンツはありません。
          </p>
          <div style={{ display: "flex", flexDirection: "column", gap: 9, marginTop: 12 }}>
            {supportLinks.map((s) => (
              <a
                key={s.key}
                href="#"
                onClick={(e) => e.preventDefault()}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  border: `1px solid ${colors.borderSoft}`,
                  borderRadius: 14,
                  padding: "13px 15px",
                  background: colors.white,
                  textDecoration: "none",
                }}
              >
                <div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: colors.textPrimary }}>{s.name}</div>
                  <div style={{ fontSize: 11, color: colors.textMutedAlt, marginTop: 2 }}>{s.handle}</div>
                </div>
                <span style={{ fontSize: 11.5, color: colors.primary, fontWeight: 600, whiteSpace: "nowrap" }}>
                  開く ↗
                </span>
              </a>
            ))}
          </div>
        </div>
      )}

      {/* tip / gift (future-feature placeholder — no in-app payment yet) */}
      <div style={{ padding: "26px 22px 0" }}>
        <SectionHeading accent={colors.pink} size={15}>
          応援ギフトを贈る
        </SectionHeading>
        <div style={{ display: "flex", gap: 9, marginTop: 13 }}>
          {giftTiers.map((gt) => (
            <div
              key={gt.label}
              style={{
                flex: 1,
                textAlign: "center",
                border: `1px solid ${colors.borderSoft}`,
                borderRadius: 16,
                padding: "14px 8px",
                background: colors.white,
              }}
            >
              <div style={{ fontSize: 25, lineHeight: 1 }}>{gt.icon}</div>
              <div style={{ fontSize: 10.5, color: "#877FA0", marginTop: 8 }}>{gt.label}</div>
              <div style={{ fontSize: 12.5, fontWeight: 700, color: colors.textPrimary, marginTop: 3 }}>
                {gt.coins}
              </div>
            </div>
          ))}
        </div>
        <button
          style={{
            width: "100%",
            marginTop: 12,
            border: "none",
            background: `linear-gradient(135deg, ${colors.pink}, ${colors.pinkAlt})`,
            color: colors.white,
            fontFamily: "inherit",
            fontSize: 14,
            fontWeight: 700,
            padding: 13,
            borderRadius: 14,
            cursor: "pointer",
          }}
        >
          コインで応援する
        </button>
      </div>

      {/* gallery */}
      <div style={{ padding: "26px 22px 30px" }}>
        <SectionHeading size={15}>ギャラリー</SectionHeading>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
            gap: 6,
            marginTop: 13,
          }}
        >
          {galleryKeys.map((g) => (
            <div key={g} style={{ height: 108 }}>
              <ImageSlot radius={12} />
            </div>
          ))}
        </div>

        {/* report */}
        <button
          onClick={() => nav("report")}
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 6,
            width: "100%",
            marginTop: 22,
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
          このユーザーを通報・ブロック
        </button>
      </div>
    </div>
  );
}
