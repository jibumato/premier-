"use client";

import { colors } from "@/lib/tokens";
import { homeAwase, homePosts, popularWorks } from "@/lib/data";
import { useRouter } from "../AppRouter";
import { ImageSlot } from "../ImageSlot";
import { SectionHeading } from "../ui";
import { BellIcon, HeartIcon, SearchIcon } from "../icons";

export function HomeScreen() {
  const { nav } = useRouter();

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
        <div
          style={{
            fontSize: 20,
            fontWeight: 700,
            letterSpacing: ".06em",
            color: colors.textPrimaryAlt,
          }}
        >
          プルミエ<span style={{ color: colors.pink }}>！</span>
        </div>
        <button
          onClick={() => nav("notify", "notify")}
          style={{ background: "none", border: "none", cursor: "pointer", padding: 0 }}
          aria-label="おしらせ"
        >
          <BellIcon />
        </button>
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
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: 12,
            padding: "15px 22px 0",
          }}
        >
          {homeAwase.map((a) => (
            <button
              key={a.key}
              onClick={() => nav("detail")}
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
