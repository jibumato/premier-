"use client";

import { useRef, useState } from "react";
import { avatarRing, colors } from "@/lib/tokens";
import { galleryKeys, giftTiers } from "@/lib/data";
import { useRouter } from "../AppRouter";
import { ImageSlot } from "../ImageSlot";
import { SectionHeading } from "../ui";
import { ChevronLeftIcon, FlagIcon, MeisterIcon, MessageIcon, PlusIcon, SettingsIcon, StarIcon, VerifiedBadge, VerifiedBadgeGhost } from "../icons";
import { useAuth } from "@/lib/auth/useAuth";
import { useAwaseAchievementCount, useFollowerCount, useProfile, useUpdateProfileImage, useUpdateProfileText } from "@/lib/queries/profile";
import { useGetOrCreateConversation } from "@/lib/queries/messages";
import { useCreatePost, usePosts } from "@/lib/queries/posts";
import { useReviewsReceived } from "@/lib/queries/reviews";
import { useUploadImage } from "@/lib/queries/upload";
import { isSupabaseConfigured } from "@/lib/supabase/config";

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

// ローンチ時は非表示（いずれも現状は非機能のため）。
//  - supportLinks: プロフィールに紐づく実URLがまだ無く、リンクが開かない
//  - gift: アプリ内課金（コイン）が未実装
// 実装が入ったら true に戻すだけで復活する。
const LAUNCH_FLAGS = { supportLinks: false, gift: false };

export function ProfileScreen() {
  const { back, nav, openChat, openReport, selectedProfileId } = useRouter();
  const { user } = useAuth();
  const configured = isSupabaseConfigured();

  // Reached both from the bottom-nav "マイページ" tab (selectedProfileId is
  // null → always the signed-in user) and from a detail/market host card's
  // "プロフ→" via openProfile(userId) (viewing someone else).
  const targetId = selectedProfileId ?? user?.id;
  const isOwnProfile = !selectedProfileId || selectedProfileId === user?.id;

  const profileQuery = useProfile(targetId);
  // Zoning gates on the *viewer's* age verification, not the viewed profile's:
  // an under-18 viewer must not see anyone's (possibly adult) external links.
  // React Query dedupes this with profileQuery when viewing one's own profile.
  const viewerProfileQuery = useProfile(user?.id);
  const followerCount = useFollowerCount(targetId);
  const achievementCount = useAwaseAchievementCount(targetId);
  const reviewsReceived = useReviewsReceived(targetId);
  const postsQuery = usePosts(targetId);
  const updateImage = useUpdateProfileImage();
  const updateText = useUpdateProfileText();
  const uploadImage = useUploadImage();
  const [editing, setEditing] = useState(false);
  const [nameInput, setNameInput] = useState("");
  const [bioInput, setBioInput] = useState("");
  const createPost = useCreatePost();
  const getOrCreateConversation = useGetOrCreateConversation();
  const avatarInputRef = useRef<HTMLInputElement>(null);
  const coverInputRef = useRef<HTMLInputElement>(null);
  const postInputRef = useRef<HTMLInputElement>(null);

  const real = configured && targetId ? profileQuery.data : undefined;
  const canEdit = configured && isOwnProfile;
  const posts = real ? (postsQuery.data ?? []) : undefined;
  // Real users see their own (possibly empty) fields; only the prototype/mock
  // mode falls back to the demo placeholder text. This prevents a brand-new
  // account from showing another persona's sample bio/name/title.
  const displayName = real ? real.display_name : "澪 / mio";
  const bio = real ? (real.bio ?? "") : "ファンタジー系と和風がすき。透明感のある世界観で活動中。併せ・撮影のお声がけ歓迎です◎";
  const isVerified = real?.is_verified ?? true;
  // Zoning: show external support links only to an age-verified viewer. When
  // unconfigured (prototype) it stays visible, matching the original behavior.
  const ageVerified = configured ? Boolean(viewerProfileQuery.data?.is_age_verified) : true;
  const meisterTitle = real ? real.meister_title : "併せマイスター";
  const stats = [
    { n: posts ? String(posts.length) : "128", l: "投稿" },
    { n: real ? String(followerCount.data ?? 0) : "4.2k", l: "フォロワー" },
    { n: real ? String(achievementCount.data ?? 0) : "36", l: "併せ実績" },
  ];

  const handlePickImage = (field: "avatar_url" | "cover_url") => {
    if (!canEdit || !user) return;
    (field === "avatar_url" ? avatarInputRef : coverInputRef).current?.click();
  };

  const handleFileSelected = async (field: "avatar_url" | "cover_url", e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file || !canEdit || !user) return;
    const result = await uploadImage.mutateAsync({ file, kind: field === "avatar_url" ? "avatar" : "cover" });
    if (result.url) updateImage.mutate({ userId: user.id, field, url: result.url });
  };

  const handleAddPost = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file || !canEdit || !user) return;
    const result = await uploadImage.mutateAsync({ file, kind: "post" });
    if (result.url) createPost.mutate({ authorId: user.id, imageUrl: result.url });
  };

  const handleMessage = () => {
    if (real && user && targetId && !isOwnProfile) {
      getOrCreateConversation.mutate(
        { userId: user.id, otherUserId: targetId },
        { onSuccess: (conversationId) => openChat(conversationId) },
      );
    } else {
      nav("chat");
    }
  };

  const openEdit = () => {
    setNameInput(real?.display_name ?? "");
    setBioInput(real?.bio ?? "");
    setEditing(true);
  };
  const saveEdit = () => {
    if (!user || !nameInput.trim()) return;
    updateText.mutate(
      { userId: user.id, displayName: nameInput.trim(), bio: bioInput.trim() },
      { onSuccess: () => setEditing(false) },
    );
  };

  return (
    <div>
      {/* cover + avatar */}
      <div style={{ position: "relative" }}>
        <button
          onClick={() => handlePickImage("cover_url")}
          disabled={!canEdit}
          style={{ display: "block", width: "100%", height: 140, padding: 0, border: "none", cursor: canEdit ? "pointer" : "default" }}
        >
          <ImageSlot radius={0} src={real?.cover_url} />
        </button>
        <input ref={coverInputRef} type="file" accept="image/*" onChange={(e) => handleFileSelected("cover_url", e)} style={{ display: "none" }} />
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
        {isOwnProfile && (
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
        )}
        <button
          onClick={() => handlePickImage("avatar_url")}
          disabled={!canEdit}
          style={{
            position: "absolute",
            left: 20,
            bottom: -38,
            width: 90,
            height: 90,
            borderRadius: "50%",
            padding: 3,
            background: avatarRing,
            border: "none",
            cursor: canEdit ? "pointer" : "default",
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
            <ImageSlot circle src={real?.avatar_url} />
          </div>
        </button>
        <input ref={avatarInputRef} type="file" accept="image/*" onChange={(e) => handleFileSelected("avatar_url", e)} style={{ display: "none" }} />
      </div>

      {/* identity */}
      <div style={{ padding: "46px 22px 0" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <h2 style={{ margin: 0, fontSize: 20, fontWeight: 700, color: colors.textPrimary }}>{displayName}</h2>
          {isVerified ? (
            <VerifiedBadge />
          ) : isOwnProfile ? (
            // Not yet verified: show the empty badge slot (dashed) so the owner
            // can see where the 本人確認 badge will appear, and tap to start it.
            <button
              onClick={() => nav("verify")}
              title="本人確認をするとバッジが表示されます"
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 5,
                padding: "3px 10px 3px 8px",
                borderRadius: 999,
                border: `1.5px dashed ${colors.border}`,
                background: "transparent",
                cursor: "pointer",
                fontFamily: "inherit",
              }}
            >
              <VerifiedBadgeGhost size={14} />
              <span style={{ fontSize: 10.5, fontWeight: 700, color: colors.textMutedAlt }}>
                本人確認バッジ
              </span>
            </button>
          ) : null}
        </div>
        {!isVerified && isOwnProfile && (
          <p style={{ margin: "7px 0 0", fontSize: 11, color: colors.textMutedSoft, lineHeight: 1.6 }}>
            本人確認をすると、お名前の横に確認済みバッジが表示されます。{" "}
            <button
              onClick={() => nav("verify")}
              style={{
                border: "none",
                background: "none",
                padding: 0,
                margin: 0,
                color: colors.primary,
                fontWeight: 700,
                fontSize: 11,
                fontFamily: "inherit",
                cursor: "pointer",
              }}
            >
              本人確認をする →
            </button>
          </p>
        )}
        {meisterTitle && (
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
            <span style={{ fontSize: 11, fontWeight: 700, color: "#8A4E86" }}>{meisterTitle}</span>
          </div>
        )}
        {bio ? (
          <p style={{ margin: "13px 0 0", fontSize: 13, lineHeight: 1.85, color: colors.textSecondary }}>{bio}</p>
        ) : canEdit ? (
          <p style={{ margin: "13px 0 0", fontSize: 12.5, lineHeight: 1.85, color: colors.textMutedSoft }}>
            自己紹介はまだ設定されていません。
          </p>
        ) : null}

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
          {stats.map((s, i) => (
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

        {/* action buttons — own profile can edit; others can message / invite */}
        {canEdit ? (
          <button
            onClick={openEdit}
            style={{
              width: "100%",
              marginTop: 14,
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
            プロフィールを編集
          </button>
        ) : (
          <div style={{ display: "flex", gap: 9, marginTop: 14 }}>
            <button
              onClick={handleMessage}
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
        )}

        {/* inline profile editor (own profile) */}
        {editing && (
          <div
            style={{
              marginTop: 14,
              border: `1px solid ${colors.borderSoft}`,
              borderRadius: 16,
              padding: 15,
              background: colors.primaryBg5,
              display: "flex",
              flexDirection: "column",
              gap: 11,
            }}
          >
            <div>
              <label style={{ fontSize: 11.5, fontWeight: 700, color: colors.textSecondary }}>表示名</label>
              <input
                value={nameInput}
                onChange={(e) => setNameInput(e.target.value)}
                maxLength={30}
                placeholder="ニックネーム"
                style={{
                  width: "100%",
                  marginTop: 6,
                  border: `1px solid ${colors.border}`,
                  borderRadius: 12,
                  padding: "11px 13px",
                  fontSize: 13.5,
                  fontFamily: "inherit",
                  outline: "none",
                  background: colors.white,
                }}
              />
            </div>
            <div>
              <label style={{ fontSize: 11.5, fontWeight: 700, color: colors.textSecondary }}>自己紹介</label>
              <textarea
                value={bioInput}
                onChange={(e) => setBioInput(e.target.value)}
                maxLength={300}
                rows={4}
                placeholder="好きな作品・活動ジャンル・併せへの想いなど"
                style={{
                  width: "100%",
                  marginTop: 6,
                  border: `1px solid ${colors.border}`,
                  borderRadius: 12,
                  padding: "11px 13px",
                  fontSize: 13,
                  lineHeight: 1.7,
                  fontFamily: "inherit",
                  outline: "none",
                  resize: "none",
                  background: colors.white,
                }}
              />
            </div>
            {updateText.isError && (
              <div style={{ fontSize: 11.5, color: "#C0453F" }}>保存に失敗しました。時間をおいて再度お試しください。</div>
            )}
            <div style={{ display: "flex", gap: 8 }}>
              <button
                onClick={() => setEditing(false)}
                style={{
                  flex: 1,
                  border: `1px solid ${colors.border}`,
                  background: colors.white,
                  color: colors.textSecondary,
                  fontFamily: "inherit",
                  fontSize: 12.5,
                  fontWeight: 600,
                  padding: "11px 0",
                  borderRadius: 11,
                  cursor: "pointer",
                }}
              >
                キャンセル
              </button>
              <button
                onClick={saveEdit}
                disabled={!nameInput.trim() || updateText.isPending}
                style={{
                  flex: 2,
                  border: "none",
                  background: colors.primary,
                  color: colors.white,
                  fontFamily: "inherit",
                  fontSize: 12.5,
                  fontWeight: 700,
                  padding: "11px 0",
                  borderRadius: 11,
                  cursor: "pointer",
                  opacity: nameInput.trim() && !updateText.isPending ? 1 : 0.5,
                }}
              >
                {updateText.isPending ? "保存中…" : "保存する"}
              </button>
            </div>
          </div>
        )}
      </div>

      {/* support links (age-gated, external only) */}
      {LAUNCH_FLAGS.supportLinks && ageVerified && (
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
      {LAUNCH_FLAGS.gift && (
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
      )}

      {/* reviews received */}
      {real && reviewsReceived.data && reviewsReceived.data.count > 0 && (
        <div style={{ padding: "26px 22px 0" }}>
          <div style={{ display: "flex", alignItems: "baseline", gap: 8 }}>
            <SectionHeading size={15}>受け取ったレビュー</SectionHeading>
            <span style={{ display: "flex", alignItems: "center", gap: 3, fontSize: 12.5, fontWeight: 700, color: colors.textPrimary }}>
              <StarIcon size={13} color={colors.starGold} filled />
              {reviewsReceived.data.average.toFixed(1)}
              <span style={{ fontSize: 11, fontWeight: 400, color: colors.textMutedAlt }}>
                （{reviewsReceived.data.count}件）
              </span>
            </span>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 9, marginTop: 13 }}>
            {reviewsReceived.data.reviews.slice(0, 5).map((r) => (
              <div
                key={r.id}
                style={{
                  border: `1px solid ${colors.borderSoft}`,
                  borderRadius: 14,
                  padding: "12px 14px",
                  background: colors.white,
                }}
              >
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <span style={{ fontSize: 12.5, fontWeight: 700, color: colors.textPrimary }}>{r.author_name}</span>
                  <span style={{ display: "flex", alignItems: "center", gap: 2 }}>
                    {[1, 2, 3, 4, 5].map((n) => (
                      <StarIcon key={n} size={11} color={colors.starGold} filled={r.rating >= n} />
                    ))}
                  </span>
                </div>
                {r.good_points.length > 0 && (
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginTop: 8 }}>
                    {r.good_points.map((g) => (
                      <span
                        key={g}
                        style={{
                          fontSize: 10.5,
                          color: colors.primary,
                          background: colors.primaryBg1,
                          padding: "4px 9px",
                          borderRadius: 999,
                        }}
                      >
                        {g}
                      </span>
                    ))}
                  </div>
                )}
                {r.comment && (
                  <p style={{ margin: "8px 0 0", fontSize: 12, lineHeight: 1.7, color: colors.textSecondary }}>
                    {r.comment}
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

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
          {posts ? (
            <>
              {canEdit && (
                <button
                  onClick={() => postInputRef.current?.click()}
                  style={{
                    height: 108,
                    borderRadius: 12,
                    border: `1.5px dashed ${colors.border}`,
                    background: colors.primaryBg5,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    cursor: "pointer",
                  }}
                  aria-label="投稿を追加"
                >
                  <PlusIcon size={22} color={colors.textMutedAlt} />
                </button>
              )}
              {posts.map((p) => (
                <div key={p.id} style={{ height: 108 }}>
                  <ImageSlot radius={12} src={p.image_url} />
                </div>
              ))}
              {posts.length === 0 && !canEdit && (
                <div style={{ gridColumn: "1 / -1", textAlign: "center", padding: "18px 0", fontSize: 12, color: colors.textMutedAlt }}>
                  まだ投稿がありません
                </div>
              )}
            </>
          ) : (
            galleryKeys.map((g) => (
              <div key={g} style={{ height: 108 }}>
                <ImageSlot radius={12} />
              </div>
            ))
          )}
        </div>
        <input ref={postInputRef} type="file" accept="image/*" onChange={handleAddPost} style={{ display: "none" }} />

        {/* report — only meaningful for another user's profile */}
        <button
          onClick={() =>
            real && targetId && !isOwnProfile
              ? openReport({ type: "user", id: targetId, userId: targetId })
              : nav("report")
          }
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
