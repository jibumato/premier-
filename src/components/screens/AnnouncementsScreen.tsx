"use client";

import { colors } from "@/lib/tokens";
import { announcements as mockAnnouncements } from "@/lib/data";
import { formatRelativeTime } from "@/lib/format";
import { useRouter } from "../AppRouter";
import { AppBar } from "../ui";
import { useAnnouncements } from "@/lib/queries/announcements";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { EmptyState } from "../EmptyState";
import type { AnnouncementCategory } from "@/lib/types";

const categoryLabel: Record<AnnouncementCategory, string> = {
  news: "お知らせ",
  update: "アップデート",
  maintenance: "メンテナンス",
};

const categoryStyle: Record<AnnouncementCategory, { color: string; bg: string }> = {
  news: { color: colors.pinkText, bg: colors.pinkBg1 },
  update: { color: colors.primary, bg: colors.primaryBg1 },
  maintenance: { color: colors.positive, bg: "#E7F4EC" },
};

export function AnnouncementsScreen() {
  const { back } = useRouter();
  const configured = isSupabaseConfigured();

  const query = useAnnouncements();
  // Real announcements once connected and loaded; the mock list otherwise —
  // same Announcement shape either way.
  const real = configured ? query.data : undefined;
  const items = real ?? mockAnnouncements;
  const isEmpty = Boolean(real) && items.length === 0;

  return (
    <div>
      <AppBar title="お知らせ・更新履歴" onBack={back} />

      {isEmpty && (
        <EmptyState
          icon="📣"
          title="まだお知らせはありません"
          body="サービスの更新情報やお知らせを、ここでお届けします。"
        />
      )}

      <div style={{ padding: "12px 22px 30px" }} className="pt-grid">
        {items.map((a) => {
          const cat = categoryStyle[a.category] ?? categoryStyle.update;
          return (
            <div
              key={a.key}
              style={{
                border: `1px solid ${colors.borderSoft}`,
                borderRadius: 16,
                padding: 16,
                background: colors.white,
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <span
                  style={{
                    fontSize: 10.5,
                    fontWeight: 700,
                    color: cat.color,
                    background: cat.bg,
                    padding: "3px 9px",
                    borderRadius: 999,
                  }}
                >
                  {categoryLabel[a.category] ?? "アップデート"}
                </span>
                <span style={{ fontSize: 11, color: colors.textMutedAlt }}>
                  {formatRelativeTime(a.publishedAt)}
                </span>
              </div>
              <div
                style={{
                  fontSize: 14.5,
                  fontWeight: 700,
                  color: colors.textPrimary,
                  lineHeight: 1.5,
                  marginTop: 10,
                }}
              >
                {a.title}
              </div>
              {a.body && (
                <p
                  style={{
                    margin: "7px 0 0",
                    fontSize: 12.5,
                    color: colors.textSecondary,
                    lineHeight: 1.8,
                    whiteSpace: "pre-wrap",
                  }}
                >
                  {a.body}
                </p>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
