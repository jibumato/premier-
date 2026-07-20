"use client";

import { useEffect, useRef, useState } from "react";
import { colors } from "@/lib/tokens";
import { useRouter } from "../AppRouter";
import { ImageSlot } from "../ImageSlot";
import { WorkCover } from "../WorkCover";
import { AppBar, PrimaryButton, SectionHeading } from "../ui";
import { CheckIcon, StarIcon, ChevronRightIcon } from "../icons";
import { useToast } from "../Toast";
import { useAuth } from "@/lib/auth/useAuth";
import {
  useEvent,
  useIsGoing,
  useRsvpEvent,
  useCancelRsvp,
  useEventAttendees,
  useInterestedCount,
  useIsInterested,
  useInterestEvent,
  useCancelInterest,
  useEventReviews,
  useMyEventReview,
  useSubmitEventReview,
  useIsAppearing,
  useAddAppearance,
  useRemoveAppearance,
} from "@/lib/queries/events";
import { useEventAwase } from "@/lib/queries/awase";
import { useModerationFilter } from "@/lib/queries/moderation";
import { isSupabaseConfigured } from "@/lib/supabase/config";

const mockInfo = [
  { label: "日程", value: "8/17(日) 10:00〜16:00" },
  { label: "会場", value: "東京ビッグサイト" },
  { label: "エリア", value: "東京" },
  { label: "参加費", value: "前売 ¥2,000" },
];

export function EventDetailScreen() {
  const { back, nav, openProfile, openAwase, openCreateForEvent, selectedEventId } = useRouter();
  const { user } = useAuth();
  const { showToast } = useToast();
  const configured = isSupabaseConfigured();

  const eventQuery = useEvent(selectedEventId);
  const isGoingQuery = useIsGoing(selectedEventId, user?.id);
  const rsvp = useRsvpEvent();
  const cancelRsvp = useCancelRsvp();
  const [mockGoing, setMockGoing] = useState(false);
  const interestedCountQuery = useInterestedCount(selectedEventId);
  const isInterestedQuery = useIsInterested(selectedEventId, user?.id);
  const interestEvent = useInterestEvent();
  const cancelInterest = useCancelInterest();
  const [mockInterested, setMockInterested] = useState(false);
  // 出演の掲示（0076）: プロフィールに「次に会える場所」として公開＆フォロワー通知。
  const isAppearingQuery = useIsAppearing(selectedEventId, user?.id);
  const addAppearance = useAddAppearance();
  const removeAppearance = useRemoveAppearance();
  const [mockAppearing, setMockAppearing] = useState(false);
  // 参加予定の顔ぶれ（ログイン中のみ・非公開/ブロック/停止は除外）。人数は公開。
  const moderation = useModerationFilter(user?.id);
  const attendeesQuery = useEventAttendees(selectedEventId, user?.id, moderation.data?.blockedUserIds ?? []);
  const attendees = attendeesQuery.data ?? [];
  // このイベントに紐づく併せ募集（0068 の event_id 紐付け）。興味→仲間探しの導線。
  const eventAwaseQuery = useEventAwase(selectedEventId, moderation.data);
  const eventAwase = eventAwaseQuery.data ?? [];
  // 開催後レビュー（0069）。会場の鮮度ある評判を積み上げる。
  const reviewsQuery = useEventReviews(selectedEventId, moderation.data?.blockedUserIds ?? []);
  const reviews = reviewsQuery.data ?? [];
  const myReviewQuery = useMyEventReview(selectedEventId, user?.id);
  const submitReview = useSubmitEventReview();
  const [reviewRating, setReviewRating] = useState(0);
  const [reviewComment, setReviewComment] = useState("");
  const reviewPrefilled = useRef(false);
  useEffect(() => {
    if (reviewPrefilled.current) return;
    const mine = myReviewQuery.data;
    if (mine) {
      reviewPrefilled.current = true;
      setReviewRating(mine.rating);
      setReviewComment(mine.comment);
    }
  }, [myReviewQuery.data]);

  const real = configured && selectedEventId ? eventQuery.data : undefined;
  const loading = configured && Boolean(selectedEventId) && eventQuery.isPending && !eventQuery.data;
  const going = real ? Boolean(isGoingQuery.data) : mockGoing;
  const interested = real ? Boolean(isInterestedQuery.data) : mockInterested;
  const appearing = real ? Boolean(isAppearingQuery.data) : mockAppearing;

  const name = real?.name ?? "ホロサマ 2025";
  const goingCount = real ? real.going.toLocaleString() : "1,240";
  const interestedCount = real ? (interestedCountQuery.data ?? 0).toLocaleString() : "58";
  const info = real
    ? [
        { label: "日程", value: real.date },
        { label: "会場", value: real.venue },
        { label: "エリア", value: real.region },
        { label: "参加費", value: real.feeText ?? "無料" },
      ]
    : mockInfo;
  const bodyText =
    real?.body ||
    "コスプレ参加可のイベントです。当日の併せ集合や日程調整はプルミエ！のメッセージ・日程調整機能が使えます。参加表明をすると、あなたが参加予定であることが人数に反映されます。";

  const handleRsvp = () => {
    if (configured && !user) {
      // 接続済みだが未ログイン → 参加表明には登録が必要
      nav("login");
      return;
    }
    if (real && user && selectedEventId) {
      rsvp.mutate({ eventId: selectedEventId, userId: user.id });
    } else {
      setMockGoing(true);
    }
  };

  const handleCancelRsvp = () => {
    if (real && user && selectedEventId) {
      if (cancelRsvp.isPending) return;
      cancelRsvp.mutate(
        { eventId: selectedEventId, userId: user.id },
        { onError: () => showToast("参加表明の取り消しに失敗しました。もう一度お試しください。") },
      );
    } else {
      setMockGoing(false);
    }
  };

  const handleToggleAppearance = () => {
    if (configured && !user) {
      nav("login");
      return;
    }
    if (real && user && selectedEventId) {
      if (addAppearance.isPending || removeAppearance.isPending) return;
      if (appearing) {
        removeAppearance.mutate(
          { eventId: selectedEventId, userId: user.id },
          { onError: () => showToast("取り消しに失敗しました。もう一度お試しください。") },
        );
      } else {
        addAppearance.mutate(
          { eventId: selectedEventId, userId: user.id },
          {
            onSuccess: () => showToast("プロフィールに掲示し、フォロワーに通知しました"),
            onError: () => showToast("掲示に失敗しました。もう一度お試しください。"),
          },
        );
      }
    } else {
      setMockAppearing((v) => !v);
    }
  };

  const handleCreateAwaseForEvent = () => {
    if (configured && !user) {
      nav("login");
      return;
    }
    if (selectedEventId) openCreateForEvent(selectedEventId);
  };

  // 開催後レビュー: 開催日を過ぎ、かつ参加表明済みの本人だけが書ける（RLSと一致）。
  const now = new Date();
  const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
  const isPastEvent = Boolean(real?.startsOn) && (real!.startsOn as string) < todayStr;
  const canWriteReview = configured && Boolean(user) && going && isPastEvent;
  const hasReviewed = Boolean(myReviewQuery.data);
  const avgRating = reviews.length ? reviews.reduce((s, r) => s + r.rating, 0) / reviews.length : 0;

  const handleSubmitReview = () => {
    if (!user || !selectedEventId || reviewRating < 1 || submitReview.isPending) return;
    submitReview.mutate(
      { eventId: selectedEventId, userId: user.id, rating: reviewRating, comment: reviewComment.trim() },
      { onError: () => showToast("レビューの投稿に失敗しました。もう一度お試しください。") },
    );
  };

  const handleToggleInterest = () => {
    if (configured && !user) {
      nav("login");
      return;
    }
    if (real && user && selectedEventId) {
      if (interestEvent.isPending || cancelInterest.isPending) return;
      if (interested) {
        cancelInterest.mutate(
          { eventId: selectedEventId, userId: user.id },
          { onError: () => showToast("行ってみたいの取り消しに失敗しました。もう一度お試しください。") },
        );
      } else {
        interestEvent.mutate(
          { eventId: selectedEventId, userId: user.id },
          { onError: () => showToast("行ってみたいの登録に失敗しました。もう一度お試しください。") },
        );
      }
    } else {
      setMockInterested((v) => !v);
    }
  };

  if (loading) {
    return (
      <div>
        <AppBar title="イベントの詳細" onBack={back} />
        <div style={{ padding: "60px 22px", textAlign: "center", fontSize: 13, color: colors.textMutedAlt }}>読み込み中…</div>
      </div>
    );
  }

  return (
    <div>
      <AppBar title="イベントの詳細" onBack={back} />

      <div style={{ padding: "6px 22px 0", position: "relative" }}>
        <div style={{ height: 180 }}>
          {/* 許諾を得た公式画像があればそれを、無ければイベント名から生成した
              デザイン（権利リスクなし）を表示する */}
          {real?.imageUrl ? (
            <ImageSlot radius={18} src={real.imageUrl} />
          ) : (
            <WorkCover name={name} radius={18} showName={false} />
          )}
        </div>
        <span
          style={{
            position: "absolute",
            left: 34,
            top: 18,
            fontSize: 11,
            fontWeight: 600,
            color: colors.white,
            background: "rgba(109,93,171,.92)",
            padding: "6px 12px",
            borderRadius: 999,
          }}
        >
          大型イベント
        </span>
      </div>

      <div style={{ padding: "18px 22px 0" }}>
        <h2 style={{ margin: 0, fontSize: 21, fontWeight: 700, color: colors.textPrimary }}>{name}</h2>
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginTop: 8 }}>
          <span style={{ fontSize: 12.5, color: colors.primary, fontWeight: 600 }}>{goingCount}人が参加予定</span>
          <span style={{ fontSize: 12.5, color: colors.textMutedAlt, fontWeight: 600 }}>
            {interestedCount}人が行ってみたい
          </span>
        </div>
      </div>

      <div style={{ padding: "18px 22px 0" }}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
          {info.map((it) => (
            <div key={it.label} style={{ border: `1px solid ${colors.borderSoft}`, borderRadius: 14, padding: "13px 14px" }}>
              <div style={{ fontSize: 10.5, color: colors.textMutedAlt }}>{it.label}</div>
              <div style={{ fontSize: 13, fontWeight: 700, color: colors.textPrimary, marginTop: 5 }}>{it.value}</div>
            </div>
          ))}
        </div>
      </div>

      <div style={{ padding: "24px 22px 0" }}>
        <SectionHeading size={15}>イベント概要</SectionHeading>
        <p style={{ margin: "12px 0 0", fontSize: 13, lineHeight: 1.9, color: colors.textSecondary }}>
          {bodyText}
        </p>
      </div>

      {/* 出演を掲示（0076）。本人が「ここに出演します」とプロフィールに公開し、
          フォロワーに通知。ファンに「次どこで会えるか」を伝えるリアル導線。 */}
      <div style={{ padding: "20px 22px 0" }}>
        <button
          onClick={handleToggleAppearance}
          disabled={addAppearance.isPending || removeAppearance.isPending}
          style={{
            width: "100%",
            display: "flex",
            alignItems: "center",
            gap: 11,
            border: appearing ? `1.5px solid ${colors.pink}` : `1px solid ${colors.border}`,
            background: appearing ? colors.pinkBg1 : colors.white,
            borderRadius: 14,
            padding: "13px 15px",
            fontFamily: "inherit",
            textAlign: "left",
            cursor: "pointer",
          }}
        >
          <div
            style={{
              flex: "0 0 34px",
              width: 34,
              height: 34,
              borderRadius: "50%",
              background: appearing ? colors.pink : colors.primaryBg5,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            {appearing ? <CheckIcon size={17} color={colors.white} /> : <StarIcon size={16} color={colors.pink} />}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: appearing ? colors.pink : colors.textPrimary }}>
              {appearing ? "出演を掲示中" : "このイベントに出演する"}
            </div>
            <div style={{ fontSize: 10.5, color: colors.textMutedAlt, marginTop: 2, lineHeight: 1.5 }}>
              {appearing
                ? "プロフィールの「次に会えるイベント」に表示中。タップで取り消し。"
                : "プロフィールに掲示し、フォロワーに通知します。"}
            </div>
          </div>
        </button>
      </div>

      {/* 参加予定のユーザー — 人数は上部で公開。顔ぶれ（名前・アイコン）は
          ログイン中のユーザーにだけ表示し、非公開アカウント・ブロック相手・停止中は
          除外する（つきまとい対策。人物検索と同じ方針）。 */}
      <div style={{ padding: "24px 22px 0" }}>
        <SectionHeading size={15}>参加予定のユーザー</SectionHeading>
        {!configured ? (
          <div style={{ display: "flex", gap: 10, marginTop: 13 }}>
            {[0, 1, 2, 3, 4].map((i) => (
              <div key={i} style={{ width: 46, height: 46, borderRadius: "50%", overflow: "hidden", flex: "0 0 auto" }}>
                <ImageSlot circle />
              </div>
            ))}
          </div>
        ) : !user ? (
          <div
            style={{
              marginTop: 12,
              border: `1px dashed ${colors.border}`,
              borderRadius: 14,
              padding: "16px 14px",
              background: colors.primaryBg5,
              textAlign: "center",
            }}
          >
            <p style={{ margin: 0, fontSize: 12.5, color: colors.textSecondary, lineHeight: 1.8 }}>
              参加予定の顔ぶれは、ログインすると見られます。
              <br />
              <span style={{ fontSize: 11, color: colors.textMutedSoft }}>
                ※ 非公開アカウントの人は表示されません。
              </span>
            </p>
            <button
              onClick={() => nav("login")}
              style={{
                marginTop: 12,
                border: "none",
                background: colors.primary,
                color: colors.white,
                fontFamily: "inherit",
                fontSize: 12.5,
                fontWeight: 700,
                padding: "10px 22px",
                borderRadius: 12,
                cursor: "pointer",
              }}
            >
              ログイン / 登録
            </button>
          </div>
        ) : attendees.length === 0 ? (
          <p style={{ margin: "12px 0 0", fontSize: 12.5, color: colors.textMutedAlt, lineHeight: 1.8 }}>
            まだ参加表明した人がいません。いちばん乗りで参加表明してみましょう。
          </p>
        ) : (
          <div className="noscroll" style={{ display: "flex", gap: 14, overflowX: "auto", padding: "13px 2px 2px" }}>
            {attendees.map((p) => (
              <button
                key={p.id}
                onClick={() => openProfile(p.id)}
                style={{
                  flex: "0 0 auto",
                  width: 58,
                  border: "none",
                  background: "none",
                  padding: 0,
                  cursor: "pointer",
                  fontFamily: "inherit",
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  gap: 5,
                }}
              >
                <div style={{ position: "relative", width: 46, height: 46 }}>
                  <div style={{ width: 46, height: 46, borderRadius: "50%", overflow: "hidden" }}>
                    <ImageSlot circle src={p.avatarUrl ?? undefined} />
                  </div>
                  {p.isVerified && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src="/verified-badge.png"
                      alt="本人確認済"
                      width={15}
                      height={15}
                      style={{ position: "absolute", right: -2, bottom: -2, display: "block" }}
                    />
                  )}
                </div>
                <span
                  style={{
                    fontSize: 10.5,
                    color: colors.textSecondary,
                    maxWidth: 58,
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                    textAlign: "center",
                  }}
                >
                  {p.displayName}
                </span>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* このイベントの併せ — 「行ってみたい」で終わらせず、一緒に回る仲間探し・
          募集へつなげる導線。イベント×併せの構造的な紐付け（0068）で正確に一覧する。 */}
      {real && (
        <div style={{ padding: "24px 22px 0" }}>
          <SectionHeading size={15}>このイベントの併せ</SectionHeading>
          {eventAwase.length === 0 ? (
            <p style={{ margin: "12px 0 0", fontSize: 12.5, color: colors.textMutedAlt, lineHeight: 1.8 }}>
              このイベントの併せ募集はまだありません。行ってみたいなら、あなたが最初の主催になって一緒に回る仲間を募集してみましょう。
            </p>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 9, marginTop: 13 }}>
              {eventAwase.map((a) => (
                <button
                  key={a.key}
                  onClick={() => openAwase(a.key)}
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
                    {a.coverUrl ? <ImageSlot radius={11} src={a.coverUrl} /> : <WorkCover name={a.title} radius={11} showName={false} />}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 12.5, fontWeight: 700, color: colors.textPrimary, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {a.title}
                    </div>
                    <div style={{ fontSize: 10.5, color: colors.textMutedAlt, marginTop: 2, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {a.work} ・ {a.tag}
                    </div>
                  </div>
                  <ChevronRightIcon />
                </button>
              ))}
            </div>
          )}
          <button
            onClick={handleCreateAwaseForEvent}
            style={{
              width: "100%",
              marginTop: 12,
              border: `1px solid ${colors.primary}`,
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
            このイベントで併せを募集する
          </button>
        </div>
      )}

      {/* 会場・イベントの参加後レビュー（0069）。行った人しか書けない鮮度ある評判を
          積み上げ、初参加者が安心して行けるかを事前に判断できるようにする。 */}
      {real && (
        <div style={{ padding: "24px 22px 0" }}>
          <SectionHeading
            size={15}
            right={
              reviews.length ? (
                <span style={{ display: "flex", alignItems: "center", gap: 4 }}>
                  <StarIcon size={13} filled color="#E0A93B" />
                  <span style={{ fontSize: 12.5, fontWeight: 700, color: colors.textPrimary }}>{avgRating.toFixed(1)}</span>
                  <span style={{ fontSize: 11, color: colors.textMutedAlt }}>（{reviews.length}件）</span>
                </span>
              ) : undefined
            }
          >
            会場・イベントのレビュー
          </SectionHeading>

          {canWriteReview && (
            <div
              style={{
                marginTop: 13,
                border: `1px solid ${colors.borderSoft}`,
                borderRadius: 16,
                padding: "15px 16px",
                background: colors.primaryBg5,
              }}
            >
              <div style={{ fontSize: 12.5, fontWeight: 700, color: colors.textPrimary }}>
                {hasReviewed ? "あなたのレビュー" : "参加おつかれさまでした！会場はどうでしたか？"}
              </div>
              <div style={{ display: "flex", gap: 4, marginTop: 10 }}>
                {[1, 2, 3, 4, 5].map((n) => (
                  <button
                    key={n}
                    onClick={() => setReviewRating(n)}
                    aria-label={`${n}点`}
                    style={{ border: "none", background: "none", padding: 2, cursor: "pointer", display: "flex" }}
                  >
                    <StarIcon size={26} filled={n <= reviewRating} color={n <= reviewRating ? "#E0A93B" : "#D8D3E2"} />
                  </button>
                ))}
              </div>
              <input
                value={reviewComment}
                onChange={(e) => setReviewComment(e.target.value)}
                maxLength={140}
                placeholder="混雑・撮影環境・アクセス・更衣室など（任意）"
                style={{
                  width: "100%",
                  marginTop: 10,
                  border: `1px solid ${colors.border}`,
                  borderRadius: 12,
                  padding: "11px 13px",
                  fontSize: 13,
                  fontFamily: "inherit",
                  outline: "none",
                  background: colors.white,
                }}
              />
              <button
                onClick={handleSubmitReview}
                disabled={reviewRating < 1 || submitReview.isPending}
                style={{
                  width: "100%",
                  marginTop: 10,
                  border: "none",
                  background: colors.primary,
                  color: colors.white,
                  fontFamily: "inherit",
                  fontSize: 13,
                  fontWeight: 700,
                  padding: "12px 0",
                  borderRadius: 13,
                  cursor: reviewRating < 1 || submitReview.isPending ? "default" : "pointer",
                  opacity: reviewRating < 1 ? 0.5 : 1,
                }}
              >
                {submitReview.isPending ? "送信中…" : hasReviewed ? "レビューを更新" : "レビューを投稿"}
              </button>
              {submitReview.isSuccess && (
                <div style={{ fontSize: 11, color: colors.positive, marginTop: 8, textAlign: "center" }}>
                  ありがとうございます！これから行く人の参考になります。
                </div>
              )}
            </div>
          )}

          {reviews.length === 0 ? (
            <p style={{ margin: "12px 0 0", fontSize: 12.5, color: colors.textMutedAlt, lineHeight: 1.8 }}>
              まだレビューはありません。
              {isPastEvent
                ? "参加した方は、これから行く人のために会場の様子を教えてあげましょう。"
                : "開催後、参加した人のレビューがここに表示されます。"}
            </p>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 14, marginTop: 14 }}>
              {reviews.map((rv) => (
                <div key={rv.userId} style={{ display: "flex", gap: 10 }}>
                  <button
                    onClick={() => openProfile(rv.userId)}
                    style={{ border: "none", background: "none", padding: 0, cursor: "pointer", flex: "0 0 auto" }}
                  >
                    <div style={{ position: "relative", width: 36, height: 36 }}>
                      <div style={{ width: 36, height: 36, borderRadius: "50%", overflow: "hidden" }}>
                        <ImageSlot circle src={rv.avatarUrl ?? undefined} />
                      </div>
                      {rv.isVerified && (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src="/verified-badge.png"
                          alt="本人確認済"
                          width={13}
                          height={13}
                          style={{ position: "absolute", right: -2, bottom: -2, display: "block" }}
                        />
                      )}
                    </div>
                  </button>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                      <span style={{ fontSize: 12.5, fontWeight: 700, color: colors.textPrimary }}>{rv.displayName}</span>
                      <span style={{ display: "flex", gap: 1 }}>
                        {[1, 2, 3, 4, 5].map((n) => (
                          <StarIcon key={n} size={11} filled={n <= rv.rating} color={n <= rv.rating ? "#E0A93B" : "#D8D3E2"} />
                        ))}
                      </span>
                    </div>
                    {rv.comment && (
                      <p style={{ margin: "4px 0 0", fontSize: 12.5, color: colors.textSecondary, lineHeight: 1.7 }}>
                        {rv.comment}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* going state */}
      <div style={{ padding: "24px 22px 30px" }}>
        {going ? (
          <div
            style={{
              border: `1px solid ${colors.borderSoft}`,
              borderRadius: 16,
              padding: "18px 16px",
              background: colors.primaryBg5,
              textAlign: "center",
            }}
          >
            <div
              style={{
                width: 52,
                height: 52,
                margin: "0 auto",
                borderRadius: "50%",
                background: "linear-gradient(155deg,#F2EDFB,#F7EEF6)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <CheckIcon size={26} />
            </div>
            <div style={{ fontSize: 14, fontWeight: 700, color: colors.textPrimary, marginTop: 12 }}>
              参加表明しました！
            </div>
            <p style={{ margin: "6px 0 14px", fontSize: 12, color: colors.textMutedAlt, lineHeight: 1.8 }}>
              このイベントの併せ募集をホームでチェックしましょう。
            </p>
            <PrimaryButton onClick={() => nav("search", "search")} style={{ fontSize: 13, padding: 13 }}>
              このイベントの併せを探す
            </PrimaryButton>
            <button
              onClick={handleCancelRsvp}
              style={{
                marginTop: 10,
                border: "none",
                background: "none",
                color: colors.textMutedAlt,
                fontFamily: "inherit",
                fontSize: 12,
                padding: 6,
                cursor: "pointer",
                textDecoration: "underline",
              }}
            >
              参加表明を取り消す
            </button>
          </div>
        ) : (
          <div style={{ display: "flex", gap: 10 }}>
            <button
              onClick={handleToggleInterest}
              aria-pressed={interested}
              style={{
                flex: "0 0 auto",
                display: "flex",
                alignItems: "center",
                gap: 6,
                border: `1px solid ${interested ? colors.primary : colors.border}`,
                background: interested ? colors.primaryBg5 : colors.white,
                color: interested ? colors.primary : colors.textSecondary,
                fontFamily: "inherit",
                fontSize: 13,
                fontWeight: 700,
                padding: "0 16px",
                borderRadius: 14,
                cursor: "pointer",
              }}
            >
              <StarIcon size={15} filled={interested} color={interested ? colors.primary : "#B4AEC0"} />
              行ってみたい
            </button>
            <div style={{ flex: 1 }}>
              <PrimaryButton onClick={handleRsvp}>参加表明する</PrimaryButton>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
