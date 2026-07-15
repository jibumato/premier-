"use client";

import { useState } from "react";
import { colors } from "@/lib/tokens";
import { mockLoungePosts } from "@/lib/data";
import { useRouter } from "../AppRouter";
import { AppBar } from "../ui";
import { useAuth } from "@/lib/auth/useAuth";
import { useProfile } from "@/lib/queries/profile";
import { useModerationFilter } from "@/lib/queries/moderation";
import {
  friendlyLoungeError,
  useAdminDeleteLoungePost,
  useCreateLoungePost,
  useDeleteLoungePost,
  useLoungePosts,
} from "@/lib/queries/lounge";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { EmptyState } from "../EmptyState";

const MAX_LEN = 300;

export function LoungeScreen() {
  const { back, openReport } = useRouter();
  const { user } = useAuth();
  const configured = isSupabaseConfigured();
  const profile = useProfile(user?.id);
  const isAdmin = Boolean(configured && profile.data?.is_admin);

  const moderation = useModerationFilter(user?.id);
  const postsQuery = useLoungePosts(moderation.data);
  const createPost = useCreateLoungePost();
  const deletePost = useDeleteLoungePost();
  const adminDeletePost = useAdminDeleteLoungePost();

  const [body, setBody] = useState("");
  const [error, setError] = useState<string | null>(null);

  const real = configured ? postsQuery.data : undefined;
  const posts = configured ? (postsQuery.data ?? []) : mockLoungePosts;
  const loading = configured && postsQuery.isPending && !postsQuery.data;
  const isEmpty = Boolean(real) && posts.length === 0;

  const handleSubmit = () => {
    if (!user || !body.trim()) return;
    setError(null);
    createPost.mutate(
      { authorId: user.id, body: body.trim() },
      {
        onSuccess: () => setBody(""),
        onError: (e) => setError(friendlyLoungeError(e)),
      },
    );
  };

  const handleDelete = (postId: string) => {
    deletePost.mutate({ postId });
  };

  const handleAdminDelete = (postId: string) => {
    adminDeletePost.mutate({ postId });
  };

  return (
    <div>
      <AppBar title="談話室" onBack={back} />

      <div style={{ padding: "10px 22px 0" }}>
        <p style={{ margin: 0, fontSize: 12, color: colors.textMutedAlt, lineHeight: 1.8 }}>
          誰でも気軽に投稿できる交流の場です。リンクの投稿や誹謗中傷は自動的にブロックされます。困ったときは投稿を通報してください。
        </p>
      </div>

      <div style={{ padding: "14px 22px 0" }}>
        <div
          style={{
            border: `1px solid ${colors.borderSoft}`,
            borderRadius: 16,
            padding: 14,
            background: colors.primaryBg5,
            display: "flex",
            flexDirection: "column",
            gap: 8,
          }}
        >
          <textarea
            value={body}
            onChange={(e) => setBody(e.target.value.slice(0, MAX_LEN))}
            placeholder={configured ? "いま思っていることを書いてみましょう" : "プレビュー環境（未接続）では投稿できません。"}
            disabled={!configured}
            rows={3}
            style={{
              border: `1px solid ${colors.border}`,
              borderRadius: 12,
              padding: "10px 13px",
              fontSize: 13,
              fontFamily: "inherit",
              lineHeight: 1.7,
              resize: "none",
              outline: "none",
              background: configured ? colors.white : colors.primaryBg1,
              color: colors.textPrimary,
            }}
          />
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <span style={{ fontSize: 10.5, color: colors.textMutedAlt }}>
              {body.length}/{MAX_LEN}
            </span>
            <button
              onClick={handleSubmit}
              disabled={!configured || !user || !body.trim() || createPost.isPending}
              style={{
                border: "none",
                background: colors.primary,
                color: colors.white,
                fontFamily: "inherit",
                fontSize: 12.5,
                fontWeight: 700,
                padding: "9px 18px",
                borderRadius: 999,
                cursor: "pointer",
                opacity: configured && user && body.trim() && !createPost.isPending ? 1 : 0.5,
              }}
            >
              {createPost.isPending ? "投稿中…" : "投稿する"}
            </button>
          </div>
          {error && <p style={{ margin: 0, fontSize: 11.5, color: "#B23543" }}>{error}</p>}
        </div>
      </div>

      {isEmpty && (
        <EmptyState icon="💬" title="まだ投稿がありません" body="最初のひとことを投稿してみましょう。" />
      )}

      <div style={{ padding: "16px 22px 30px", display: "flex", flexDirection: "column", gap: 10 }}>
        {loading && (
          <div style={{ padding: "60px 22px", textAlign: "center", fontSize: 13, color: colors.textMutedAlt }}>読み込み中…</div>
        )}
        {posts.map((p) => {
          const isMine = Boolean(user && p.authorId === user.id);
          return (
            <div
              key={p.key}
              style={{
                border: `1px solid ${colors.borderSoft}`,
                borderRadius: 16,
                padding: 14,
                background: colors.white,
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <div
                  style={{
                    width: 28,
                    height: 28,
                    borderRadius: "50%",
                    background: colors.primaryBg1,
                    flex: "0 0 auto",
                    overflow: "hidden",
                  }}
                >
                  {p.authorAvatarUrl && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={p.authorAvatarUrl} alt="" width={28} height={28} style={{ objectFit: "cover", width: "100%", height: "100%" }} />
                  )}
                </div>
                <span style={{ fontSize: 12.5, fontWeight: 700, color: colors.textPrimary }}>{p.authorName}</span>
                <span style={{ fontSize: 10.5, color: colors.textMutedAlt }}>{p.time}</span>
              </div>
              <p style={{ margin: "8px 0 0", fontSize: 13, color: colors.textPrimary, lineHeight: 1.75, whiteSpace: "pre-wrap" }}>
                {p.body}
              </p>
              <div style={{ display: "flex", gap: 8, marginTop: 10 }}>
                {isMine && real && (
                  <button
                    onClick={() => handleDelete(p.key)}
                    style={{
                      border: `1px solid ${colors.border}`,
                      background: colors.white,
                      color: colors.textSecondaryAlt,
                      borderRadius: 999,
                      padding: "5px 12px",
                      fontSize: 11,
                      fontWeight: 600,
                      cursor: "pointer",
                      fontFamily: "inherit",
                    }}
                  >
                    削除
                  </button>
                )}
                {!isMine && (
                  <button
                    onClick={() => openReport({ type: "lounge", id: p.key, userId: p.authorId })}
                    style={{
                      border: `1px solid ${colors.border}`,
                      background: colors.white,
                      color: colors.textSecondaryAlt,
                      borderRadius: 999,
                      padding: "5px 12px",
                      fontSize: 11,
                      fontWeight: 600,
                      cursor: "pointer",
                      fontFamily: "inherit",
                    }}
                  >
                    通報
                  </button>
                )}
                {isAdmin && real && !isMine && (
                  <button
                    onClick={() => handleAdminDelete(p.key)}
                    style={{
                      border: "1px solid #E1B4BA",
                      background: "#FBEBED",
                      color: "#B23543",
                      borderRadius: 999,
                      padding: "5px 12px",
                      fontSize: 11,
                      fontWeight: 600,
                      cursor: "pointer",
                      fontFamily: "inherit",
                      marginLeft: "auto",
                    }}
                  >
                    運営削除
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
