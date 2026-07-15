"use client";

import { colors } from "@/lib/tokens";
import {
  events as mockEvents,
  homeAwase,
  homePosts,
  mockActivity,
  mockTrendingWorks,
  popularWorks,
  siteTagline,
} from "@/lib/data";
import { useRouter } from "../AppRouter";
import { ImageSlot } from "../ImageSlot";
import { SectionHeading } from "../ui";
import { BellIcon, CalendarIcon, CameraIcon, HeartIcon, HelpIcon, MessageIcon, PinIcon, SearchIcon } from "../icons";
import { useAwaseFeed, useBeginnerAwase } from "@/lib/queries/awase";
import { useEvents } from "@/lib/queries/events";
import { useModerationFilter } from "@/lib/queries/moderation";
import { useAnnouncements } from "@/lib/queries/announcements";
import { useRecentActivity, useTodayStats, useTrendingWorks } from "@/lib/queries/activity";
import { usePresenceCount } from "@/lib/queries/presence";
import { useAuth } from "@/lib/auth/useAuth";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { formatRelativeTime } from "@/lib/format";
import { announcements as mockAnnouncements } from "@/lib/data";
import { EmptyState } from "../EmptyState";
import { WelcomeBanner } from "../WelcomeBanner";
import { WorkCover } from "../WorkCover";
import { AwaseCover } from "../AwaseCover";
import { StarterGuide } from "../StarterGuide";
import { SafetySection } from "../SafetySection";
import { HomePickup } from "../HomePickup";
import type { Screen } from "@/lib/types";

const shortcuts: { key: Screen; label: string; icon: React.ReactNode }[] = [
  // フリマ（衣装売買）はローンチ時は非表示。画面・ルート・DB は残してあるので、
  // 再開時は下行のコメントを外すだけで復活する。
  // { key: "market", label: "フリマ", icon: <BagIcon size={22} /> },
  { key: "events", label: "イベント", icon: <CalendarIcon size={22} /> },
  { key: "studios", label: "スタジオ", icon: <CameraIcon size={22} color="#6D5DAB" /> },
  { key: "qa", label: "知恵袋", icon: <HelpIcon size={22} /> },
];

export function HomeScreen() {
  const { nav, openAwase, openEvent, openSearch } = useRouter();
  const { user } = useAuth();
  const configured = isSupabaseConfigured();
  const moderation = useModerationFilter(user?.id);
  const feed = useAwaseFeed(moderation.data);
  // Real feed once connected and loaded; the handoff's mock list otherwise —
  // same AwaseCard shape, so the card markup below never branches.
  // In configured mode never fall back to mock while loading: show real data
  // (or an empty/loading section) so prototype content never flashes.
  const awaseList = configured ? (feed.data ?? []) : homeAwase;
  const feedEmpty = configured && feed.data?.length === 0;
  const feedLoading = configured && feed.isPending && !feed.data;
  const announcementsQuery = useAnnouncements();
  const announcementList = configured ? (announcementsQuery.data ?? []) : mockAnnouncements;
  const latestAnnouncement = announcementList[0];

  // トップの「にぎわい」— 同時接続人数・今日の新着・最近のうごき・急上昇作品。
  // いずれも実データが無い/空でも嘘の数字は出さず、正直な0や実カウントを表示する。
  const presenceCount = usePresenceCount(user?.id);
  const viewerCount = configured ? (presenceCount ?? 1) : 8;
  const todayStatsQuery = useTodayStats();
  const todayStats = configured ? (todayStatsQuery.data ?? { newAwase: 0, newRsvps: 0 }) : { newAwase: 3, newRsvps: 14 };
  const activityQuery = useRecentActivity(6);
  const activityList = configured
    ? (activityQuery.data ?? []).map((a) => ({ key: a.id, headline: a.headline, timeLabel: formatRelativeTime(a.createdAt) }))
    : mockActivity;
  const trendingQuery = useTrendingWorks();
  const trendingList = configured
    ? (trendingQuery.data ?? []).map((w) => ({ key: w.workId, name: w.name, count: w.awaseCount }))
    : mockTrendingWorks;
  // Nearest upcoming events. The query returns them ordered by start date
  // (starts_on asc), so after dropping ones already past we can take the first
  // few — that's the "近日開催" list. Mock events (no startsOn) are kept as-is.
  const eventsQuery = useEvents();
  const eventsReal = configured ? eventsQuery.data : undefined;
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);
  const homeEvents = (configured ? (eventsQuery.data ?? []) : mockEvents)
    .filter((e) => !e.startsOn || new Date(e.startsOn) >= todayStart)
    .slice(0, 3);
  // 「はじめてさん歓迎」= 初心者歓迎(beginner_ok)の併せ。未接続時はモックから代替。
  const beginnerQuery = useBeginnerAwase(moderation.data);
  const beginnerReal = configured ? beginnerQuery.data : undefined;
  const beginnerFromMock = homeAwase.filter((a) => a.tag.includes("初心者"));
  const beginnerList = configured
    ? (beginnerQuery.data ?? [])
    : beginnerFromMock.length
      ? beginnerFromMock
      : homeAwase.slice(0, 4);

  return (
    <div>
      {/* app bar */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          padding: "12px 22px",
        }}
      >
        <button
          onClick={() => nav("home", "home")}
          aria-label="ホーム"
          style={{
            display: "flex",
            alignItems: "center",
            gap: 9,
            border: "none",
            background: "none",
            padding: 0,
            cursor: "pointer",
            fontFamily: "inherit",
            textAlign: "left",
          }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/logo.png"
            alt=""
            width={32}
            height={32}
            style={{ width: 32, height: 32, borderRadius: "50%", display: "block", flex: "0 0 auto" }}
          />
          <div>
            <span
              style={{
                display: "block",
                fontSize: 20,
                fontWeight: 700,
                letterSpacing: ".06em",
                color: colors.textPrimaryAlt,
                lineHeight: 1.05,
              }}
            >
              プルミエ<span style={{ color: colors.pink }}>！</span>
            </span>
            <span style={{ display: "block", fontSize: 9.5, color: colors.textMutedAlt, marginTop: 2, letterSpacing: ".01em" }}>
              {siteTagline}
            </span>
          </div>
        </button>
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <button
            onClick={() => nav("messages")}
            style={{ background: "none", border: "none", cursor: "pointer", padding: 0 }}
            aria-label="メッセージ"
          >
            <MessageIcon />
          </button>
          <button
            onClick={() => nav("notify", "notify")}
            style={{ background: "none", border: "none", cursor: "pointer", padding: 0 }}
            aria-label="おしらせ"
          >
            <BellIcon />
          </button>
        </div>
      </div>

      {/* welcome banner — first-visit greeting, dismissible */}
      <WelcomeBanner />

      {/* はじめてガイド（3ステップ進捗）— 準備が整うと自動で消える */}
      <StarterGuide />

      {/* search entry */}
      <div style={{ padding: "12px 22px 0" }}>
        <button
          onClick={() => nav("search", "search")}
          style={{
            width: "100%",
            display: "flex",
            alignItems: "center",
            gap: 11,
            border: "1px solid #E9E5F1",
            borderRadius: 15,
            padding: "13px 15px",
            background: colors.primaryBg4,
            cursor: "pointer",
            fontFamily: "inherit",
          }}
        >
          <SearchIcon />
          <span style={{ fontSize: 14, color: "#AFAABB" }}>作品・キャラで仲間を探す</span>
        </button>
      </div>

      {/* latest announcement strip — conveys the service is actively operated */}
      {latestAnnouncement && (
        <div style={{ padding: "12px 22px 0" }}>
          <button
            onClick={() => nav("announcements")}
            style={{
              width: "100%",
              display: "flex",
              alignItems: "center",
              gap: 10,
              border: `1px solid ${colors.borderSoft}`,
              borderRadius: 13,
              padding: "11px 13px",
              background: colors.primaryBg5,
              cursor: "pointer",
              fontFamily: "inherit",
              textAlign: "left",
            }}
          >
            <span
              style={{
                flex: "0 0 auto",
                fontSize: 9.5,
                fontWeight: 700,
                color: colors.primary,
                background: colors.primaryBg1,
                padding: "4px 9px",
                borderRadius: 999,
              }}
            >
              お知らせ
            </span>
            <span
              style={{
                flex: 1,
                minWidth: 0,
                fontSize: 12,
                fontWeight: 600,
                color: colors.textPrimary,
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
              }}
            >
              {latestAnnouncement.title}
            </span>
            <span style={{ flex: "0 0 auto", fontSize: 10.5, color: colors.textMutedAlt }}>
              {formatRelativeTime(latestAnnouncement.publishedAt)}
            </span>
          </button>
        </div>
      )}

      {/* にぎわい — 同時接続人数・今日の新着・最近のうごき */}
      <div style={{ padding: "16px 22px 0" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8, flexWrap: "wrap" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <span
              style={{
                width: 7,
                height: 7,
                borderRadius: "50%",
                background: colors.positive,
                display: "inline-block",
              }}
            />
            <span style={{ fontSize: 11.5, fontWeight: 600, color: colors.textSecondary }}>
              いま{viewerCount}人が見ています
            </span>
          </div>
          <span style={{ fontSize: 11, color: colors.textMutedAlt }}>
            今日 併せ{todayStats.newAwase}件・参加{todayStats.newRsvps}件
          </span>
        </div>

        {activityList.length > 0 && (
          <div
            style={{
              marginTop: 10,
              border: `1px solid ${colors.borderSoft}`,
              borderRadius: 14,
              padding: "4px 13px",
              background: colors.primaryBg5,
            }}
          >
            {activityList.slice(0, 4).map((a) => (
              <div
                key={a.key}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  padding: "8px 0",
                  borderTop: `1px solid ${colors.borderSofter}`,
                }}
              >
                <span
                  style={{
                    flex: 1,
                    minWidth: 0,
                    fontSize: 12,
                    color: colors.textSecondary,
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                  }}
                >
                  {a.headline}
                </span>
                <span style={{ flex: "0 0 auto", fontSize: 10, color: colors.textMutedAlt }}>{a.timeLabel}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 急上昇の作品 — 直近7日で新規募集が多い作品 */}
      {trendingList.length > 0 && (
        <div style={{ padding: "18px 0 0" }}>
          <div style={{ padding: "0 22px", fontSize: 13, fontWeight: 700, color: colors.textPrimary }}>
            急上昇の作品
          </div>
          <div
            className="noscroll"
            style={{ display: "flex", gap: 8, overflowX: "auto", padding: "10px 22px 0" }}
          >
            {trendingList.map((w, i) => (
              <button
                key={w.key}
                onClick={() => openSearch(w.name)}
                style={{
                  flex: "0 0 auto",
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                  border: `1px solid ${colors.borderSoft}`,
                  borderRadius: 999,
                  padding: "8px 14px",
                  background: colors.white,
                  cursor: "pointer",
                  fontFamily: "inherit",
                  whiteSpace: "nowrap",
                }}
              >
                <span style={{ fontSize: 11, fontWeight: 700, color: colors.pinkText }}>{i + 1}</span>
                <span style={{ fontSize: 12.5, fontWeight: 600, color: colors.textPrimary }}>{w.name}</span>
                <span style={{ fontSize: 10.5, color: colors.textMutedAlt }}>{w.count}件</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* feature shortcuts */}
      <div style={{ display: "flex", gap: 10, padding: "16px 22px 0" }}>
        {shortcuts.map((s) => (
          <button
            key={s.key}
            onClick={() => nav(s.key)}
            style={{
              flex: 1,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: 7,
              border: `1px solid ${colors.borderSoft}`,
              borderRadius: 16,
              padding: "14px 0",
              background: colors.primaryBg5,
              cursor: "pointer",
              fontFamily: "inherit",
            }}
          >
            <span
              style={{
                width: 40,
                height: 40,
                borderRadius: 12,
                background: colors.white,
                border: `1px solid ${colors.borderSoft}`,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              {s.icon}
            </span>
            <span style={{ fontSize: 11.5, fontWeight: 600, color: colors.textSecondary }}>{s.label}</span>
          </button>
        ))}
      </div>

      {/* プルミエ！ピックアップ — 運営キュレーションのレイヤー写真ショーケース */}
      <HomePickup />

      {/* popular works */}
      <div style={{ padding: "22px 0 0" }}>
        <div style={{ padding: "0 22px", fontSize: 13, fontWeight: 700, color: colors.textPrimary }}>
          人気の作品から探す
        </div>
        <div
          className="noscroll"
          style={{ display: "flex", gap: 10, overflowX: "auto", padding: "12px 22px 0" }}
        >
          {popularWorks.map((w) => (
            <button
              key={w}
              onClick={() => openSearch(w)}
              style={{
                flex: "0 0 auto",
                width: 128,
                height: 76,
                padding: 0,
                border: "none",
                background: "none",
                cursor: "pointer",
                fontFamily: "inherit",
              }}
            >
              <WorkCover name={w} radius={14} />
            </button>
          ))}
        </div>
      </div>

      {/* はじめてさん歓迎レーン — 初心者歓迎の併せを横並びで */}
      {beginnerList.length > 0 && (
        <div style={{ padding: "26px 0 0" }}>
          <div style={{ padding: "0 22px", display: "flex", alignItems: "center", gap: 7 }}>
            <span style={{ fontSize: 15 }}>🔰</span>
            <span style={{ fontSize: 13, fontWeight: 700, color: colors.textPrimary }}>はじめてさん歓迎の募集</span>
          </div>
          <div className="noscroll" style={{ display: "flex", gap: 12, overflowX: "auto", padding: "12px 22px 0" }}>
            {beginnerList.map((a) => (
              <button
                key={a.key}
                onClick={() => (beginnerReal ? openAwase(a.key) : nav("detail"))}
                style={{
                  flex: "0 0 auto",
                  width: 210,
                  border: `1px solid ${colors.borderSoft}`,
                  borderRadius: 16,
                  padding: 10,
                  background: colors.white,
                  cursor: "pointer",
                  fontFamily: "inherit",
                  textAlign: "left",
                }}
              >
                <div style={{ height: 96, position: "relative" }}>
                  <AwaseCover radius={12} coverUrl={a.coverUrl} work={a.work} />
                  <span
                    style={{
                      position: "absolute",
                      left: 8,
                      top: 8,
                      fontSize: 10,
                      fontWeight: 700,
                      color: colors.white,
                      background: "rgba(109,93,171,.92)",
                      padding: "3px 9px",
                      borderRadius: 999,
                    }}
                  >
                    初心者歓迎
                  </span>
                </div>
                <div style={{ fontSize: 13, fontWeight: 700, color: colors.textPrimary, marginTop: 9, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {a.title}
                </div>
                <div style={{ fontSize: 11, color: colors.textMutedAlt, marginTop: 3, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {a.work}
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 7, marginTop: 6, flexWrap: "wrap" }}>
                  {a.region && (
                    <span
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: 3,
                        fontSize: 10,
                        fontWeight: 600,
                        color: colors.primary,
                        background: colors.primaryBg5,
                        padding: "2px 8px 2px 6px",
                        borderRadius: 999,
                      }}
                    >
                      <PinIcon />
                      {a.region}
                    </span>
                  )}
                  <span style={{ fontSize: 11, color: colors.textSecondaryAlt }}>{a.date}</span>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* 併せ募集 */}
      <div style={{ padding: "26px 0 0" }}>
        <div style={{ padding: "0 22px" }}>
          <SectionHeading
            accent={colors.pink}
            right={
              <button
                onClick={() => nav("search", "search")}
                style={{
                  background: "none",
                  border: "none",
                  fontSize: 12,
                  color: colors.primary,
                  cursor: "pointer",
                  fontFamily: "inherit",
                }}
              >
                すべて →
              </button>
            }
          >
            併せ・合わせ募集
          </SectionHeading>
        </div>
        {feedLoading && (
          <div style={{ padding: "60px 22px", textAlign: "center", fontSize: 13, color: colors.textMutedAlt }}>読み込み中…</div>
        )}
        {feedEmpty && (
          <EmptyState
            icon="🎬"
            title="まだ募集がありません"
            body="いちばん乗りで併せを募集してみましょう。あなたの投稿がここに表示されます。"
            action={
              <button
                onClick={() => nav("create")}
                style={{
                  border: "none",
                  background: colors.primary,
                  color: colors.white,
                  fontFamily: "inherit",
                  fontSize: 13,
                  fontWeight: 700,
                  padding: "10px 20px",
                  borderRadius: 999,
                  cursor: "pointer",
                }}
              >
                併せを募集する
              </button>
            }
          />
        )}
        <div
          style={{
            padding: "15px 22px 0",
          }}
          className="pt-grid"
        >
          {awaseList.map((a) => (
            <button
              key={a.key}
              onClick={() => (configured && feed.data ? openAwase(a.key) : nav("detail"))}
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
              <div style={{ flex: "0 0 84px", height: 84 }}>
                <AwaseCover radius={13} coverUrl={a.coverUrl} work={a.work} />
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    gap: 8,
                  }}
                >
                  <span style={{ fontSize: 14, fontWeight: 700, color: colors.textPrimary }}>
                    {a.title}
                  </span>
                  <span
                    style={{
                      fontSize: 10,
                      fontWeight: 600,
                      color: colors.pinkText,
                      background: colors.pinkBg1,
                      padding: "3px 8px",
                      borderRadius: 999,
                      whiteSpace: "nowrap",
                    }}
                  >
                    {a.tag}
                  </span>
                </div>
                <div style={{ fontSize: 11.5, color: colors.textMutedAlt, marginTop: 4 }}>
                  {a.work}
                </div>
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                    marginTop: 8,
                    fontSize: 11,
                    color: colors.textSecondaryAlt,
                    flexWrap: "wrap",
                  }}
                >
                  {a.region && (
                    <span
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: 3,
                        fontSize: 10,
                        fontWeight: 600,
                        color: colors.primary,
                        background: colors.primaryBg5,
                        padding: "3px 8px 3px 6px",
                        borderRadius: 999,
                      }}
                    >
                      <PinIcon />
                      {a.region}
                    </span>
                  )}
                  <span>{a.date}</span>
                  <span>{a.place}</span>
                </div>
                <div
                  style={{
                    fontSize: 11.5,
                    color: colors.primary,
                    marginTop: 7,
                    fontWeight: 600,
                  }}
                >
                  {a.members}
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* upcoming events — a few from the curated calendar */}
      {homeEvents.length > 0 && (
        <div style={{ padding: "26px 0 0" }}>
          <div style={{ padding: "0 22px" }}>
            <SectionHeading
              accent={colors.primary}
              right={
                <button
                  onClick={() => nav("events")}
                  style={{ background: "none", border: "none", fontSize: 12, color: colors.primary, cursor: "pointer", fontFamily: "inherit" }}
                >
                  すべて見る →
                </button>
              }
            >
              近日開催のイベント
            </SectionHeading>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 10, padding: "14px 22px 0" }}>
            {homeEvents.map((ev, i) => {
              // 先頭が最も直近（starts_on 昇順・過去除外済み）。1枚だけハイライトする。
              const isNearest = i === 0;
              return (
              <button
                key={ev.key}
                onClick={() => (eventsReal ? openEvent(ev.key) : nav("eventDetail"))}
                style={{
                  display: "flex",
                  gap: 13,
                  alignItems: "center",
                  border: isNearest ? `1.5px solid ${colors.primary}` : `1px solid ${colors.borderSoft}`,
                  borderRadius: 16,
                  padding: isNearest ? 12.5 : 13,
                  background: isNearest ? colors.primaryBg5 : colors.white,
                  boxShadow: isNearest ? "0 4px 14px rgba(109,93,171,.14)" : "none",
                  cursor: "pointer",
                  fontFamily: "inherit",
                  textAlign: "left",
                  width: "100%",
                }}
              >
                {/* サムネイル — 許諾済みの画像 or イベント名から生成したデザイン */}
                <div style={{ flex: "0 0 54px", width: 54, height: 54, borderRadius: 13, overflow: "hidden" }}>
                  {ev.imageUrl ? (
                    <ImageSlot radius={13} src={ev.imageUrl} />
                  ) : (
                    <WorkCover name={ev.name} radius={13} showName={false} />
                  )}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  {isNearest && (
                    <span
                      style={{
                        display: "inline-block",
                        fontSize: 9.5,
                        fontWeight: 700,
                        color: colors.white,
                        background: colors.primary,
                        padding: "2px 8px",
                        borderRadius: 999,
                        marginBottom: 5,
                      }}
                    >
                      いちばん近い開催
                    </span>
                  )}
                  <div style={{ fontSize: 13.5, fontWeight: 700, color: colors.textPrimary, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {ev.name}
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 4, marginTop: 5, fontSize: 11, color: "#877FA0" }}>
                    <CalendarIcon size={12} />
                    <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{ev.date}</span>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 4, marginTop: 4, fontSize: 11, color: "#877FA0" }}>
                    <PinIcon />
                    <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{ev.venue}</span>
                  </div>
                </div>
              </button>
              );
            })}
          </div>
        </div>
      )}

      {/* 安心して参加できる仕組み — 実装済みの安全機能を新規ユーザーに一枚で伝える */}
      <SafetySection />

      {/* posts — 実投稿フィード未接続のため本番(configured)では非表示。
          プロトタイプ表示用にモックのみ残す。実装時にここを実データへ差し替える。 */}
      {!configured && (
      <div style={{ padding: "28px 0 30px" }}>
        <div style={{ padding: "0 22px" }}>
          <SectionHeading accent={colors.primary}>みんなの投稿</SectionHeading>
        </div>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
            gap: 6,
            padding: "14px 22px 0",
          }}
        >
          {homePosts.map((p) => (
            <div key={p.key} style={{ position: "relative", height: 104 }}>
              <ImageSlot radius={12} />
              <span
                style={{
                  position: "absolute",
                  left: 6,
                  bottom: 6,
                  display: "flex",
                  alignItems: "center",
                  gap: 3,
                  fontSize: 9,
                  fontWeight: 600,
                  color: colors.white,
                  background: "rgba(42,38,52,.5)",
                  padding: "2px 7px",
                  borderRadius: 999,
                }}
              >
                <HeartIcon />
                {p.likes}
              </span>
            </div>
          ))}
        </div>
      </div>
      )}
    </div>
  );
}
