"use client";

import { useState } from "react";
import { colors } from "@/lib/tokens";
import { useRouter } from "../AppRouter";
import { ImageSlot } from "../ImageSlot";
import { AppBar, PrimaryButton, SectionHeading } from "../ui";
import { UsersIcon, PinIcon } from "../icons";
import { useToast } from "../Toast";
import { useAuth } from "@/lib/auth/useAuth";
import {
  useGroup,
  useGroupMembers,
  useIsGroupMember,
  useJoinGroup,
  useLeaveGroup,
  useGroupPosts,
  useCreateGroupPost,
  useDeleteGroupPost,
  friendlyGroupPostError,
} from "@/lib/queries/groups";
import { useModerationFilter } from "@/lib/queries/moderation";
import { isSupabaseConfigured } from "@/lib/supabase/config";

export function GroupDetailScreen() {
  const { back, nav, openProfile, selectedGroupId } = useRouter();
  const { user } = useAuth();
  const { showToast } = useToast();
  const configured = isSupabaseConfigured();

  const groupQuery = useGroup(selectedGroupId);
  const moderation = useModerationFilter(user?.id);
  const membersQuery = useGroupMembers(selectedGroupId, user?.id, moderation.data?.blockedUserIds ?? []);
  const isMemberQuery = useIsGroupMember(selectedGroupId, user?.id);
  const joinGroup = useJoinGroup();
  const leaveGroup = useLeaveGroup();

  const real = configured && selectedGroupId ? groupQuery.data : undefined;
  const loading = configured && Boolean(selectedGroupId) && groupQuery.isPending && !groupQuery.data;
  const members = membersQuery.data ?? [];

  const name = real?.name ?? "関西プリキュアレイヤー会";
  const description = real?.description || "関西でプリキュア併せを定期開催しています。初心者歓迎！";
  const work = real ? real.work : "プリキュア";
  const region = real ? real.region : "大阪";
  const memberCount = real ? real.memberCount : 42;
  const isOwner = Boolean(real && user && real.ownerId === user.id);
  const isMember = real ? Boolean(isMemberQuery.data) : false;
  const canPost = isMember || isOwner;

  // グループ掲示板（0074）。投稿・削除はメンバー本人／オーナーのみ（RLSで強制）。
  const postsQuery = useGroupPosts(selectedGroupId, moderation.data?.blockedUserIds ?? []);
  const posts = postsQuery.data ?? [];
  const createPost = useCreateGroupPost();
  const deletePost = useDeleteGroupPost();
  const [postBody, setPostBody] = useState("");

  const handlePost = () => {
    const body = postBody.trim();
    if (!body || !user || !selectedGroupId || createPost.isPending) return;
    createPost.mutate(
      { groupId: selectedGroupId, authorId: user.id, body },
      { onSuccess: () => setPostBody(""), onError: (e) => showToast(friendlyGroupPostError(e)) },
    );
  };

  const handleDeletePost = (postId: string) => {
    if (!selectedGroupId) return;
    deletePost.mutate(
      { postId, groupId: selectedGroupId },
      { onError: () => showToast("削除できませんでした。もう一度お試しください。") },
    );
  };

  const handleJoin = () => {
    if (configured && !user) {
      nav("login");
      return;
    }
    if (real && user && selectedGroupId) {
      joinGroup.mutate(
        { groupId: selectedGroupId, userId: user.id },
        { onError: () => showToast("参加に失敗しました。もう一度お試しください。") },
      );
    }
  };

  const handleLeave = () => {
    if (real && user && selectedGroupId) {
      if (leaveGroup.isPending) return;
      leaveGroup.mutate(
        { groupId: selectedGroupId, userId: user.id },
        { onError: () => showToast("退会に失敗しました。もう一度お試しください。") },
      );
    }
  };

  if (loading) {
    return (
      <div>
        <AppBar title="サークル" onBack={back} />
        <div style={{ padding: "60px 22px", textAlign: "center", fontSize: 13, color: colors.textMutedAlt }}>読み込み中…</div>
      </div>
    );
  }

  return (
    <div>
      <AppBar title="サークル" onBack={back} />

      <div style={{ padding: "18px 22px 0", display: "flex", alignItems: "center", gap: 14 }}>
        <div
          style={{
            flex: "0 0 60px",
            width: 60,
            height: 60,
            borderRadius: 18,
            background: colors.primaryBg5,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <UsersIcon size={30} color={colors.primary} />
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <h2 style={{ margin: 0, fontSize: 19, fontWeight: 700, color: colors.textPrimary }}>{name}</h2>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginTop: 6, flexWrap: "wrap" }}>
            {work && <span style={{ fontSize: 11.5, color: colors.primary, fontWeight: 600 }}>{work}</span>}
            {region && (
              <span style={{ display: "inline-flex", alignItems: "center", gap: 2, fontSize: 11.5, color: colors.textMutedAlt }}>
                <PinIcon size={11} /> {region}
              </span>
            )}
            <span style={{ fontSize: 11.5, color: colors.textMutedAlt }}>{memberCount}人が参加</span>
          </div>
        </div>
      </div>

      {description && (
        <div style={{ padding: "18px 22px 0" }}>
          <p style={{ margin: 0, fontSize: 13, lineHeight: 1.9, color: colors.textSecondary, whiteSpace: "pre-wrap" }}>{description}</p>
        </div>
      )}

      {/* 参加/退会 */}
      <div style={{ padding: "20px 22px 0" }}>
        {isOwner ? (
          <div
            style={{
              border: `1px solid ${colors.borderSoft}`,
              borderRadius: 14,
              padding: "13px 15px",
              background: colors.primaryBg5,
              textAlign: "center",
              fontSize: 12.5,
              fontWeight: 700,
              color: colors.primary,
            }}
          >
            あなたが管理するサークルです
          </div>
        ) : isMember ? (
          <div style={{ textAlign: "center" }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: colors.textPrimary }}>参加中のサークルです</div>
            <button
              onClick={handleLeave}
              style={{ marginTop: 8, border: "none", background: "none", color: colors.textMutedAlt, fontFamily: "inherit", fontSize: 12, padding: 6, cursor: "pointer", textDecoration: "underline" }}
            >
              サークルを退会する
            </button>
          </div>
        ) : (
          <PrimaryButton onClick={handleJoin}>このサークルに参加する</PrimaryButton>
        )}
      </div>

      {/* メンバー */}
      <div style={{ padding: "26px 22px 30px" }}>
        <SectionHeading size={15}>メンバー</SectionHeading>
        {!configured ? (
          <div style={{ display: "flex", gap: 10, marginTop: 13 }}>
            {[0, 1, 2, 3, 4].map((i) => (
              <div key={i} style={{ width: 46, height: 46, borderRadius: "50%", overflow: "hidden", flex: "0 0 auto" }}>
                <ImageSlot circle />
              </div>
            ))}
          </div>
        ) : !user ? (
          <div style={{ marginTop: 12, border: `1px dashed ${colors.border}`, borderRadius: 14, padding: "16px 14px", background: colors.primaryBg5, textAlign: "center" }}>
            <p style={{ margin: 0, fontSize: 12.5, color: colors.textSecondary, lineHeight: 1.8 }}>
              メンバーの顔ぶれは、ログインすると見られます。
              <br />
              <span style={{ fontSize: 11, color: colors.textMutedSoft }}>※ 非公開アカウントの人は表示されません。</span>
            </p>
            <button
              onClick={() => nav("login")}
              style={{ marginTop: 12, border: "none", background: colors.primary, color: colors.white, fontFamily: "inherit", fontSize: 12.5, fontWeight: 700, padding: "10px 22px", borderRadius: 12, cursor: "pointer" }}
            >
              ログイン / 登録
            </button>
          </div>
        ) : members.length === 0 ? (
          <p style={{ margin: "12px 0 0", fontSize: 12.5, color: colors.textMutedAlt, lineHeight: 1.8 }}>まだメンバーがいません。</p>
        ) : (
          <div className="noscroll" style={{ display: "flex", gap: 14, overflowX: "auto", padding: "13px 2px 2px" }}>
            {members.map((m) => (
              <button
                key={m.id}
                onClick={() => openProfile(m.id)}
                style={{ flex: "0 0 auto", width: 58, border: "none", background: "none", padding: 0, cursor: "pointer", fontFamily: "inherit", display: "flex", flexDirection: "column", alignItems: "center", gap: 5 }}
              >
                <div style={{ position: "relative", width: 46, height: 46 }}>
                  <div style={{ width: 46, height: 46, borderRadius: "50%", overflow: "hidden" }}>
                    <ImageSlot circle src={m.avatarUrl ?? undefined} />
                  </div>
                  {m.role === "owner" && (
                    <span
                      style={{
                        position: "absolute",
                        left: "50%",
                        transform: "translateX(-50%)",
                        bottom: -6,
                        fontSize: 8.5,
                        fontWeight: 700,
                        color: colors.white,
                        background: colors.primary,
                        padding: "1px 6px",
                        borderRadius: 999,
                        whiteSpace: "nowrap",
                      }}
                    >
                      主
                    </span>
                  )}
                  {m.isVerified && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src="/verified-badge.png" alt="本人確認済" width={15} height={15} style={{ position: "absolute", right: -2, bottom: -2, display: "block" }} />
                  )}
                </div>
                <span style={{ fontSize: 10.5, color: colors.textSecondary, maxWidth: 58, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", textAlign: "center" }}>
                  {m.displayName}
                </span>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* 掲示板（0074・グループV2）。メンバーだけが投稿でき、削除は本人／オーナー。 */}
      <div style={{ padding: "0 22px 40px" }}>
        <SectionHeading size={15}>掲示板</SectionHeading>

        {!configured ? (
          <p style={{ margin: "12px 0 0", fontSize: 12.5, color: colors.textMutedAlt, lineHeight: 1.8 }}>
            サークルに参加すると、メンバー同士で連絡や告知ができる掲示板が使えます。
          </p>
        ) : (
          <>
            {canPost ? (
              <div style={{ marginTop: 13 }}>
                <textarea
                  value={postBody}
                  onChange={(e) => setPostBody(e.target.value)}
                  maxLength={500}
                  rows={3}
                  placeholder="メンバーへの連絡や告知を書く…"
                  style={{
                    width: "100%",
                    boxSizing: "border-box",
                    border: `1px solid ${colors.border}`,
                    borderRadius: 12,
                    padding: "11px 13px",
                    fontSize: 13,
                    lineHeight: 1.7,
                    fontFamily: "inherit",
                    color: colors.textPrimary,
                    resize: "vertical",
                    background: colors.white,
                  }}
                />
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: 8 }}>
                  <span style={{ fontSize: 11, color: colors.textMutedSoft }}>{postBody.length}/500</span>
                  <button
                    onClick={handlePost}
                    disabled={!postBody.trim() || createPost.isPending}
                    style={{
                      border: "none",
                      borderRadius: 12,
                      padding: "9px 22px",
                      fontFamily: "inherit",
                      fontSize: 12.5,
                      fontWeight: 700,
                      color: colors.white,
                      background: !postBody.trim() || createPost.isPending ? colors.border : colors.primary,
                      cursor: !postBody.trim() || createPost.isPending ? "default" : "pointer",
                    }}
                  >
                    投稿する
                  </button>
                </div>
              </div>
            ) : !user ? (
              <p style={{ margin: "12px 0 0", fontSize: 12.5, color: colors.textMutedAlt, lineHeight: 1.8 }}>
                投稿はログイン後、サークルに参加すると行えます。
              </p>
            ) : (
              <p style={{ margin: "12px 0 0", fontSize: 12.5, color: colors.textMutedAlt, lineHeight: 1.8 }}>
                このサークルに参加すると投稿できます。
              </p>
            )}

            <div style={{ marginTop: 18 }}>
              {postsQuery.isPending && postsQuery.fetchStatus === "fetching" ? (
                <p style={{ margin: 0, fontSize: 12.5, color: colors.textMutedAlt }}>読み込み中…</p>
              ) : posts.length === 0 ? (
                <p style={{ margin: 0, fontSize: 12.5, color: colors.textMutedAlt, lineHeight: 1.8 }}>まだ投稿がありません。</p>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                  {posts.map((p) => (
                    <div key={p.key} style={{ display: "flex", gap: 11 }}>
                      <button
                        onClick={() => openProfile(p.authorId)}
                        style={{ flex: "0 0 auto", width: 38, height: 38, border: "none", background: "none", padding: 0, cursor: "pointer", borderRadius: "50%", overflow: "hidden" }}
                      >
                        <ImageSlot circle src={p.authorAvatarUrl ?? undefined} />
                      </button>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: "flex", alignItems: "baseline", gap: 8 }}>
                          <button
                            onClick={() => openProfile(p.authorId)}
                            style={{ border: "none", background: "none", padding: 0, cursor: "pointer", fontFamily: "inherit", fontSize: 12.5, fontWeight: 700, color: colors.textPrimary, maxWidth: "60%", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}
                          >
                            {p.authorName}
                          </button>
                          <span style={{ fontSize: 11, color: colors.textMutedSoft }}>{p.time}</span>
                          {(p.authorId === user?.id || isOwner) && (
                            <button
                              onClick={() => handleDeletePost(p.key)}
                              style={{ marginLeft: "auto", border: "none", background: "none", padding: "0 2px", cursor: "pointer", fontFamily: "inherit", fontSize: 11, color: colors.textMutedAlt }}
                            >
                              削除
                            </button>
                          )}
                        </div>
                        <p style={{ margin: "4px 0 0", fontSize: 13, lineHeight: 1.8, color: colors.textSecondary, whiteSpace: "pre-wrap", wordBreak: "break-word" }}>
                          {p.body}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
