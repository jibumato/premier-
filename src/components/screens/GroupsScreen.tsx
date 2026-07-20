"use client";

import { useState } from "react";
import { colors } from "@/lib/tokens";
import { regions } from "@/lib/data";
import { useRouter } from "../AppRouter";
import { AppBar, SectionHeading } from "../ui";
import { UsersIcon, PinIcon, ChevronRightIcon } from "../icons";
import { EmptyState } from "../EmptyState";
import { useAuth } from "@/lib/auth/useAuth";
import { useWorks } from "@/lib/queries/works";
import { useCreateGroup, useGroups, useMyGroups, type GroupListItem } from "@/lib/queries/groups";
import { useModerationFilter } from "@/lib/queries/moderation";
import { isSupabaseConfigured } from "@/lib/supabase/config";

const creatableRegions = regions.filter((r) => r !== "すべて");

const inputStyle = {
  border: `1px solid ${colors.border}`,
  borderRadius: 12,
  padding: "11px 13px",
  fontSize: 13,
  fontFamily: "inherit",
  outline: "none",
  background: colors.white,
  width: "100%",
} as const;

// プレビュー（未接続）で空にならないためのサンプル。
const mockGroups: GroupListItem[] = [
  { id: "m1", name: "関西プリキュアレイヤー会", description: "関西でプリキュア併せを定期開催しています。初心者歓迎！", work: "プリキュア", region: "大阪", memberCount: 42 },
  { id: "m2", name: "東京・週末スタジオ撮影部", description: "毎週末どこかのスタジオで撮影しています。", work: null, region: "東京", memberCount: 88 },
];

function GroupCard({ g, onClick }: { g: GroupListItem; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      style={{
        display: "flex",
        alignItems: "center",
        gap: 12,
        border: `1px solid ${colors.borderSoft}`,
        borderRadius: 16,
        padding: "13px 14px",
        background: colors.white,
        width: "100%",
        textAlign: "left",
        fontFamily: "inherit",
        cursor: "pointer",
      }}
    >
      <div
        style={{
          flex: "0 0 44px",
          width: 44,
          height: 44,
          borderRadius: 13,
          background: colors.primaryBg5,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <UsersIcon size={22} color={colors.primary} />
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 13.5, fontWeight: 700, color: colors.textPrimary, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
          {g.name}
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 3, flexWrap: "wrap" }}>
          {g.work && <span style={{ fontSize: 10.5, color: colors.primary, fontWeight: 600 }}>{g.work}</span>}
          {g.region && (
            <span style={{ display: "inline-flex", alignItems: "center", gap: 2, fontSize: 10.5, color: colors.textMutedAlt }}>
              <PinIcon size={10} /> {g.region}
            </span>
          )}
          <span style={{ fontSize: 10.5, color: colors.textMutedAlt }}>{g.memberCount}人</span>
        </div>
      </div>
      <ChevronRightIcon />
    </button>
  );
}

export function GroupsScreen() {
  const { back, nav, openGroup } = useRouter();
  const { user } = useAuth();
  const configured = isSupabaseConfigured();

  const moderation = useModerationFilter(user?.id);
  const [keyword, setKeyword] = useState("");
  const groupsQuery = useGroups(keyword, moderation.data);
  const myGroupsQuery = useMyGroups(user?.id);
  const worksQuery = useWorks();
  const createGroup = useCreateGroup();

  const real = configured ? groupsQuery.data : undefined;
  const groups = real ?? (configured ? [] : mockGroups);
  const myGroups = configured ? (myGroupsQuery.data ?? []) : [];
  const loading = configured && groupsQuery.isPending && !groupsQuery.data;
  const works = worksQuery.data ?? [];

  const [creating, setCreating] = useState(false);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [workId, setWorkId] = useState("");
  const [region, setRegion] = useState("");

  const resetForm = () => {
    setCreating(false);
    setName("");
    setDescription("");
    setWorkId("");
    setRegion("");
  };

  const handleCreateClick = () => {
    if (configured && !user) {
      nav("login");
      return;
    }
    setCreating((v) => !v);
  };

  const canSubmit = Boolean(name.trim());
  const handleSubmit = () => {
    if (!user || !canSubmit || createGroup.isPending) return;
    createGroup.mutate(
      {
        ownerId: user.id,
        name: name.trim(),
        description: description.trim(),
        workId: workId || null,
        region,
      },
      {
        onSuccess: (id) => {
          resetForm();
          openGroup(id);
        },
      },
    );
  };

  const handleOpen = (id: string) => {
    if (real) openGroup(id);
  };

  return (
    <div>
      <AppBar
        title="サークル（常設グループ）"
        onBack={back}
        right={
          <button
            onClick={handleCreateClick}
            style={{
              border: "none",
              background: colors.primary,
              color: colors.white,
              fontFamily: "inherit",
              fontSize: 11.5,
              fontWeight: 700,
              padding: "6px 12px",
              borderRadius: 999,
              cursor: "pointer",
              whiteSpace: "nowrap",
            }}
          >
            作る
          </button>
        }
      />

      <div style={{ padding: "6px 22px 0" }}>
        <div
          style={{
            fontSize: 11,
            color: colors.textMutedAlt,
            background: colors.primaryBg4,
            border: `1px solid ${colors.borderSoft}`,
            borderRadius: 12,
            padding: "10px 12px",
            lineHeight: 1.6,
          }}
        >
          作品・地域ごとの常設サークル。繰り返し一緒に活動する仲間を見つけて、併せの相談やイベント参加を続けやすくします。
        </div>
      </div>

      {creating && (
        <div style={{ padding: "12px 22px 0" }}>
          <div
            style={{
              border: `1px solid ${colors.borderSoft}`,
              borderRadius: 16,
              padding: 15,
              background: colors.primaryBg5,
              display: "flex",
              flexDirection: "column",
              gap: 10,
            }}
          >
            <input value={name} onChange={(e) => setName(e.target.value)} maxLength={40} placeholder="サークル名（例: 関西プリキュアレイヤー会）" style={inputStyle} />
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              maxLength={500}
              placeholder="活動内容・方針・参加条件など"
              rows={3}
              style={{ ...inputStyle, lineHeight: 1.7, resize: "none" }}
            />
            <div style={{ display: "flex", gap: 8 }}>
              <select value={workId} onChange={(e) => setWorkId(e.target.value)} style={{ ...inputStyle, color: workId ? colors.textPrimary : colors.textMutedAlt }}>
                <option value="">作品（任意）</option>
                {works.map((w) => (
                  <option key={w.id} value={w.id} style={{ color: colors.textPrimary }}>
                    {w.name}
                  </option>
                ))}
              </select>
              <select value={region} onChange={(e) => setRegion(e.target.value)} style={{ ...inputStyle, color: region ? colors.textPrimary : colors.textMutedAlt }}>
                <option value="">地域（任意）</option>
                {creatableRegions.map((r) => (
                  <option key={r} value={r} style={{ color: colors.textPrimary }}>
                    {r}
                  </option>
                ))}
              </select>
            </div>
            <div style={{ display: "flex", gap: 8 }}>
              <button
                onClick={resetForm}
                style={{ flex: 1, border: `1px solid ${colors.border}`, background: colors.white, color: colors.textSecondary, fontFamily: "inherit", fontSize: 12.5, fontWeight: 600, padding: "10px 0", borderRadius: 11, cursor: "pointer" }}
              >
                キャンセル
              </button>
              <button
                onClick={handleSubmit}
                disabled={!canSubmit || createGroup.isPending}
                style={{ flex: 2, border: "none", background: colors.primary, color: colors.white, fontFamily: "inherit", fontSize: 12.5, fontWeight: 700, padding: "10px 0", borderRadius: 11, cursor: "pointer", opacity: canSubmit && !createGroup.isPending ? 1 : 0.5 }}
              >
                {createGroup.isPending ? "作成中…" : "サークルを作る"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 検索 */}
      <div style={{ padding: "14px 22px 0" }}>
        <input value={keyword} onChange={(e) => setKeyword(e.target.value)} placeholder="サークル名・作品で探す" style={inputStyle} />
      </div>

      {myGroups.length > 0 && !keyword && (
        <div style={{ padding: "18px 22px 0" }}>
          <SectionHeading size={15}>参加中のサークル</SectionHeading>
          <div style={{ display: "flex", flexDirection: "column", gap: 9, marginTop: 12 }}>
            {myGroups.map((g) => (
              <GroupCard key={g.id} g={g} onClick={() => handleOpen(g.id)} />
            ))}
          </div>
        </div>
      )}

      <div style={{ padding: "18px 22px 30px" }}>
        <SectionHeading size={15}>{keyword ? "検索結果" : "サークルを探す"}</SectionHeading>
        {loading ? (
          <div style={{ padding: "30px 0", textAlign: "center", fontSize: 13, color: colors.textMutedAlt }}>読み込み中…</div>
        ) : groups.length === 0 ? (
          keyword ? (
            <p style={{ margin: "14px 0 0", fontSize: 12.5, color: colors.textMutedAlt, lineHeight: 1.8 }}>
              「{keyword}」に合うサークルは見つかりませんでした。
            </p>
          ) : (
            <div style={{ marginTop: 8 }}>
              <EmptyState icon="👥" title="まだサークルがありません" body="右上の「作る」から、あなたの作品・地域のサークルを最初に立ち上げてみましょう。" />
            </div>
          )
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 9, marginTop: 12 }}>
            {groups.map((g) => (
              <GroupCard key={g.id} g={g} onClick={() => handleOpen(g.id)} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
