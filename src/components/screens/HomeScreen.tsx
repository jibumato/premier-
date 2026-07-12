"use client";

import { colors } from "@/lib/tokens";
import { homeAwase, homePosts, popularWorks } from "@/lib/data";
import { useRouter } from "../AppRouter";
import { ImageSlot } from "../ImageSlot";
import { SectionHeading } from "../ui";
import { BellIcon, CalendarIcon, HeartIcon, HelpIcon, MessageIcon, SearchIcon } from "../icons";
import { useAwaseFeed } from "@/lib/queries/awase";
import { useModerationFilter } from "@/lib/queries/moderation";
import { useAnnouncements } from "@/lib/queries/announcements";
import { useAuth } from "@/lib/auth/useAuth";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { formatRelativeTime } from "@/lib/format";
import { announcements as mockAnnouncements } from "@/lib/data";
import { EmptyState } from "../EmptyState";
import type { Screen } from "@/lib/types";

const shortcuts: { key: Screen; label: string; icon: React.ReactNode }[] = [
  // フリマ（衣装売買）はローンチ時は非表示。画面・ルート・DB は残してあるので、
  // 再開時は下行のコメントを外すだけで復活する。
  // { key: "market", label: "フリマ", icon: <BagIcon size={22} /> },
  { key: "events", label: "イベント", icon: <CalendarIcon size={22} /> },
  { key: "qa", label: "知恵袋", icon: <HelpIcon size={22} /> },
];

export function HomeScreen() {
  const { nav, openAwase } = useRouter();
  const { user } = useAuth();
  const configured = isSupabaseConfigured();
  const moderation = useModerationFilter(user?.id);
  const feed = useAwaseFeed(moderation.data);
  // Real feed once connected and loaded; the handoff's mock list otherwise —
  // same AwaseCard shape, so the card markup below never branches.
  const awaseList = configured && feed.data ? feed.data : homeAwase;
  const feedEmpty = configured && feed.data?.length === 0;
  const announcementsQuery = useAnnouncements();
  const announcementList = configured && announcementsQuery.data ? announcementsQuery.data : mockAnnouncements;
  const latestAnnouncement = announcementList[0];

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
        <div style={{ display: "flex", alignItems: "center", gap: 9 }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/logo.png"
            alt=""
            width={30}
            height={30}
            style={{ width: 30, height: 30, borderRadius: "50%", display: "block" }}
          />
          <span
            style={{
              fontSize: 20,
              fontWeight: 700,
              letterSpacing: ".06em",
              color: colors.textPrimaryAlt,
            }}
          >
            プルミエ<span style={{ color: colors.pink }}>！</span>
          </span>
        </div>
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

      {/* search entry */}
      <div style={{ padding: "0 22px" }}>
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

      {/* popular works */}
      <div style={{ padding: "22px 0 0" }}>
        <div style={{ padding: "0 22px", fontSize: 13, fontWeight: 700, color: colors.textPrimary }}>
          人気の作品から探す
        </div>
        <div
          className="noscroll"
          style={{ display: "flex", gap: 8, overflowX: "auto", padding: "12px 22px 0" }}
        >
          {popularWorks.map((w) => (
            <button
              key={w}
              onClick={() => nav("search", "search")}
              style={{
                flex: "0 0 auto",
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
                <ImageSlot radius={13} />
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
                    gap: 12,
                    marginTop: 8,
                    fontSize: 11,
                    color: colors.textSecondaryAlt,
                  }}
                >
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

      {/* posts */}
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
    </div>
  );
}
