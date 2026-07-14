"use client";

import { useState } from "react";
import { colors } from "@/lib/tokens";
import { SectionHeading } from "./ui";
import {
  useAddScheduleOption,
  useCastScheduleVote,
  useDecideScheduleOption,
  useDeleteScheduleOption,
  useScheduleOptions,
  type ScheduleMark,
  type ScheduleOption,
} from "@/lib/queries/schedule";

const MARKS: { mark: ScheduleMark; label: string }[] = [
  { mark: "yes", label: "○" },
  { mark: "maybe", label: "△" },
  { mark: "no", label: "×" },
];

/**
 * 併せ詳細の「日程調整」セクション（調整さん風の○△×投票）。
 * 候補日の管理はホストのみ、回答はホスト＋承認済みメンバー（RLSでも強制）。
 * 候補・回答の閲覧は誰でも可能（回答者は承認済みメンバーのみなので、
 * 応募者の身元が漏れることはない）。
 */
export function ScheduleSection({
  awaseId,
  isHost,
  canVote,
  userId,
}: {
  awaseId: string;
  isHost: boolean;
  /** ホスト or 承認済み（accepted/done）メンバー */
  canVote: boolean;
  userId: string | undefined;
}) {
  const optionsQuery = useScheduleOptions(awaseId);
  const addOption = useAddScheduleOption();
  const [draft, setDraft] = useState("");
  const [error, setError] = useState<string | null>(null);

  const options = optionsQuery.data ?? [];

  // 候補が無く、ホストでもなければセクションごと出さない（画面を汚さない）
  if (options.length === 0 && !isHost) return null;

  const handleAdd = () => {
    const label = draft.trim();
    if (!label || addOption.isPending) return;
    setError(null);
    addOption.mutate(
      { awaseId, label },
      {
        onSuccess: () => setDraft(""),
        onError: () => setError("候補日を追加できませんでした"),
      },
    );
  };

  return (
    <div style={{ padding: "24px 22px 0" }}>
      <SectionHeading size={15}>日程調整</SectionHeading>
      <div style={{ fontSize: 11.5, color: colors.textMutedAlt, lineHeight: 1.7, marginTop: 8 }}>
        {canVote
          ? "参加できる日に ○△× で回答してください（もう一度押すと取り消し）。"
          : "回答はホストと承認済みメンバーができます。"}
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 10, marginTop: 12 }}>
        {options.map((o) => (
          <OptionCard key={o.id} option={o} awaseId={awaseId} isHost={isHost} canVote={canVote} userId={userId} />
        ))}
      </div>

      {isHost && (
        <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
          <input
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            placeholder="候補日を追加（例: 8/9(土) 午後）"
            maxLength={60}
            style={{
              flex: 1,
              minWidth: 0,
              border: `1px solid ${colors.border}`,
              borderRadius: 11,
              padding: "11px 13px",
              fontSize: 13,
              fontFamily: "inherit",
              outline: "none",
              background: colors.white,
            }}
          />
          <button
            onClick={handleAdd}
            disabled={!draft.trim() || addOption.isPending}
            style={{
              flex: "0 0 auto",
              border: "none",
              background: colors.primary,
              color: colors.white,
              fontFamily: "inherit",
              fontSize: 12.5,
              fontWeight: 700,
              padding: "0 18px",
              borderRadius: 11,
              cursor: "pointer",
              opacity: !draft.trim() || addOption.isPending ? 0.5 : 1,
            }}
          >
            追加
          </button>
        </div>
      )}
      {error && <div style={{ fontSize: 11.5, color: "#C0453F", marginTop: 8 }}>{error}</div>}
    </div>
  );
}

function OptionCard({
  option,
  awaseId,
  isHost,
  canVote,
  userId,
}: {
  option: ScheduleOption;
  awaseId: string;
  isHost: boolean;
  canVote: boolean;
  userId: string | undefined;
}) {
  const cast = useCastScheduleVote();
  const decide = useDecideScheduleOption();
  const del = useDeleteScheduleOption();
  const busy = cast.isPending || decide.isPending || del.isPending;

  const myMark = userId ? (option.votes.find((v) => v.userId === userId)?.mark ?? null) : null;
  const count = (m: ScheduleMark) => option.votes.filter((v) => v.mark === m).length;
  const markLabel = (m: ScheduleMark) => MARKS.find((x) => x.mark === m)!.label;

  const handleVote = (mark: ScheduleMark) => {
    if (!userId || busy) return;
    // 同じマークをもう一度 → 取り消し
    cast.mutate({ optionId: option.id, userId, mark: myMark === mark ? null : mark, awaseId });
  };

  const handleDelete = () => {
    if (busy) return;
    if (!window.confirm(`候補「${option.label}」を削除しますか？（回答も消えます）`)) return;
    del.mutate({ optionId: option.id, awaseId });
  };

  return (
    <div
      style={{
        border: `1px solid ${option.isDecided ? "#C9DECF" : colors.borderSoft}`,
        borderRadius: 14,
        padding: "12px 13px",
        background: option.isDecided ? "#F3FAF5" : colors.white,
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        {option.isDecided && (
          <span style={{ flex: "0 0 auto", fontSize: 9.5, fontWeight: 700, color: colors.positive, background: "#E7F4EC", padding: "3px 8px", borderRadius: 999 }}>
            確定
          </span>
        )}
        <div style={{ flex: 1, minWidth: 0, fontSize: 13.5, fontWeight: 700, color: colors.textPrimary }}>
          {option.label}
        </div>
        <div style={{ flex: "0 0 auto", fontSize: 11.5, color: colors.textMutedAlt }}>
          ○{count("yes")} △{count("maybe")} ×{count("no")}
        </div>
      </div>

      {/* 回答者の内訳（名前＋マーク） */}
      {option.votes.length > 0 && (
        <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginTop: 9 }}>
          {option.votes.map((v) => (
            <span
              key={v.userId}
              style={{
                fontSize: 10.5,
                color: colors.textSecondary,
                background: colors.primaryBg5,
                border: `1px solid ${colors.borderSoft}`,
                padding: "3px 9px",
                borderRadius: 999,
              }}
            >
              {markLabel(v.mark)} {v.name}
            </span>
          ))}
        </div>
      )}

      {/* 自分の回答（○△×トグル） */}
      {canVote && userId && (
        <div style={{ display: "flex", gap: 7, marginTop: 10 }}>
          {MARKS.map(({ mark, label }) => {
            const active = myMark === mark;
            return (
              <button
                key={mark}
                onClick={() => handleVote(mark)}
                disabled={busy}
                aria-pressed={active}
                style={{
                  flex: 1,
                  border: `1px solid ${active ? colors.primary : colors.border}`,
                  background: active ? colors.primaryBg1 : colors.white,
                  color: active ? colors.primary : colors.textSecondaryAlt,
                  fontFamily: "inherit",
                  fontSize: 15,
                  fontWeight: 700,
                  padding: "8px 0",
                  borderRadius: 11,
                  cursor: "pointer",
                }}
              >
                {label}
              </button>
            );
          })}
        </div>
      )}

      {/* ホスト操作 */}
      {isHost && (
        <div style={{ display: "flex", gap: 7, marginTop: 10 }}>
          <button
            onClick={() => decide.mutate({ optionId: option.id, awaseId, decided: !option.isDecided })}
            disabled={busy}
            style={{
              border: `1px solid ${colors.border}`,
              background: colors.white,
              color: option.isDecided ? colors.textSecondary : colors.positive,
              fontFamily: "inherit",
              fontSize: 11,
              fontWeight: 600,
              padding: "5px 12px",
              borderRadius: 999,
              cursor: "pointer",
            }}
          >
            {option.isDecided ? "確定を解除" : "この日に確定"}
          </button>
          <button
            onClick={handleDelete}
            disabled={busy}
            style={{
              border: "1px solid #E7C6C4",
              background: colors.white,
              color: "#C0453F",
              fontFamily: "inherit",
              fontSize: 11,
              fontWeight: 600,
              padding: "5px 12px",
              borderRadius: 999,
              cursor: "pointer",
            }}
          >
            削除
          </button>
        </div>
      )}
    </div>
  );
}
