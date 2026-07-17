"use client";

import { useEffect, useState, type CSSProperties } from "react";
import { colors } from "@/lib/tokens";
import { popularWorks, regions, searchResults, homePosts } from "@/lib/data";
import { useRouter } from "../AppRouter";
import { AwaseCover } from "../AwaseCover";
import { ImageSlot } from "../ImageSlot";
import { ChevronLeftIcon, ChevronRightIcon, PinIcon, SearchIcon } from "../icons";
import { AwaseCardSkeleton, Skeleton } from "../Skeleton";
import { SlotBadge } from "../SlotBadge";
import { useAwaseSearch } from "@/lib/queries/awase";
import { useUserSearch } from "@/lib/queries/profile";
import { usePostsFeed, type FeedPost } from "@/lib/queries/posts";
import { useFollowedWorks, useWorks } from "@/lib/queries/works";
import { useModerationFilter } from "@/lib/queries/moderation";
import { useAuth } from "@/lib/auth/useAuth";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { readingMatch } from "@/lib/reading";

type SearchTab = "awase" | "people" | "photos";

export function SearchScreen() {
  const { back, nav, openAwase, openProfile, region, setRegion, searchKeyword, searchInitialTab, searchState, setSearchState } =
    useRouter();
  const { user } = useAuth();
  const configured = isSupabaseConfigured();
  // 作品チップ等から渡された初期キーワード（openSearch）があればそれを、無ければ
  // 前回の検索状態（searchState、ルーターが持つ）を初期値にする。画面はナビごとに
  // マウントし直されるため、初期値としての useState で十分——ただし「戻る」で
  // 条件が消えないよう、変更は searchState に書き戻す（下の useEffect）。
  const [keyword, setKeyword] = useState(searchKeyword || searchState.keyword);
  const [womenOnly, setWomenOnly] = useState(searchState.womenOnly);
  const [tab, setTab] = useState<SearchTab>(searchInitialTab ?? searchState.tab);
  const [photoWorkFilter, setPhotoWorkFilter] = useState(searchState.photoWorkFilter);

  useEffect(() => {
    setSearchState({ keyword, tab, womenOnly, photoWorkFilter });
    // eslint-disable-next-line react-hooks/exhaustive-deps -- setSearchState は毎回同一参照
  }, [keyword, tab, womenOnly, photoWorkFilter]);
  const moderation = useModerationFilter(user?.id);
  const results = useAwaseSearch({ region, keyword, womenOnly }, moderation.data);
  // 人物検索（人タブ・ログイン必須）。@ユーザーネーム前方一致＋許可者の表示名。
  const peopleQuery = useUserSearch(
    tab === "people" ? user?.id : undefined,
    tab === "people" ? keyword : "",
    moderation.data?.blockedUserIds ?? [],
  );
  const people = peopleQuery.data ?? [];
  const peopleLoading = tab === "people" && configured && Boolean(user) && peopleQuery.isPending && keyword.trim().length >= 2;
  // みんなの投稿（写真タブ）。新着順＋任意の作品タグ絞り込み。
  // 作品チップは、自分がフォローしている作品を先頭に出す（探しやすさ優先）。
  const followedWorkIds = new Set(useFollowedWorks(user?.id).data ?? []);
  const works = [...(useWorks().data ?? [])].sort((a, b) => {
    const af = followedWorkIds.has(a.id) ? 0 : 1;
    const bf = followedWorkIds.has(b.id) ? 0 : 1;
    return af - bf;
  });
  const photoFeedQuery = usePostsFeed(photoWorkFilter || undefined, moderation.data?.blockedUserIds ?? []);
  const photos = photoFeedQuery.data ?? [];
  const photosLoading = tab === "photos" && configured && photoFeedQuery.isPending;

  // Mock mode filters the sample list client-side so the same controls work
  // without a backend; configured mode gets already-filtered rows from the query.
  // キーワードは「読み一致」（ナルト/naruto/なると が同じヒット）で絞り込む。
  const kw = keyword.trim();
  const mockFiltered = searchResults.filter(
    (r) =>
      (region === "すべて" || r.region === region) &&
      (!womenOnly || r.womenOnly) &&
      (!kw || readingMatch(r.title, kw) || readingMatch(r.work, kw)),
  );
  const filtered = configured ? (results.data ?? []) : mockFiltered;
  const loading = configured && results.isPending && !results.data;
  const isEmpty = !loading && filtered.length === 0;

  // Keyword suggestions: popular works matching what's typed (読み一致・完全一致は除外)。
  // Empty input shows the whole popular list as quick picks.
  const suggestions = kw
    ? popularWorks.filter((w) => readingMatch(w, kw) && w.toLowerCase() !== kw.toLowerCase())
    : [];

  return (
    <div>
      {/* app bar + search field */}
      <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 18px 0" }}>
        <button
          onClick={back}
          style={{ background: "none", border: "none", cursor: "pointer", padding: 0 }}
          aria-label="戻る"
        >
          <ChevronLeftIcon />
        </button>
        <div
          style={{
            flex: 1,
            display: "flex",
            alignItems: "center",
            gap: 9,
            border: `1px solid ${colors.border}`,
            borderRadius: 13,
            padding: "11px 14px",
            background: colors.primaryBg4,
          }}
        >
          <SearchIcon size={16} color={colors.textMuted} />
          <input
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            placeholder={
              tab === "people"
                ? "＠ユーザーネーム・表示名で探す"
                : tab === "photos"
                  ? "作品・キャラ名で絞り込み"
                  : "作品・キャラ・募集タイトルで探す"
            }
            aria-label="キーワード検索"
            style={{
              flex: 1,
              minWidth: 0,
              border: "none",
              outline: "none",
              background: "transparent",
              fontFamily: "inherit",
              fontSize: 13,
              fontWeight: 500,
              color: colors.textPrimary,
            }}
          />
          {keyword && (
            <button
              onClick={() => setKeyword("")}
              aria-label="クリア"
              style={{
                border: "none",
                background: "none",
                padding: 10,
                margin: -10,
                cursor: "pointer",
                color: colors.textMutedAlt,
                fontSize: 16,
                lineHeight: 1,
              }}
            >
              ×
            </button>
          )}
        </div>
      </div>

      {/* 検索対象タブ: 併せ募集 / 人（ユーザー） */}
      <div style={{ display: "flex", gap: 8, padding: "12px 18px 0" }}>
        {([
          { key: "awase", label: "併せ募集" },
          { key: "people", label: "ユーザー" },
          { key: "photos", label: "写真" },
        ] as const).map((t) => {
          const active = tab === t.key;
          return (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              style={{
                fontSize: 12.5,
                fontWeight: 700,
                color: active ? colors.white : colors.textSecondary,
                background: active ? colors.primary : colors.white,
                border: `1px solid ${active ? colors.primary : colors.border}`,
                padding: "7px 18px",
                borderRadius: 999,
                cursor: "pointer",
                fontFamily: "inherit",
              }}
            >
              {t.label}
            </button>
          );
        })}
      </div>

      {tab === "people" ? (
        <PeopleResults
          configured={configured}
          signedIn={Boolean(user)}
          keyword={keyword}
          loading={peopleLoading}
          people={people}
          onOpenProfile={openProfile}
          onLogin={() => nav("login")}
        />
      ) : tab === "photos" ? (
        <PhotoResults
          configured={configured}
          keyword={keyword}
          works={works}
          workFilter={photoWorkFilter}
          onWorkFilterChange={setPhotoWorkFilter}
          photos={photos}
          loading={photosLoading}
          onOpenProfile={openProfile}
        />
      ) : (
        <>
      {/* suggestions: quick picks when empty, matching候補 while typing */}
      {keyword.trim() === "" ? (
        <div style={{ padding: "14px 18px 0" }}>
          <div style={{ fontSize: 11.5, fontWeight: 700, color: colors.textMutedAlt, marginBottom: 9, paddingLeft: 2 }}>
            人気のキーワード
          </div>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            {popularWorks.map((w) => (
              <button
                key={w}
                onClick={() => setKeyword(w)}
                style={{
                  fontSize: 12.5,
                  color: "#4A4458",
                  border: `1px solid ${colors.border}`,
                  background: colors.white,
                  padding: "8px 14px",
                  borderRadius: 999,
                  cursor: "pointer",
                  fontFamily: "inherit",
                  whiteSpace: "nowrap",
                }}
              >
                {w}
              </button>
            ))}
          </div>
        </div>
      ) : suggestions.length > 0 ? (
        <div style={{ padding: "8px 18px 0" }}>
          <div style={{ border: `1px solid ${colors.borderSoft}`, borderRadius: 12, overflow: "hidden", background: colors.white }}>
            {suggestions.map((w, i) => (
              <button
                key={w}
                onClick={() => setKeyword(w)}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 9,
                  width: "100%",
                  border: "none",
                  borderTop: i === 0 ? "none" : `1px solid ${colors.borderSofter}`,
                  background: colors.white,
                  padding: "11px 14px",
                  cursor: "pointer",
                  fontFamily: "inherit",
                  textAlign: "left",
                }}
              >
                <SearchIcon size={14} color={colors.textMutedAlt} />
                <span style={{ fontSize: 13, color: colors.textPrimary }}>{w}</span>
              </button>
            ))}
          </div>
        </div>
      ) : null}

      {/* filter chips — region (single-select) + women-only toggle */}
      <div
        className="noscroll"
        style={{ display: "flex", gap: 8, overflowX: "auto", padding: "14px 18px 0" }}
      >
        {regions.map((r) => {
          const active = r === region;
          return (
            <button
              key={r}
              onClick={() => setRegion(r)}
              style={{
                fontSize: 12,
                color: active ? colors.white : "#4A4458",
                background: active ? colors.primary : colors.white,
                border: `1px solid ${active ? colors.primary : colors.border}`,
                padding: "8px 13px",
                borderRadius: 999,
                whiteSpace: "nowrap",
                fontWeight: active ? 600 : 400,
                cursor: "pointer",
                fontFamily: "inherit",
              }}
            >
              {r}
            </button>
          );
        })}
        <button
          onClick={() => setWomenOnly((v) => !v)}
          aria-pressed={womenOnly}
          style={{
            fontSize: 12,
            color: womenOnly ? colors.white : colors.pinkText,
            background: womenOnly ? colors.pink : colors.pinkBg1,
            border: `1px solid ${womenOnly ? colors.pink : colors.pinkBg1}`,
            padding: "8px 13px",
            borderRadius: 999,
            whiteSpace: "nowrap",
            fontWeight: 600,
            cursor: "pointer",
            fontFamily: "inherit",
          }}
        >
          女性限定
        </button>
      </div>

      {/* result count */}
      <div style={{ display: "flex", alignItems: "baseline", gap: 8, padding: "18px 20px 0" }}>
        <span style={{ fontSize: 14, fontWeight: 700, color: colors.textPrimary }}>併せ募集</span>
        <span style={{ fontSize: 12, fontWeight: 600, color: colors.primary }}>
          {filtered.length}件
        </span>
      </div>

      {/* results / empty state */}
      <div style={{ padding: "16px 18px 30px" }} className="pt-grid">
        {loading && [0, 1, 2].map((i) => <AwaseCardSkeleton key={i} />)}
        {filtered.map((res) => (
          <button
            key={res.key}
            onClick={() => (configured && results.data ? openAwase(res.key) : nav("detail"))}
            style={{
              display: "flex",
              gap: 13,
              border: `1px solid ${colors.borderSoft}`,
              borderRadius: 18,
              padding: 12,
              background: colors.white,
              cursor: "pointer",
              fontFamily: "inherit",
              textAlign: "left",
              width: "100%",
            }}
          >
            <div style={{ flex: "0 0 92px", height: 92, position: "relative" }}>
              <AwaseCover radius={14} coverUrl={res.coverUrl} work={res.work} />
              {res.womenOnly && (
                <span
                  style={{
                    position: "absolute",
                    left: 6,
                    top: 6,
                    fontSize: 9,
                    fontWeight: 600,
                    color: colors.pinkText,
                    background: "rgba(255,255,255,.94)",
                    padding: "3px 7px",
                    borderRadius: 999,
                  }}
                >
                  女性限定
                </span>
              )}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div
                style={{
                  fontSize: 14,
                  fontWeight: 700,
                  color: colors.textPrimary,
                  lineHeight: 1.4,
                }}
              >
                {res.title}
              </div>
              <div style={{ fontSize: 11, color: colors.textMutedAlt, marginTop: 4 }}>
                {res.work}
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 8 }}>
                <span
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 3,
                    fontSize: 10.5,
                    color: "#877FA0",
                  }}
                >
                  <PinIcon />
                  {res.region}
                </span>
                <span
                  style={{
                    fontSize: 10.5,
                    color: colors.primary,
                    background: colors.primaryBg1,
                    padding: "4px 9px",
                    borderRadius: 999,
                  }}
                >
                  {res.world}
                </span>
              </div>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  marginTop: 10,
                }}
              >
                <span style={{ fontSize: 11, color: colors.textSecondaryAlt }}>{res.date}</span>
                <SlotBadge text={res.members} />
              </div>
            </div>
          </button>
        ))}

        {isEmpty && (
          <div style={{ padding: "36px 20px", textAlign: "center" }}>
            <div
              style={{
                width: 56,
                height: 56,
                margin: "0 auto",
                borderRadius: "50%",
                background: "#F4F1FA",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <PinIcon size={26} color={colors.textMutedSoft} />
            </div>
            <p style={{ margin: "14px 0 0", fontSize: 13, color: colors.textMutedAlt, lineHeight: 1.8 }}>
              このエリアの募集はまだありません。
              <br />
              あなたが最初に募集してみませんか？
            </p>
            <button
              onClick={() => nav("create")}
              style={{
                marginTop: 16,
                border: "none",
                background: colors.primary,
                color: colors.white,
                fontFamily: "inherit",
                fontSize: 13,
                fontWeight: 700,
                padding: "12px 24px",
                borderRadius: 13,
                cursor: "pointer",
              }}
            >
              併せを募集する
            </button>
          </div>
        )}
      </div>
        </>
      )}
    </div>
  );
}

/** 人物検索の結果リスト（人タブ）。ログイン必須・非公開/ブロックは除外済み。 */
function PeopleResults({
  configured,
  signedIn,
  keyword,
  loading,
  people,
  onOpenProfile,
  onLogin,
}: {
  configured: boolean;
  signedIn: boolean;
  keyword: string;
  loading: boolean;
  people: { id: string; handle: string; displayName: string; avatarUrl: string | null; isVerified: boolean }[];
  onOpenProfile: (id: string) => void;
  onLogin: () => void;
}) {
  const q = keyword.trim();

  // プレビュー環境（未接続）では人物検索は動かせない
  if (!configured) {
    return (
      <div style={{ padding: "40px 24px", textAlign: "center", fontSize: 12.5, color: colors.textMutedAlt, lineHeight: 1.9 }}>
        プレビュー環境では人物検索は利用できません。
      </div>
    );
  }
  // ログイン必須（つきまとい対策: 行動をアカウントに紐づける）
  if (!signedIn) {
    return (
      <div style={{ padding: "36px 24px", textAlign: "center" }}>
        <p style={{ margin: 0, fontSize: 13, color: colors.textSecondary, lineHeight: 1.9 }}>
          人を検索するには無料登録・ログインが必要です。
        </p>
        <button
          onClick={onLogin}
          style={{
            marginTop: 16,
            border: "none",
            background: colors.primary,
            color: colors.white,
            fontFamily: "inherit",
            fontSize: 13,
            fontWeight: 700,
            padding: "12px 24px",
            borderRadius: 13,
            cursor: "pointer",
          }}
        >
          ログイン / 登録
        </button>
      </div>
    );
  }
  if (q.length < 2) {
    return (
      <div style={{ padding: "36px 24px", textAlign: "center", fontSize: 12.5, color: colors.textMutedAlt, lineHeight: 1.9 }}>
        @ユーザーネームか表示名を2文字以上入力してください。
        <br />
        <span style={{ fontSize: 11, color: colors.textMutedSoft }}>
          ※ 非公開アカウントや、表示名検索をオフにしている人は表示されません。
        </span>
      </div>
    );
  }
  if (loading) {
    return <div style={{ padding: "48px 24px", textAlign: "center", fontSize: 13, color: colors.textMutedAlt }}>検索中…</div>;
  }
  if (people.length === 0) {
    return (
      <div style={{ padding: "40px 24px", textAlign: "center", fontSize: 12.5, color: colors.textMutedAlt, lineHeight: 1.9 }}>
        該当する人が見つかりませんでした。
        <br />
        <span style={{ fontSize: 11, color: colors.textMutedSoft }}>@ユーザーネームは前方一致で検索できます。</span>
      </div>
    );
  }
  return (
    <div style={{ display: "flex", flexDirection: "column", padding: "12px 18px 30px", gap: 8 }}>
      {people.map((p) => (
        <button
          key={p.id}
          onClick={() => onOpenProfile(p.id)}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 12,
            border: `1px solid ${colors.borderSoft}`,
            borderRadius: 14,
            padding: "11px 13px",
            background: colors.white,
            cursor: "pointer",
            fontFamily: "inherit",
            textAlign: "left",
            width: "100%",
          }}
        >
          <div style={{ flex: "0 0 44px", width: 44, height: 44, borderRadius: "50%", overflow: "hidden", background: colors.primaryBg1 }}>
            <ImageSlot circle src={p.avatarUrl ?? undefined} />
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
              <span style={{ fontSize: 13.5, fontWeight: 700, color: colors.textPrimary, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                {p.displayName}
              </span>
              {p.isVerified && (
                // eslint-disable-next-line @next/next/no-img-element
                <img src="/verified-badge.png" alt="本人確認済" width={16} height={16} style={{ display: "block", flex: "0 0 auto" }} />
              )}
            </div>
            <div style={{ fontSize: 11.5, color: colors.textMutedAlt, marginTop: 2 }}>@{p.handle}</div>
          </div>
          <ChevronRightIcon />
        </button>
      ))}
    </div>
  );
}

/** みんなの投稿（写真タブ）。新着順の一覧＋任意の作品・キャラタグ絞り込み。
 * タップで拡大表示（ライトボックス）、投稿者名タップでプロフィールへ。 */
function PhotoResults({
  configured,
  keyword,
  works,
  workFilter,
  onWorkFilterChange,
  photos,
  loading,
  onOpenProfile,
}: {
  configured: boolean;
  keyword: string;
  works: { id: string; name: string }[];
  workFilter: string;
  onWorkFilterChange: (workId: string) => void;
  photos: FeedPost[];
  loading: boolean;
  onOpenProfile: (id: string) => void;
}) {
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  const lightbox = lightboxIndex !== null ? (photos[lightboxIndex] ?? null) : null;
  const kw = keyword.trim();
  const visibleWorks = kw ? works.filter((w) => readingMatch(w.name, kw)) : works;

  const chipStyle = (active: boolean): CSSProperties => ({
    fontSize: 12,
    color: active ? colors.white : "#4A4458",
    background: active ? colors.primary : colors.white,
    border: `1px solid ${active ? colors.primary : colors.border}`,
    padding: "8px 13px",
    borderRadius: 999,
    whiteSpace: "nowrap",
    fontWeight: active ? 600 : 400,
    cursor: "pointer",
    fontFamily: "inherit",
  });

  // プレビュー環境（未接続）ではサンプル表示のみ
  if (!configured) {
    return (
      <div>
        <p style={{ margin: 0, padding: "18px 18px 0", fontSize: 11.5, color: colors.textMutedAlt }}>
          プレビュー環境ではサンプル表示です。
        </p>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, minmax(0, 1fr))", gap: 6, padding: "14px 18px 30px" }}>
          {homePosts.map((p) => (
            <div key={p.key} style={{ height: 108 }}>
              <ImageSlot radius={12} />
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div>
      {/* 作品・キャラタグでの絞り込み（任意・投稿者が付けたタグのみ） */}
      <div className="noscroll" style={{ display: "flex", gap: 8, overflowX: "auto", padding: "14px 18px 0" }}>
        <button onClick={() => onWorkFilterChange("")} style={chipStyle(workFilter === "")}>
          すべて
        </button>
        {visibleWorks.map((w) => (
          <button key={w.id} onClick={() => onWorkFilterChange(w.id)} style={chipStyle(workFilter === w.id)}>
            {w.name}
          </button>
        ))}
      </div>

      {!loading && photos.length === 0 && (
        <div style={{ padding: "40px 24px", textAlign: "center", fontSize: 12.5, color: colors.textMutedAlt, lineHeight: 1.9 }}>
          まだ写真がありません。
        </div>
      )}

      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, minmax(0, 1fr))", gap: 6, padding: "14px 18px 30px" }}>
        {loading && [0, 1, 2, 3, 4, 5].map((i) => <Skeleton key={i} height={108} radius={12} />)}
        {photos.map((p, i) => (
          <button
            key={p.id}
            onClick={() => setLightboxIndex(i)}
            aria-label="拡大表示"
            style={{ height: 108, padding: 0, border: "none", borderRadius: 12, overflow: "hidden", cursor: "pointer" }}
          >
            <ImageSlot radius={12} src={p.imageUrl} />
          </button>
        ))}
      </div>

      {lightbox && lightboxIndex !== null && (
        <div
          onClick={() => setLightboxIndex(null)}
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 100,
            background: "rgba(20,14,28,.92)",
            display: "flex",
            flexDirection: "column",
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
          {lightboxIndex < photos.length - 1 && (
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
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={lightbox.imageUrl}
            alt=""
            onClick={(e) => e.stopPropagation()}
            style={{ maxWidth: "100%", maxHeight: "78%", borderRadius: 12, objectFit: "contain" }}
          />
          <button
            onClick={(e) => {
              e.stopPropagation();
              onOpenProfile(lightbox.authorId);
            }}
            style={{
              marginTop: 14,
              display: "flex",
              alignItems: "center",
              gap: 8,
              background: "rgba(255,255,255,.12)",
              border: "none",
              borderRadius: 999,
              padding: "8px 16px",
              cursor: "pointer",
            }}
          >
            <div style={{ width: 26, height: 26, borderRadius: "50%", overflow: "hidden" }}>
              <ImageSlot circle src={lightbox.authorAvatarUrl ?? undefined} />
            </div>
            {/* 「誰の写真か」は表示名を主役に。@ユーザーネームは重複可能な表示名を
                補い、同名の人の区別・検索に使えるよう小さく併記する。 */}
            <span style={{ display: "flex", flexDirection: "column", alignItems: "flex-start", lineHeight: 1.25, textAlign: "left" }}>
              <span style={{ fontSize: 12.5, color: colors.white, fontWeight: 700 }}>{lightbox.authorDisplayName}</span>
              {lightbox.authorHandle && (
                <span style={{ fontSize: 10.5, color: "rgba(255,255,255,.72)" }}>@{lightbox.authorHandle}</span>
              )}
            </span>
          </button>
        </div>
      )}
    </div>
  );
}
