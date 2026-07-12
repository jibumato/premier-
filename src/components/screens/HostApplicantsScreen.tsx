"use client";

import { colors } from "@/lib/tokens";
import { useRouter } from "../AppRouter";
import { ImageSlot } from "../ImageSlot";
import { EmptyState } from "../EmptyState";
import { ChevronLeftIcon, VerifiedBadge, MessageIcon } from "../icons";
import { useAuth } from "@/lib/auth/useAuth";
import {
  useAwase,
  useAwaseApplicants,
  useAwaseApplicantCount,
  useUpdateApplicationStatus,
  useSetAwaseStatus,
  type ApplicationStatus,
  type Applicant,
} from "@/lib/queries/awase";
import { useGetOrCreateConversation } from "@/lib/queries/messages";
import { isSupabaseConfigured } from "@/lib/supabase/config";

/** Mock applicants so the screen is meaningful in prototype/mock mode. */
const mockApplicants: Applicant[] = [
  { id: "m1", applicantId: "u1", displayName: "澪 / mio", avatarUrl: null, isVerified: true, message: "フリーレン役で参加したいです！経験ありますので当日よろしくお願いします。", status: "applied", createdAt: "" },
  { id: "m2", applicantId: "u2", displayName: "ひなた", avatarUrl: null, isVerified: false, message: "はじめまして。初心者ですが精一杯がんばります◎", status: "accepted", createdAt: "" },
  { id: "m3", applicantId: "u3", displayName: "さく", avatarUrl: null, isVerified: true, message: "カメラマンとして参加希望です。", status: "applied", createdAt: "" },
  { id: "m4", applicantId: "u4", displayName: "れい", avatarUrl: null, isVerified: false, message: "日程が合わずでした、また今度お願いします。", status: "rejected", createdAt: "" },
];

const statusChip: Record<ApplicationStatus, { label: string; color: string; bg: string }> = {
  applied: { label: "応募中", color: colors.pinkText, bg: colors.pinkBg1 },
  accepted: { label: "承認済", color: colors.primary, bg: colors.primaryBg1 },
  rejected: { label: "見送り", color: colors.textMutedAlt, bg: "#F1EEF6" },
  done: { label: "完了", color: colors.textMutedAlt, bg: "#F1EEF6" },
};

export function HostApplicantsScreen() {
  const { back, openProfile, openChat, selectedAwaseId } = useRouter();
  const { user } = useAuth();
  const configured = isSupabaseConfigured();

  const awaseQuery = useAwase(selectedAwaseId);
  const applicantsQuery = useAwaseApplicants(selectedAwaseId);
  const countQuery = useAwaseApplicantCount(selectedAwaseId);
  const updateStatus = useUpdateApplicationStatus();
  const setAwaseStatus = useSetAwaseStatus();
  const getOrCreateConversation = useGetOrCreateConversation();

  const real = configured && selectedAwaseId ? awaseQuery.data : undefined;
  const applicants = real ? (applicantsQuery.data ?? []) : mockApplicants;

  const title = real?.title ?? "魔法学園シリーズ 生徒会併せ";
  const capacity = real ? real.capacity : 6;
  const accepted = real ? (countQuery.data?.accepted ?? 0) : mockApplicants.filter((a) => a.status === "accepted").length;
  const isClosed = real ? real.status === "closed" : false;
  const isFull = capacity != null && accepted >= capacity;

  const setStatus = (a: Applicant, status: ApplicationStatus) => {
    if (!real) return;
    updateStatus.mutate({ id: a.id, awaseId: real.id, status });
  };
  const toggleRecruit = () => {
    if (!real) return;
    setAwaseStatus.mutate({ awaseId: real.id, status: isClosed ? "open" : "closed" });
  };
  const messageApplicant = (a: Applicant) => {
    if (real && user) {
      getOrCreateConversation.mutate(
        { userId: user.id, otherUserId: a.applicantId },
        { onSuccess: (conversationId) => openChat(conversationId) },
      );
    }
  };

  return (
    <div>
      {/* app bar */}
      <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "10px 18px 8px" }}>
        <button onClick={back} style={{ background: "none", border: "none", cursor: "pointer", padding: 0 }} aria-label="戻る">
          <ChevronLeftIcon size={24} />
        </button>
        <div style={{ fontSize: 14, fontWeight: 600, color: colors.textPrimaryAlt }}>応募者管理</div>
      </div>

      {/* awase summary + recruit status */}
      <div style={{ padding: "10px 22px 0" }}>
        <div style={{ fontSize: 12, color: colors.textMutedAlt }}>募集中の併せ</div>
        <div style={{ fontSize: 16, fontWeight: 700, color: colors.textPrimary, marginTop: 3, lineHeight: 1.4 }}>{title}</div>

        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 10,
            marginTop: 14,
            border: `1px solid ${colors.borderSoft}`,
            borderRadius: 14,
            padding: "13px 15px",
            background: colors.primaryBg5,
          }}
        >
          <div>
            <div style={{ fontSize: 11, color: colors.textMutedAlt }}>承認状況</div>
            <div style={{ fontSize: 15, fontWeight: 700, color: colors.textPrimary, marginTop: 3 }}>
              承認 {accepted}
              {capacity != null ? ` / 定員 ${capacity}名` : "名"}
            </div>
          </div>
          <span
            style={{
              fontSize: 11.5,
              fontWeight: 700,
              color: isClosed ? colors.textMutedAlt : isFull ? colors.pinkText : colors.primary,
              background: isClosed ? "#F1EEF6" : isFull ? colors.pinkBg1 : colors.primaryBg1,
              padding: "6px 13px",
              borderRadius: 999,
              whiteSpace: "nowrap",
            }}
          >
            {isClosed ? "募集締切" : isFull ? "満員" : "募集中"}
          </span>
        </div>

        {real && (
          <button
            onClick={toggleRecruit}
            disabled={setAwaseStatus.isPending}
            style={{
              width: "100%",
              marginTop: 10,
              border: `1px solid ${colors.border}`,
              background: colors.white,
              color: isClosed ? colors.primary : colors.textSecondary,
              fontFamily: "inherit",
              fontSize: 12.5,
              fontWeight: 700,
              padding: "11px 0",
              borderRadius: 12,
              cursor: setAwaseStatus.isPending ? "default" : "pointer",
            }}
          >
            {setAwaseStatus.isPending
              ? "更新中…"
              : isClosed
                ? "募集を再開する"
                : "募集を締め切る"}
          </button>
        )}
        {isFull && !isClosed && (
          <p style={{ margin: "8px 2px 0", fontSize: 11, color: colors.textMutedAlt, lineHeight: 1.6 }}>
            定員に達すると自動で締め切られます。追加募集する場合は定員を増やしてください。
          </p>
        )}
      </div>

      {/* applicant list */}
      <div style={{ padding: "22px 22px 30px" }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: colors.textPrimary, marginBottom: 13 }}>
          応募者 {applicants.length}名
        </div>

        {applicants.length === 0 ? (
          <EmptyState
            icon="📮"
            title="まだ応募がありません"
            body="募集がタイムラインに表示されると、興味を持った人から応募が届きます。"
          />
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 11 }}>
            {applicants.map((a) => {
              const chip = statusChip[a.status];
              return (
                <div
                  key={a.id}
                  style={{ border: `1px solid ${colors.borderSoft}`, borderRadius: 16, padding: "13px 14px", background: colors.white }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: 11 }}>
                    <button
                      onClick={() => real && openProfile(a.applicantId)}
                      style={{ width: 44, height: 44, borderRadius: "50%", overflow: "hidden", flex: "0 0 auto", border: "none", padding: 0, background: colors.primaryBg1, cursor: real ? "pointer" : "default" }}
                      aria-label={`${a.displayName}のプロフィール`}
                    >
                      <ImageSlot circle src={a.avatarUrl ?? undefined} />
                    </button>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
                        <span style={{ fontSize: 13.5, fontWeight: 700, color: colors.textPrimary }}>{a.displayName}</span>
                        {a.isVerified && <VerifiedBadge size={14} />}
                      </div>
                      <span
                        style={{
                          display: "inline-block",
                          marginTop: 4,
                          fontSize: 11,
                          fontWeight: 600,
                          color: chip.color,
                          background: chip.bg,
                          padding: "3px 10px",
                          borderRadius: 999,
                        }}
                      >
                        {chip.label}
                      </span>
                    </div>
                    {real && (
                      <button
                        onClick={() => messageApplicant(a)}
                        aria-label="メッセージ"
                        style={{ background: "none", border: "none", cursor: "pointer", padding: 6, flex: "0 0 auto" }}
                      >
                        <MessageIcon size={20} color={colors.textMutedAlt} />
                      </button>
                    )}
                  </div>

                  {a.message && (
                    <p style={{ margin: "10px 0 0", fontSize: 12.5, color: colors.textSecondary, lineHeight: 1.7 }}>
                      {a.message}
                    </p>
                  )}

                  <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
                    {a.status === "applied" ? (
                      <>
                        <button
                          onClick={() => setStatus(a, "accepted")}
                          disabled={updateStatus.isPending}
                          style={{ flex: 2, border: "none", background: colors.primary, color: colors.white, fontFamily: "inherit", fontSize: 12.5, fontWeight: 700, padding: "10px 0", borderRadius: 11, cursor: "pointer" }}
                        >
                          承認する
                        </button>
                        <button
                          onClick={() => setStatus(a, "rejected")}
                          disabled={updateStatus.isPending}
                          style={{ flex: 1, border: `1px solid ${colors.border}`, background: colors.white, color: colors.textSecondary, fontFamily: "inherit", fontSize: 12.5, fontWeight: 700, padding: "10px 0", borderRadius: 11, cursor: "pointer" }}
                        >
                          見送る
                        </button>
                      </>
                    ) : (
                      <button
                        onClick={() => setStatus(a, "applied")}
                        disabled={updateStatus.isPending}
                        style={{ flex: 1, border: `1px solid ${colors.border}`, background: colors.white, color: colors.textSecondary, fontFamily: "inherit", fontSize: 12.5, fontWeight: 700, padding: "10px 0", borderRadius: 11, cursor: "pointer" }}
                      >
                        応募中に戻す
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
