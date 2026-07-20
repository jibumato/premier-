"use client";

import { useEffect, useRef, useState, type CSSProperties } from "react";
import { avatarRing, colors } from "@/lib/tokens";
import { galleryKeys, giftTiers } from "@/lib/data";
import { useRouter } from "../AppRouter";
import { ImageSlot } from "../ImageSlot";
import { WorkCover } from "../WorkCover";
import { SectionHeading } from "../ui";
import { ChevronLeftIcon, ChevronRightIcon, FlagIcon, HeartIcon, MeisterIcon, MessageIcon, PlusIcon, SettingsIcon, StarIcon, VerifiedBadgeGhost, XIcon } from "../icons";
import { useToast } from "../Toast";
import { useAuth } from "@/lib/auth/useAuth";
import { friendlyProfileError, parseProfileLinks, PROFILE_LINK_SERVICES, sanitizeLinkUrl, useAwaseAchievementCount, useFollowerCount, useIsFollowing, useProfile, useToggleFollow, useUpdateProfileImage, useUpdateProfileText, type ProfileLink } from "@/lib/queries/profile";
import { useGetOrCreateConversation } from "@/lib/queries/messages";
import { useCreatePost, useDeletePost, useMyPostLikes, usePosts, useReorderPosts, useTogglePostLike, useUpdatePostVisibility, useUpdatePostWork } from "@/lib/queries/posts";
import { useAwaseHistory } from "@/lib/queries/awase";
import { useReviewsReceived } from "@/lib/queries/reviews";
import { useWorks } from "@/lib/queries/works";
import { useMyUpcomingEvents, useMyUpcomingAppearances } from "@/lib/queries/events";
import { useUploadImage } from "@/lib/queries/upload";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import type { UserRole } from "@/lib/database.types";

// 応援・支援リンク（Fantia / pixivFANBOX / BOOTH / Skeb）は本人が登録した実URL
// を profiles.links（0075）から表示する。アプリ内課金は無く外部送客のみで、
// 収益化サービスへのリンクは年齢確認済みの閲覧者にだけ見せる（ゾーニング）。
//
// gift（アプリ内課金・コイン）は未実装のためローンチ時は非表示。実装が入ったら
// true に戻すだけで復活する。
const LAUNCH_FLAGS = { gift: false };

/** Small translucent ←/→ button used for reordering gallery thumbnails. */
function moveBtnStyle(disabled: boolean): CSSProperties {
  return {
    width: 36,
    height: 28,
    borderRadius: 8,
    border: "none",
    background: "rgba(30,20,40,.6)",
    color: "#fff",
    fontSize: 14,
    lineHeight: 1,
    cursor: disabled ? "default" : "pointer",
    opacity: disabled ? 0.35 : 1,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  };
}

/** 入力（@付き・URL貼り付け・全角混じり）から、@なしのXハンドルだけを取り出す。
 * x.com / twitter.com のURLならパス先頭のユーザー名を拾う。Xのハンドルは
 * 半角英数と _ の最大15文字。 */
function normalizeXHandle(input: string): string {
  const s = input.trim();
  const urlMatch = s.match(/(?:x\.com|twitter\.com)\/@?([A-Za-z0-9_]{1,15})/i);
  if (urlMatch) return urlMatch[1];
  return s.replace(/^@+/, "").replace(/[^A-Za-z0-9_]/g, "").slice(0, 15);
}

/** 登録時に自動採番される handle（user_ + UUID頭8桁）かどうか。
 * ＝ユーザーがまだ自分の @ユーザーネーム を設定していない状態。 */
function isDefaultHandle(handle: string | null | undefined): boolean {
  return !handle || /^user_[0-9a-f]{8}$/.test(handle);
}

/** @ユーザーネームの形式チェック（半角英数と _ の3〜20文字）。DBの check 制約と一致。 */
const HANDLE_RE = /^[a-z0-9_]{3,20}$/;

/** プロフィール編集の「活動タイプ」選択肢（オンボーディングの3択と対応）。 */
const ROLE_OPTIONS: { key: UserRole; label: string }[] = [
  { key: "layer", label: "コスプレイヤー" },
  { key: "photographer", label: "カメラマン" },
  { key: "both", label: "両方" },
];

/** 外部リンク（0075）のサービスキー → メタ情報の逆引き。 */
const SERVICE_BY_KEY = new Map(PROFILE_LINK_SERVICES.map((s) => [s.key, s]));

export function ProfileScreen() {
  const { back, nav, openChat, openReport, openAwase, openEvent, selectedProfileId } = useRouter();
  const { user } = useAuth();
  const { showToast } = useToast();
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
  // フォロー状態（他ユーザーのプロフィールを見ているときのみ有効）
  const isFollowingQuery = useIsFollowing(user?.id, isOwnProfile ? undefined : targetId);
  const toggleFollow = useToggleFollow();
  const [mockFollowing, setMockFollowing] = useState(false); // プロトタイプ用
  const following = configured ? Boolean(isFollowingQuery.data) : mockFollowing;
  const handleFollow = () => {
    if (configured && !user) {
      nav("login");
      return;
    }
    if (configured && user && targetId && !isOwnProfile) {
      if (toggleFollow.isPending) return;
      toggleFollow.mutate({ viewerId: user.id, targetId, following });
    } else {
      setMockFollowing((f) => !f);
    }
  };
  const achievementCount = useAwaseAchievementCount(targetId);
  const reviewsReceived = useReviewsReceived(targetId);
  const postsQuery = usePosts(targetId);
  const updateImage = useUpdateProfileImage();
  const updateText = useUpdateProfileText();
  const uploadImage = useUploadImage();
  const [editing, setEditing] = useState(false);
  const [nameInput, setNameInput] = useState("");
  const [bioInput, setBioInput] = useState("");
  const [xInput, setXInput] = useState("");
  const [handleInput, setHandleInput] = useState("");
  const [searchableByName, setSearchableByName] = useState(false);
  const [roleInput, setRoleInput] = useState<UserRole>("layer");
  const [linkInputs, setLinkInputs] = useState<Record<string, string>>({});
  const [editError, setEditError] = useState<string | null>(null);
  const createPost = useCreatePost();
  const deletePost = useDeletePost();
  const reorderPosts = useReorderPosts();
  const updateWork = useUpdatePostWork();
  const works = useWorks().data ?? [];
  const updateVisibility = useUpdatePostVisibility();
  // コス活ログ（応募行のRLSにより本人のみ取得可能 → 自分のマイページ限定）
  const historyQuery = useAwaseHistory(isOwnProfile ? user?.id : undefined);
  const history = configured && isOwnProfile ? (historyQuery.data ?? []) : [];
  // 参加予定のイベント（本人のマイページのみ）。他人のプロフィールでは「この人が
  // 来るイベント」を一覧化させない＝つきまとい対策として出さない。
  const myEventsQuery = useMyUpcomingEvents(isOwnProfile ? user?.id : undefined);
  const myEvents = configured && isOwnProfile ? (myEventsQuery.data ?? []) : [];
  // 出演イベント（0076）: 本人が公開宣言したもの。本人・他人どちらのプロフィール
  // でも表示する（参加表明と違い、本人の意思による公開情報）。
  const appearancesQuery = useMyUpcomingAppearances(configured ? targetId : undefined);
  const appearances = configured
    ? (appearancesQuery.data ?? [])
    : [{ id: "demo1", name: "コミックマーケット", date: "12/30(土)", region: "東京", startsOn: null, note: "東A-01a" }];
  const [galleryEditing, setGalleryEditing] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  const getOrCreateConversation = useGetOrCreateConversation();
  const avatarInputRef = useRef<HTMLInputElement>(null);
  const coverInputRef = useRef<HTMLInputElement>(null);
  const postInputRef = useRef<HTMLInputElement>(null);

  const real = configured && targetId ? profileQuery.data : undefined;
  const canEdit = configured && isOwnProfile;
  const posts = real ? (postsQuery.data ?? []) : undefined;
  const lightboxUrl = lightboxIndex !== null ? (posts?.[lightboxIndex]?.image_url ?? null) : null;

  // 写真の閲覧数（本人にだけ見せる手応え指標。0022の併せ閲覧数と同じ方針）。
  // 拡大表示（lightbox）を開いたときに1回だけ加算。投稿者本人の閲覧は数えない。
  // 同じ写真を同一セッションで何度開いても二重加算しないよう、加算済みIDを保持する。
  const countedPostIdsRef = useRef<Set<string>>(new Set());
  useEffect(() => {
    if (!configured || !user || lightboxIndex === null) return;
    const post = posts?.[lightboxIndex];
    if (!post || post.author_id === user.id) return;
    if (countedPostIdsRef.current.has(post.id)) return;
    countedPostIdsRef.current.add(post.id);
    getSupabaseBrowserClient().rpc("increment_post_view", { target: post.id }).then(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [configured, user, lightboxIndex]);

  // キーボード操作: Escで閉じる、矢印キーで前後の写真へ
  useEffect(() => {
    if (lightboxIndex === null) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setLightboxIndex(null);
      else if (e.key === "ArrowLeft") setLightboxIndex((i) => (i !== null && i > 0 ? i - 1 : i));
      else if (e.key === "ArrowRight") setLightboxIndex((i) => (i !== null && posts && i < posts.length - 1 ? i + 1 : i));
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lightboxIndex, posts?.length]);

  // ダブルタップ（ダブルクリック）でいいね — Instagram的な操作を踏襲。
  // 取り消しには使わない（誤操作で外れると気付きにくいため、付けるだけ）。
  // heartBurst はタップした場所にハートを一瞬表示する演出用のトリガー。
  const [heartBurst, setHeartBurst] = useState(0);
  useEffect(() => {
    if (!heartBurst) return;
    const t = setTimeout(() => setHeartBurst(0), 700);
    return () => clearTimeout(t);
  }, [heartBurst]);
  const handleLightboxDoubleClick = () => {
    const post = lightboxIndex !== null ? posts?.[lightboxIndex] : undefined;
    if (!post || !user || canEdit) return;
    if (!likedSet.has(post.id)) handleToggleLike(post);
    setHeartBurst((k) => k + 1);
  };

  // いいね。数字は本人（canEdit）にだけ常時表示、他の人には5件を超えたら公開。
  // 自分の投稿にはRLSでいいねを付けられないので、本人プロフィールではボタンを出さない。
  const myLikes = useMyPostLikes(user?.id, (posts ?? []).map((p) => p.id));
  const likedSet = new Set(myLikes.data ?? []);
  const toggleLike = useTogglePostLike();
  const handleToggleLike = (post: { id: string; author_id: string }) => {
    if (!user || canEdit || toggleLike.isPending) return;
    toggleLike.mutate({ postId: post.id, authorId: post.author_id, userId: user.id, liked: likedSet.has(post.id) });
  };
  // Real users see their own (possibly empty) fields; only the prototype/mock
  // mode falls back to the demo placeholder text. This prevents a brand-new
  // account from showing another persona's sample bio/name/title.
  const displayName = real ? real.display_name : "澪 / mio";
  // ハイブリッド公開: 未ログインで他人のプロフィールを見ているとき、個人情報
  // （本名級の表示名・アイコン・カバー・写真・口コミ）を保護し、登録に誘導する。
  const signedOut = configured && !user;
  const maskIdentity = signedOut && !isOwnProfile;
  const shownName = maskIdentity ? `${displayName.slice(0, 1)}◦◦` : displayName;
  const bio = real ? (real.bio ?? "") : "ファンタジー系と和風がすき。透明感のある世界観で活動中。併せ・撮影のお声がけ歓迎です◎";
  const isVerified = real?.is_verified ?? true;
  // Zoning: show external support links only to an age-verified viewer. When
  // unconfigured (prototype) it stays visible, matching the original behavior.
  const ageVerified = configured ? Boolean(viewerProfileQuery.data?.is_age_verified) : true;
  const meisterTitle = real ? real.meister_title : "併せマイスター";
  // Xハンドル。未ログインで他人を見ているとき（maskIdentity）は個人情報保護のため出さない。
  // 実ユーザーは自分の設定値（未設定は空）。プロトタイプはデモのハンドルを表示。
  const xHandle = real ? (real.x_handle ?? "") : "mio_cos";
  // @ユーザーネーム。自動採番のデフォルト値（user_xxxxxxxx）は「未設定」扱いで表示しない。
  const username = real ? (isDefaultHandle(real.handle) ? "" : real.handle) : "mio_cos";
  // 外部リンク（0075）。プロトタイプ（未接続）ではデモ用のサンプルを見せる。
  const profileLinks: ProfileLink[] = real
    ? parseProfileLinks(real.links)
    : [
        { type: "pixiv", url: "https://www.pixiv.net/users/000" },
        { type: "instagram", url: "https://www.instagram.com/mio_cos" },
        { type: "fantia", url: "https://fantia.jp/fanclubs/000" },
      ];
  const snsLinks = profileLinks.filter((l) => SERVICE_BY_KEY.get(l.type)?.category === "sns");
  const supportProfileLinks = profileLinks.filter((l) => SERVICE_BY_KEY.get(l.type)?.category === "support");
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
    if (configured && !user) {
      nav("login");
      return;
    }
    if (real && user && targetId && !isOwnProfile) {
      if (getOrCreateConversation.isPending) return; // 二重タップ防止
      getOrCreateConversation.mutate(
        { userId: user.id, otherUserId: targetId },
        {
          onSuccess: (conversationId) => openChat(conversationId),
          onError: () =>
            showToast("メッセージを開けませんでした。通信環境を確認して、もう一度お試しください。"),
        },
      );
    } else {
      nav("chat");
    }
  };

  const openEdit = () => {
    setNameInput(real?.display_name ?? "");
    setBioInput(real?.bio ?? "");
    setXInput(real?.x_handle ?? "");
    // 自動採番のデフォルトは空欄で提示し、ユーザーに新しく決めてもらう。
    setHandleInput(isDefaultHandle(real?.handle) ? "" : (real?.handle ?? ""));
    setSearchableByName(Boolean(real?.searchable_by_name));
    setRoleInput(real?.role ?? "layer");
    const initLinks: Record<string, string> = {};
    for (const l of parseProfileLinks(real?.links)) initLinks[l.type] = l.url;
    setLinkInputs(initLinks);
    setEditError(null);
    setEditing(true);
  };
  const saveEdit = () => {
    if (!user || !nameInput.trim()) return;
    setEditError(null);
    // @ユーザーネーム: 入力があり、かつ現在値と違うときだけ更新する（一意列で空にはできない）。
    const nextHandle = handleInput.trim().toLowerCase();
    let handleArg: string | undefined;
    if (nextHandle && nextHandle !== real?.handle) {
      if (!HANDLE_RE.test(nextHandle)) {
        setEditError("ユーザーネームは半角英数と _ の3〜20文字で入力してください。");
        return;
      }
      handleArg = nextHandle;
    }
    // 外部リンク（0075）: 入力のあるサービスだけ整形して保存。無効URLは中断。
    const nextLinks: ProfileLink[] = [];
    for (const svc of PROFILE_LINK_SERVICES) {
      const raw = (linkInputs[svc.key] ?? "").trim();
      if (!raw) continue;
      const safe = sanitizeLinkUrl(raw);
      if (!safe) {
        setEditError(`${svc.label} のURLが正しくありません。https:// から始まるURLを入力してください。`);
        return;
      }
      nextLinks.push({ type: svc.key, url: safe });
    }
    updateText.mutate(
      {
        userId: user.id,
        displayName: nameInput.trim(),
        bio: bioInput.trim(),
        xHandle: normalizeXHandle(xInput),
        handle: handleArg,
        searchableByName,
        role: roleInput,
        links: nextLinks,
      },
      {
        onSuccess: () => setEditing(false),
        onError: (e) => setEditError(friendlyProfileError(e)),
      },
    );
  };

  const handleDeletePost = (id: string, imageUrl: string | null) => {
    if (!user) return;
    deletePost.mutate({ id, authorId: user.id, imageUrl });
  };
  const handleMovePost = (index: number, dir: -1 | 1) => {
    if (!user || !posts) return;
    const target = index + dir;
    if (target < 0 || target >= posts.length) return;
    const ids = posts.map((p) => p.id);
    [ids[index], ids[target]] = [ids[target], ids[index]];
    reorderPosts.mutate({ authorId: user.id, orderedIds: ids });
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
          <ImageSlot radius={0} src={maskIdentity ? undefined : real?.cover_url} />
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
            <ImageSlot circle src={maskIdentity ? undefined : real?.avatar_url} />
          </div>
        </button>
        <input ref={avatarInputRef} type="file" accept="image/*" onChange={(e) => handleFileSelected("avatar_url", e)} style={{ display: "none" }} />
      </div>

      {/* identity */}
      <div style={{ padding: "46px 22px 0" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <h2 style={{ margin: 0, fontSize: 20, fontWeight: 700, color: colors.textPrimary }}>{shownName}</h2>
          {isVerified ? (
            // 本人確認済エンブレム（アップロード画像）。極小だと文字がつぶれるため、
            // プロフィールでは視認できるサイズで表示する。
            // eslint-disable-next-line @next/next/no-img-element
            <img src="/verified-badge.png" alt="本人確認済" width={30} height={30} style={{ display: "block", flex: "0 0 auto" }} />
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
        {/* @ユーザーネーム（一意ID）。設定済みのときだけ表示。未ログインで他人を
            見ているとき（maskIdentity）は個人情報保護のため出さない。 */}
        {!maskIdentity && username && (
          <div style={{ marginTop: 3, fontSize: 12.5, fontWeight: 600, color: colors.textMutedAlt }}>
            @{username}
          </div>
        )}
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

        {/* X（旧Twitter）リンク。未ログインで他人を見ているとき（maskIdentity）は
            個人情報保護のため出さない。 */}
        {!maskIdentity && xHandle && (
          <a
            href={`https://x.com/${xHandle}`}
            target="_blank"
            rel="noopener noreferrer nofollow"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 6,
              marginTop: 12,
              padding: "6px 12px",
              borderRadius: 999,
              border: `1px solid ${colors.borderSoft}`,
              background: colors.white,
              textDecoration: "none",
            }}
          >
            <XIcon size={13} color={colors.textPrimary} />
            <span style={{ fontSize: 12, fontWeight: 700, color: colors.textPrimary }}>@{xHandle}</span>
          </a>
        )}

        {/* 外部リンク（SNS/サイト・0075）。未ログインで他人を見ているときは出さない。 */}
        {!maskIdentity && snsLinks.length > 0 && (
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginTop: 10 }}>
            {snsLinks.map((l) => (
              <a
                key={l.type}
                href={l.url}
                target="_blank"
                rel="noopener noreferrer nofollow"
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 5,
                  padding: "6px 12px",
                  borderRadius: 999,
                  border: `1px solid ${colors.borderSoft}`,
                  background: colors.white,
                  textDecoration: "none",
                  fontSize: 12,
                  fontWeight: 700,
                  color: colors.textPrimary,
                }}
              >
                {SERVICE_BY_KEY.get(l.type)?.label ?? l.type}
                <span style={{ fontSize: 10.5, color: colors.primary }}>↗</span>
              </a>
            ))}
          </div>
        )}

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
        ) : maskIdentity ? (
          <button
            onClick={() => nav("login")}
            style={{
              width: "100%",
              marginTop: 14,
              border: "none",
              background: colors.pink,
              color: colors.white,
              fontFamily: "inherit",
              fontSize: 13,
              fontWeight: 700,
              padding: "12px 0",
              borderRadius: 13,
              cursor: "pointer",
            }}
          >
            登録してフォロー・メッセージ
          </button>
        ) : (
          <div style={{ display: "flex", gap: 9, marginTop: 14 }}>
            <button
              onClick={handleFollow}
              disabled={toggleFollow.isPending}
              aria-pressed={following}
              style={{
                flex: 1,
                border: following ? `1px solid ${colors.border}` : "none",
                background: following ? colors.white : colors.pink,
                color: following ? colors.textSecondary : colors.white,
                fontFamily: "inherit",
                fontSize: 13,
                fontWeight: 700,
                padding: "12px 0",
                borderRadius: 13,
                cursor: toggleFollow.isPending ? "default" : "pointer",
                opacity: toggleFollow.isPending ? 0.6 : 1,
              }}
            >
              {following ? "フォロー中" : "フォローする"}
            </button>
            <button
              onClick={handleMessage}
              disabled={getOrCreateConversation.isPending}
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
                cursor: getOrCreateConversation.isPending ? "default" : "pointer",
                opacity: getOrCreateConversation.isPending ? 0.6 : 1,
              }}
            >
              <MessageIcon size={16} color={colors.white} />
              {getOrCreateConversation.isPending ? "開いています…" : "メッセージ"}
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
              <label style={{ fontSize: 11.5, fontWeight: 700, color: colors.textSecondary }}>ユーザーネーム（ID）</label>
              <div style={{ position: "relative", marginTop: 6 }}>
                <span
                  style={{
                    position: "absolute",
                    left: 13,
                    top: "50%",
                    transform: "translateY(-50%)",
                    fontSize: 13.5,
                    color: colors.textMutedAlt,
                    pointerEvents: "none",
                  }}
                >
                  @
                </span>
                <input
                  value={handleInput}
                  onChange={(e) => setHandleInput(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, "").slice(0, 20))}
                  maxLength={20}
                  placeholder="半角英数と _（3〜20文字）"
                  autoCapitalize="none"
                  autoCorrect="off"
                  spellCheck={false}
                  style={{
                    width: "100%",
                    border: `1px solid ${colors.border}`,
                    borderRadius: 12,
                    padding: "11px 13px 11px 26px",
                    fontSize: 13.5,
                    fontFamily: "inherit",
                    outline: "none",
                    background: colors.white,
                  }}
                />
              </div>
              <p style={{ margin: "5px 2px 0", fontSize: 10.5, color: colors.textMutedSoft, lineHeight: 1.6 }}>
                他の人があなたを検索するときのID（例: @mio_cos）。他の人と重複しない値を設定してください。
              </p>
            </div>
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
            <div>
              <label style={{ fontSize: 11.5, fontWeight: 700, color: colors.textSecondary }}>X（旧Twitter）</label>
              <div style={{ position: "relative", marginTop: 6 }}>
                <span
                  style={{
                    position: "absolute",
                    left: 13,
                    top: "50%",
                    transform: "translateY(-50%)",
                    fontSize: 13.5,
                    color: colors.textMutedAlt,
                    pointerEvents: "none",
                  }}
                >
                  @
                </span>
                <input
                  value={xInput}
                  onChange={(e) => setXInput(e.target.value)}
                  maxLength={120}
                  placeholder="ユーザー名（例: mio_cos）"
                  autoCapitalize="none"
                  autoCorrect="off"
                  spellCheck={false}
                  style={{
                    width: "100%",
                    border: `1px solid ${colors.border}`,
                    borderRadius: 12,
                    padding: "11px 13px 11px 26px",
                    fontSize: 13.5,
                    fontFamily: "inherit",
                    outline: "none",
                    background: colors.white,
                  }}
                />
              </div>
              <p style={{ margin: "5px 2px 0", fontSize: 10.5, color: colors.textMutedSoft, lineHeight: 1.6 }}>
                @付きのユーザー名でもURL（https://x.com/…）の貼り付けでもOKです。空欄にすると非表示になります。
              </p>
            </div>

            {/* 外部リンク（0075）。入力したものだけプロフィールに表示。応援・支援系
                （Fantia等）は年齢確認済みの閲覧者にだけ見える（ゾーニング）。 */}
            <div>
              <label style={{ fontSize: 11.5, fontWeight: 700, color: colors.textSecondary }}>リンク</label>
              <p style={{ margin: "5px 2px 9px", fontSize: 10.5, color: colors.textMutedSoft, lineHeight: 1.6 }}>
                SNSや支援サービスのURLをまとめて置けます。入力したものだけ表示されます。
                <span style={{ color: colors.pink }}>応援・支援系（Fantia等）は年齢確認済みの人にだけ表示</span>されます。
              </p>
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {PROFILE_LINK_SERVICES.map((svc) => (
                  <div key={svc.key} style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <span
                      style={{
                        flex: "0 0 92px",
                        fontSize: 11.5,
                        fontWeight: 600,
                        color: svc.category === "support" ? colors.pink : colors.textSecondary,
                      }}
                    >
                      {svc.label}
                    </span>
                    <input
                      value={linkInputs[svc.key] ?? ""}
                      onChange={(e) => setLinkInputs((prev) => ({ ...prev, [svc.key]: e.target.value }))}
                      maxLength={300}
                      placeholder={svc.placeholder}
                      autoCapitalize="none"
                      autoCorrect="off"
                      spellCheck={false}
                      inputMode="url"
                      style={{
                        flex: 1,
                        minWidth: 0,
                        border: `1px solid ${colors.border}`,
                        borderRadius: 10,
                        padding: "9px 11px",
                        fontSize: 12.5,
                        fontFamily: "inherit",
                        outline: "none",
                        background: colors.white,
                      }}
                    />
                  </div>
                ))}
              </div>
            </div>

            {/* 活動タイプ（役割）。オンボーディングで選んだものを後から変更できる。
                「両方」はレイヤー/カメラマンどちらの検索絞り込みでも見つかる。 */}
            <div>
              <label style={{ fontSize: 11.5, fontWeight: 700, color: colors.textSecondary }}>活動タイプ</label>
              <div style={{ display: "flex", gap: 8, marginTop: 6 }}>
                {ROLE_OPTIONS.map((opt) => {
                  const on = roleInput === opt.key;
                  return (
                    <button
                      key={opt.key}
                      type="button"
                      onClick={() => setRoleInput(opt.key)}
                      style={{
                        flex: 1,
                        border: on ? `2px solid ${colors.primary}` : `1px solid ${colors.border}`,
                        background: on ? colors.primaryBg5 : colors.white,
                        color: on ? colors.primary : colors.textSecondary,
                        fontFamily: "inherit",
                        fontSize: 12,
                        fontWeight: on ? 700 : 500,
                        padding: on ? "9px 0" : "10px 0",
                        borderRadius: 11,
                        cursor: "pointer",
                      }}
                    >
                      {opt.label}
                    </button>
                  );
                })}
              </div>
              <p style={{ margin: "5px 2px 0", fontSize: 10.5, color: colors.textMutedSoft, lineHeight: 1.6 }}>
                コスプレイヤー / カメラマンの検索絞り込みに反映されます。「両方」はどちらでも見つかります。
              </p>
            </div>

            {/* 表示名での検索を許可するか（既定オフ・つきまとい対策）。
                @ユーザーネーム検索は常に可。ここは表示名検索の可否だけ。 */}
            <label style={{ display: "flex", alignItems: "flex-start", gap: 9, cursor: "pointer" }}>
              <input
                type="checkbox"
                checked={searchableByName}
                onChange={(e) => setSearchableByName(e.target.checked)}
                style={{ marginTop: 2, width: 16, height: 16, accentColor: colors.primary, flex: "0 0 auto" }}
              />
              <span style={{ fontSize: 11.5, lineHeight: 1.6, color: colors.textSecondary }}>
                表示名でも検索されるようにする
                <span style={{ display: "block", fontSize: 10.5, color: colors.textMutedSoft, marginTop: 2 }}>
                  オフでも @ユーザーネーム では検索できます。オンにすると表示名（ニックネーム）でも見つかりやすくなります。
                </span>
              </span>
            </label>

            {editError && <div style={{ fontSize: 11.5, color: "#C0453F", lineHeight: 1.6 }}>{editError}</div>}
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

      {/* 応援・支援リンク（0075）。収益化サービスへの外部リンクは、閲覧者が
          年齢確認済みのときだけ表示する（ゾーニング）。他人を未ログインで見て
          いるとき（maskIdentity）は出さない。 */}
      {!maskIdentity && ageVerified && supportProfileLinks.length > 0 && (
        <div style={{ padding: "26px 22px 0" }}>
          <SectionHeading accent={colors.pink} size={15}>
            応援・支援リンク
          </SectionHeading>
          <p style={{ margin: "8px 0 0", fontSize: 10.5, color: colors.textMutedSoft, lineHeight: 1.7 }}>
            外部サービスへのリンクです。サイト内にアダルトコンテンツはありません。
          </p>
          <div style={{ display: "flex", flexDirection: "column", gap: 9, marginTop: 12 }}>
            {supportProfileLinks.map((l) => (
              <a
                key={l.type}
                href={l.url}
                target="_blank"
                rel="noopener noreferrer nofollow"
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
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: colors.textPrimary }}>
                    {SERVICE_BY_KEY.get(l.type)?.label ?? l.type}
                  </div>
                  <div style={{ fontSize: 11, color: colors.textMutedAlt, marginTop: 2, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {l.url.replace(/^https?:\/\//, "")}
                  </div>
                </div>
                <span style={{ fontSize: 11.5, color: colors.primary, fontWeight: 600, whiteSpace: "nowrap", marginLeft: 10 }}>
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

      {/* reviews received — 未ログインには口コミ（他ユーザー名を含む）を出さない */}
      {!maskIdentity && real && reviewsReceived.data && reviewsReceived.data.count > 0 && (
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

      {/* コス活のあゆみ（本人のみ）— 主催・参加した併せのライフログ */}
      {isOwnProfile && (configured ? history.length > 0 : true) && (
        <div style={{ padding: "26px 22px 0" }}>
          <SectionHeading size={15}>コス活のあゆみ</SectionHeading>
          <div style={{ display: "flex", flexDirection: "column", gap: 9, marginTop: 13 }}>
            {(configured
              ? history.slice(0, 8)
              : [
                  { key: "d1", awaseId: "d1", title: "魔法学園シリーズ 生徒会併せ", work: "葬送のフリーレン", date: "7/26(日)", role: "主催" as const, status: "open" as const },
                  { key: "d2", awaseId: "d2", title: "夏祭り浴衣あわせ", work: "ぼっち・ざ・ろっく！", date: "6/14(土)", role: "参加" as const, status: "closed" as const },
                ]
            ).map((h) => {
              // 募集中（open）の併せは詳細ページへ飛べるようにする。
              const clickable = h.status === "open" && Boolean(h.awaseId);
              const rowStyle: React.CSSProperties = {
                display: "flex",
                alignItems: "center",
                gap: 11,
                border: `1px solid ${clickable ? colors.primary : colors.borderSoft}`,
                borderRadius: 14,
                padding: "11px 13px",
                background: colors.white,
                width: "100%",
                textAlign: "left",
                fontFamily: "inherit",
              };
              const inner = (
                <>
                  <span
                    style={{
                      flex: "0 0 auto",
                      fontSize: 10.5,
                      fontWeight: 700,
                      color: h.role === "主催" ? colors.primary : colors.pinkText,
                      background: h.role === "主催" ? colors.primaryBg1 : colors.pinkBg1,
                      padding: "4px 10px",
                      borderRadius: 999,
                    }}
                  >
                    {h.role}
                  </span>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 12.5, fontWeight: 700, color: colors.textPrimary, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {h.title}
                    </div>
                    <div style={{ fontSize: 10.5, color: colors.textMutedAlt, marginTop: 2 }}>
                      {h.work} ・ {h.date}
                    </div>
                  </div>
                  {clickable && (
                    <span style={{ flex: "0 0 auto", display: "flex", alignItems: "center", gap: 4 }}>
                      <span
                        style={{
                          fontSize: 10,
                          fontWeight: 700,
                          color: colors.white,
                          background: colors.primary,
                          padding: "3px 8px",
                          borderRadius: 999,
                        }}
                      >
                        募集中
                      </span>
                      <ChevronRightIcon />
                    </span>
                  )}
                </>
              );
              return clickable ? (
                <button key={h.key} onClick={() => openAwase(h.awaseId)} style={{ ...rowStyle, cursor: "pointer" }}>
                  {inner}
                </button>
              ) : (
                <div key={h.key} style={rowStyle}>
                  {inner}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* 次の出演イベント（0076）。本人が「出演します」と公開宣言したもの。
          本人・他人どちらのプロフィールにも出す（ファンに「次どこで会えるか」を
          伝えるリアル導線）。未ログインで他人を見ているときは出さない。 */}
      {!maskIdentity && appearances.length > 0 && (
        <div style={{ padding: "26px 22px 0" }}>
          <SectionHeading accent={colors.pink} size={15}>次に会えるイベント</SectionHeading>
          {isOwnProfile && (
            <p style={{ margin: "7px 0 0", fontSize: 10.5, color: colors.textMutedSoft, lineHeight: 1.6 }}>
              プロフィールに公開され、フォロワーにも通知されます。イベント詳細から掲示/取り消しできます。
            </p>
          )}
          <div style={{ display: "flex", flexDirection: "column", gap: 9, marginTop: 13 }}>
            {appearances.slice(0, 6).map((ev) => (
              <button
                key={ev.id}
                onClick={() => configured && openEvent(ev.id)}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 11,
                  border: `1px solid ${colors.pinkAlt}`,
                  borderRadius: 14,
                  padding: "10px 12px",
                  background: colors.white,
                  width: "100%",
                  textAlign: "left",
                  fontFamily: "inherit",
                  cursor: configured ? "pointer" : "default",
                }}
              >
                <div style={{ flex: "0 0 44px", width: 44, height: 44, borderRadius: 11, overflow: "hidden" }}>
                  <WorkCover name={ev.name} radius={11} showName={false} />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 12.5, fontWeight: 700, color: colors.textPrimary, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {ev.name}
                  </div>
                  <div style={{ fontSize: 10.5, color: colors.textMutedAlt, marginTop: 2, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {ev.date}
                    {ev.region ? ` ・ ${ev.region}` : ""}
                    {ev.note ? ` ・ ${ev.note}` : ""}
                  </div>
                </div>
                <ChevronRightIcon />
              </button>
            ))}
          </div>
        </div>
      )}

      {/* 参加予定のイベント（本人のマイページのみ）。参加表明したイベントのうち、
          これから開催のものを近い順に表示。タップでイベント詳細へ。 */}
      {isOwnProfile && myEvents.length > 0 && (
        <div style={{ padding: "26px 22px 0" }}>
          <SectionHeading size={15}>参加予定のイベント</SectionHeading>
          <div style={{ display: "flex", flexDirection: "column", gap: 9, marginTop: 13 }}>
            {myEvents.slice(0, 6).map((ev) => (
              <button
                key={ev.id}
                onClick={() => openEvent(ev.id)}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 11,
                  border: `1px solid ${colors.borderSoft}`,
                  borderRadius: 14,
                  padding: "10px 12px",
                  background: colors.white,
                  width: "100%",
                  textAlign: "left",
                  fontFamily: "inherit",
                  cursor: "pointer",
                }}
              >
                <div style={{ flex: "0 0 44px", width: 44, height: 44, borderRadius: 11, overflow: "hidden" }}>
                  {ev.imageUrl ? <ImageSlot radius={11} src={ev.imageUrl} /> : <WorkCover name={ev.name} radius={11} showName={false} />}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 12.5, fontWeight: 700, color: colors.textPrimary, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {ev.name}
                  </div>
                  <div style={{ fontSize: 10.5, color: colors.textMutedAlt, marginTop: 2, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {ev.date} ・ {ev.venue}
                  </div>
                </div>
                <ChevronRightIcon />
              </button>
            ))}
          </div>
        </div>
      )}

      {/* gallery */}
      <div style={{ padding: "26px 22px 30px" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <SectionHeading size={15}>ギャラリー</SectionHeading>
          {canEdit && posts && posts.length > 0 && (
            <button
              onClick={() => setGalleryEditing((v) => !v)}
              style={{ border: "none", background: "none", padding: 0, color: colors.primary, fontFamily: "inherit", fontSize: 12.5, fontWeight: 700, cursor: "pointer" }}
            >
              {galleryEditing ? "完了" : "編集"}
            </button>
          )}
        </div>
        {galleryEditing && (
          <p style={{ margin: "8px 0 0", fontSize: 11, color: colors.textMutedAlt, lineHeight: 1.6 }}>
            ← → で並び替え、× で削除。左上のボタンで公開範囲（🌐 全体公開 / 🔒 併せ仲間のみ）を切り替えられます。
          </p>
        )}
        {maskIdentity ? (
          <button
            onClick={() => nav("login")}
            style={{
              width: "100%",
              marginTop: 13,
              padding: "26px 0",
              borderRadius: 14,
              border: `1.5px dashed ${colors.border}`,
              background: colors.primaryBg5,
              color: colors.textSecondary,
              fontFamily: "inherit",
              fontSize: 13,
              fontWeight: 700,
              cursor: "pointer",
            }}
          >
            🔒 登録して写真を見る
          </button>
        ) : (
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
              {canEdit && !galleryEditing && (
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
              {posts.map((p, i) => (
                <div key={p.id}>
                <div style={{ position: "relative", height: 108 }}>
                  {galleryEditing ? (
                    <>
                      <ImageSlot radius={12} src={p.image_url} />
                      <button
                        onClick={() =>
                          user &&
                          updateVisibility.mutate({
                            id: p.id,
                            authorId: user.id,
                            visibility: p.visibility === "awase" ? "public" : "awase",
                          })
                        }
                        aria-label={p.visibility === "awase" ? "併せ仲間のみ（タップで全体公開へ）" : "全体公開（タップで併せ仲間のみへ）"}
                        style={{
                          position: "absolute",
                          left: 4,
                          top: 4,
                          height: 27,
                          borderRadius: 999,
                          border: "none",
                          background: "rgba(30,20,40,.65)",
                          color: colors.white,
                          fontSize: 11,
                          lineHeight: 1,
                          cursor: "pointer",
                          padding: "0 9px",
                          display: "flex",
                          alignItems: "center",
                        }}
                      >
                        {p.visibility === "awase" ? "🔒" : "🌐"}
                      </button>
                      <button
                        onClick={() => handleDeletePost(p.id, p.image_url)}
                        aria-label="削除"
                        style={{
                          position: "absolute",
                          right: 4,
                          top: 4,
                          width: 27,
                          height: 27,
                          borderRadius: "50%",
                          border: "none",
                          background: "rgba(30,20,40,.65)",
                          color: colors.white,
                          fontSize: 15,
                          lineHeight: 1,
                          cursor: "pointer",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                        }}
                      >
                        ×
                      </button>
                      <div style={{ position: "absolute", left: 4, right: 4, bottom: 4, display: "flex", justifyContent: "space-between" }}>
                        <button
                          onClick={() => handleMovePost(i, -1)}
                          disabled={i === 0}
                          aria-label="左へ"
                          style={moveBtnStyle(i === 0)}
                        >
                          ←
                        </button>
                        <button
                          onClick={() => handleMovePost(i, 1)}
                          disabled={i === posts.length - 1}
                          aria-label="右へ"
                          style={moveBtnStyle(i === posts.length - 1)}
                        >
                          →
                        </button>
                      </div>
                    </>
                  ) : (
                    <>
                      <button
                        onClick={() => p.image_url && setLightboxIndex(i)}
                        aria-label="拡大表示"
                        style={{ width: "100%", height: "100%", padding: 0, border: "none", background: "none", borderRadius: 12, overflow: "hidden", cursor: "pointer" }}
                      >
                        <ImageSlot radius={12} src={p.image_url} />
                      </button>
                      {canEdit && p.visibility === "awase" && (
                        <span
                          aria-label="併せ仲間のみ公開"
                          style={{ position: "absolute", left: 4, top: 4, fontSize: 11, background: "rgba(30,20,40,.65)", color: colors.white, borderRadius: 999, padding: "3px 7px", lineHeight: 1 }}
                        >
                          🔒
                        </span>
                      )}
                      {/* 閲覧数・いいね数（本人にだけ表示。0022の閲覧数と同じ方針で他人には見せない） */}
                      {canEdit && (
                        <span
                          aria-label={`閲覧数 ${p.view_count ?? 0}回・いいね ${p.like_count ?? 0}件（あなたにだけ表示）`}
                          style={{ position: "absolute", right: 4, bottom: 4, fontSize: 10, fontWeight: 600, background: "rgba(30,20,40,.65)", color: colors.white, borderRadius: 999, padding: "3px 7px", lineHeight: 1, display: "flex", alignItems: "center", gap: 5 }}
                        >
                          <span>👁 {p.view_count ?? 0}</span>
                          <span style={{ display: "inline-flex", alignItems: "center", gap: 2 }}>
                            <HeartIcon size={10} color={colors.pink} /> {p.like_count ?? 0}
                          </span>
                        </span>
                      )}
                    </>
                  )}
                </div>
                {galleryEditing && (
                  <select
                    value={p.work_id ?? ""}
                    onChange={(e) =>
                      user && updateWork.mutate({ id: p.id, authorId: user.id, workId: e.target.value || null })
                    }
                    aria-label="作品・キャラタグ"
                    style={{
                      width: "100%",
                      marginTop: 4,
                      fontSize: 10.5,
                      padding: "3px 4px",
                      borderRadius: 6,
                      border: `1px solid ${colors.border}`,
                      background: colors.white,
                      color: colors.textSecondary,
                      fontFamily: "inherit",
                    }}
                  >
                    <option value="">作品タグなし</option>
                    {works.map((w) => (
                      <option key={w.id} value={w.id}>
                        {w.name}
                      </option>
                    ))}
                  </select>
                )}
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
        )}
        <input ref={postInputRef} type="file" accept="image/*" onChange={handleAddPost} style={{ display: "none" }} />

        {/* report — only meaningful for another user's profile */}
        <button
          onClick={() =>
            signedOut
              ? nav("login")
              : real && targetId && !isOwnProfile
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

      {/* lightbox: tap a gallery thumbnail to view it large */}
      {lightboxUrl && lightboxIndex !== null && (
        <div
          onClick={() => setLightboxIndex(null)}
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 100,
            background: "rgba(20,14,28,.92)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: 20,
          }}
        >
          <button
            onClick={() => setLightboxIndex(null)}
            aria-label="閉じる"
            style={{
              position: "absolute",
              right: 16,
              top: 16,
              width: 44,
              height: 44,
              borderRadius: "50%",
              border: "none",
              background: "rgba(255,255,255,.16)",
              color: colors.white,
              fontSize: 20,
              lineHeight: 1,
              cursor: "pointer",
            }}
          >
            ×
          </button>
          {lightboxIndex > 0 && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                setLightboxIndex((i) => (i !== null ? i - 1 : i));
              }}
              aria-label="前の写真"
              style={{
                position: "absolute",
                left: 6,
                top: "50%",
                transform: "translateY(-50%)",
                width: 44,
                height: 44,
                borderRadius: "50%",
                border: "none",
                background: "rgba(255,255,255,.16)",
                color: colors.white,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                cursor: "pointer",
              }}
            >
              <ChevronLeftIcon color={colors.white} />
            </button>
          )}
          {posts && lightboxIndex < posts.length - 1 && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                setLightboxIndex((i) => (i !== null ? i + 1 : i));
              }}
              aria-label="次の写真"
              style={{
                position: "absolute",
                right: 6,
                top: "50%",
                transform: "translateY(-50%)",
                width: 44,
                height: 44,
                borderRadius: "50%",
                border: "none",
                background: "rgba(255,255,255,.16)",
                color: colors.white,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                cursor: "pointer",
              }}
            >
              <ChevronRightIcon color={colors.white} />
            </button>
          )}
          <div style={{ position: "relative", maxWidth: "100%", maxHeight: "100%" }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              className="pt-lightbox-img"
              src={lightboxUrl}
              alt=""
              onClick={(e) => e.stopPropagation()}
              onDoubleClick={(e) => {
                e.stopPropagation();
                handleLightboxDoubleClick();
              }}
              // 高さ制約は .pt-lightbox-img（globals.css）で行う。モバイルは従来どおり
              // （親に収まる）。PC（≥641px）はライトボックスが画面全体を覆い縦長画像が
              // 見切れるため 82vh で全体表示＋上下に余白を確保する。
              style={{ display: "block", maxWidth: "100%", borderRadius: 12, objectFit: "contain" }}
            />
            {heartBurst > 0 && (
              <div
                key={heartBurst}
                className="pt-heart-burst"
                style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", pointerEvents: "none" }}
              >
                <HeartIcon size={92} color={colors.white} />
              </div>
            )}
          </div>

          {/* いいね: 他の人はボタンで付けられる。数字は本人には常時、他の人には5件を
              超えたら公開（0を目立たせない方針）。自分の投稿には付けられない。 */}
          {(() => {
            const p = posts?.[lightboxIndex];
            if (!p) return null;
            const liked = likedSet.has(p.id);
            const canLike = Boolean(user) && !canEdit;
            const showCount = canEdit || (p.like_count ?? 0) > 5;
            if (!canLike && !showCount) return null;
            const pill: CSSProperties = {
              display: "inline-flex",
              alignItems: "center",
              gap: 8,
              background: "rgba(255,255,255,.16)",
              borderRadius: 999,
              padding: "10px 18px",
              color: colors.white,
              fontSize: 14,
              fontWeight: 700,
            };
            return (
              <div
                onClick={(e) => e.stopPropagation()}
                style={{ position: "absolute", left: 0, right: 0, bottom: 24, display: "flex", justifyContent: "center" }}
              >
                {canLike ? (
                  <button
                    onClick={() => handleToggleLike(p)}
                    disabled={toggleLike.isPending}
                    aria-label={liked ? "いいねを取り消す" : "いいね"}
                    style={{ ...pill, border: "none", cursor: "pointer", fontFamily: "inherit" }}
                  >
                    <HeartIcon size={20} color={liked ? colors.pink : colors.white} />
                    {showCount && <span>{p.like_count ?? 0}</span>}
                  </button>
                ) : (
                  <span style={pill} aria-label={`いいね ${p.like_count ?? 0}件`}>
                    <HeartIcon size={18} color={colors.pink} /> {p.like_count ?? 0}
                  </span>
                )}
              </div>
            );
          })()}
        </div>
      )}
    </div>
  );
}
