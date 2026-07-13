"use client";

import { useState } from "react";
import { colors } from "@/lib/tokens";
import { useRouter } from "../AppRouter";
import { AppBar } from "../ui";
import { EmptyState } from "../EmptyState";
import { useAuth } from "@/lib/auth/useAuth";
import { useProfile } from "@/lib/queries/profile";
import {
  usePendingVerifications,
  useApproveVerification,
  useRejectVerification,
  type PendingVerification,
} from "@/lib/queries/admin";
import { isSupabaseConfigured } from "@/lib/supabase/config";

/**
 * 運営専用: 本人確認申請の承認/却下画面。呼び出し可否は SECURITY DEFINER 関数側で
 * is_admin をチェックしており、UI 側でも profiles.is_admin で表示を制御する。
 */
export function AdminVerificationScreen() {
  const { back } = useRouter();
  const { user } = useAuth();
  const configured = isSupabaseConfigured();
  const profile = useProfile(user?.id);
  const isAdmin = Boolean(configured && profile.data?.is_admin);

  const pending = usePendingVerifications(isAdmin);

  if (configured && profile.data && !isAdmin) {
    return (
      <div>
        <AppBar title="本人確認の承認" onBack={back} />
        <EmptyState icon="🔒" title="権限がありません" body="この画面は運営アカウントのみ利用できます。" />
      </div>
    );
  }

  const list = pending.data ?? [];

  return (
    <div>
      <AppBar title="本人確認の承認" onBack={back} />

      <div style={{ padding: "10px 22px 0" }}>
        <div style={{ fontSize: 11.5, color: colors.textMutedAlt, lineHeight: 1.7, background: colors.primaryBg5, border: `1px solid ${colors.borderSoft}`, borderRadius: 12, padding: "11px 13px" }}>
          身分証画像を確認し、問題なければ承認してください。<b>判断後は R2（premier-images）から画像を削除</b>し、個人情報を残さないようにしてください。
        </div>
      </div>

      <div style={{ padding: "16px 22px 30px" }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: colors.textPrimary, marginBottom: 13 }}>
          保留中の申請 {list.length}件
        </div>

        {pending.isPending && isAdmin ? (
          <div style={{ padding: "40px 0", textAlign: "center", fontSize: 13, color: colors.textMutedAlt }}>読み込み中…</div>
        ) : list.length === 0 ? (
          <EmptyState icon="✅" title="保留中の申請はありません" body="新しい申請が届くとここに表示されます。" />
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            {list.map((v) => (
              <VerificationCard key={v.requestId} v={v} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function VerificationCard({ v }: { v: PendingVerification }) {
  const approve = useApproveVerification();
  const reject = useRejectVerification();
  const [ageVerified, setAgeVerified] = useState(true);
  const [rejecting, setRejecting] = useState(false);
  const [note, setNote] = useState("");
  const busy = approve.isPending || reject.isPending;

  return (
    <div style={{ border: `1px solid ${colors.borderSoft}`, borderRadius: 16, padding: 14, background: colors.white }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8 }}>
        <div>
          <div style={{ fontSize: 14, fontWeight: 700, color: colors.textPrimary }}>{v.displayName}</div>
          <div style={{ fontSize: 11, color: colors.textMutedAlt, marginTop: 2 }}>@{v.handle}</div>
        </div>
        <a
          href={v.docUrl}
          target="_blank"
          rel="noopener noreferrer"
          style={{ fontSize: 11.5, fontWeight: 700, color: colors.primary, textDecoration: "none" }}
        >
          原寸で開く →
        </a>
      </div>

      {/* 身分証プレビュー */}
      <a href={v.docUrl} target="_blank" rel="noopener noreferrer" style={{ display: "block", marginTop: 11 }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={v.docUrl}
          alt="身分証"
          style={{ width: "100%", maxHeight: 260, objectFit: "contain", borderRadius: 12, background: "#F3F1F8", border: `1px solid ${colors.borderSoft}` }}
        />
      </a>

      <label style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 12, cursor: "pointer" }}>
        <input type="checkbox" checked={ageVerified} onChange={(e) => setAgeVerified(e.target.checked)} />
        <span style={{ fontSize: 12.5, color: colors.textSecondary }}>18歳以上を確認した（年齢確認も付与）</span>
      </label>

      {reject.isError && <div style={{ fontSize: 11.5, color: "#C0453F", marginTop: 8 }}>却下に失敗しました。</div>}
      {approve.isError && <div style={{ fontSize: 11.5, color: "#C0453F", marginTop: 8 }}>承認に失敗しました。</div>}

      {rejecting ? (
        <div style={{ marginTop: 12 }}>
          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            rows={2}
            placeholder="却下理由（例: 画像が不鮮明。氏名が確認できません）"
            style={{ width: "100%", border: `1px solid ${colors.border}`, borderRadius: 10, padding: "10px 12px", fontSize: 12.5, fontFamily: "inherit", resize: "none", outline: "none" }}
          />
          <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
            <button
              onClick={() => setRejecting(false)}
              disabled={busy}
              style={{ flex: 1, border: `1px solid ${colors.border}`, background: colors.white, color: colors.textSecondary, fontFamily: "inherit", fontSize: 12.5, fontWeight: 600, padding: "10px 0", borderRadius: 11, cursor: "pointer" }}
            >
              やめる
            </button>
            <button
              onClick={() => reject.mutate({ requestId: v.requestId, note })}
              disabled={busy}
              style={{ flex: 1, border: "1px solid #E7C6C4", background: colors.white, color: "#C0453F", fontFamily: "inherit", fontSize: 12.5, fontWeight: 700, padding: "10px 0", borderRadius: 11, cursor: "pointer" }}
            >
              {reject.isPending ? "却下中…" : "却下を確定"}
            </button>
          </div>
        </div>
      ) : (
        <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
          <button
            onClick={() => approve.mutate({ requestId: v.requestId, ageVerified })}
            disabled={busy}
            style={{ flex: 2, border: "none", background: colors.primary, color: colors.white, fontFamily: "inherit", fontSize: 13, fontWeight: 700, padding: "11px 0", borderRadius: 12, cursor: "pointer" }}
          >
            {approve.isPending ? "承認中…" : "承認する"}
          </button>
          <button
            onClick={() => setRejecting(true)}
            disabled={busy}
            style={{ flex: 1, border: `1px solid ${colors.border}`, background: colors.white, color: colors.textSecondary, fontFamily: "inherit", fontSize: 13, fontWeight: 700, padding: "11px 0", borderRadius: 12, cursor: "pointer" }}
          >
            却下
          </button>
        </div>
      )}
    </div>
  );
}
