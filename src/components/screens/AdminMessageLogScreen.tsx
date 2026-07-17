"use client";

import { colors } from "@/lib/tokens";
import { useRouter } from "../AppRouter";
import { AppBar } from "../ui";
import { EmptyState } from "../EmptyState";
import { useAuth } from "@/lib/auth/useAuth";
import { useProfile } from "@/lib/queries/profile";
import { useAdminMessageAccessLog } from "@/lib/queries/moderation";
import { isSupabaseConfigured } from "@/lib/supabase/config";

/**
 * 運営専用: メッセージ閲覧の監査ログ（0057）。誰が・いつ・どの会話を・どんな
 * 理由で確認したかを一覧する。運営間の相互監視・説明責任のための画面で、
 * ログの改ざん・削除はできない（書き込みは SECURITY DEFINER 関数のみ）。
 */
export function AdminMessageLogScreen() {
  const { back } = useRouter();
  const { user } = useAuth();
  const configured = isSupabaseConfigured();
  const profile = useProfile(user?.id);
  const isAdmin = Boolean(configured && profile.data?.is_admin);

  const logQuery = useAdminMessageAccessLog(isAdmin);

  if (configured && profile.data && !isAdmin) {
    return (
      <div>
        <AppBar title="メッセージ閲覧の記録" onBack={back} />
        <EmptyState icon="🔒" title="権限がありません" body="この画面は運営アカウントのみ利用できます。" />
      </div>
    );
  }

  const entries = logQuery.data ?? [];

  return (
    <div>
      <AppBar title="メッセージ閲覧の記録" onBack={back} />

      <div style={{ padding: "10px 22px 0" }}>
        <div style={{ fontSize: 11.5, color: colors.textMutedAlt, lineHeight: 1.7, background: colors.primaryBg5, border: `1px solid ${colors.borderSoft}`, borderRadius: 12, padding: "11px 13px" }}>
          運営が通報対応のために会話を確認した履歴です。<b>誰が・いつ・どの会話を・
          どんな理由で</b>見たかが記録され、あとから改ざん・削除はできません。
        </div>
      </div>

      <div style={{ padding: "16px 22px 30px" }}>
        {configured && logQuery.isPending ? (
          <div style={{ padding: "40px 0", textAlign: "center", fontSize: 13, color: colors.textMutedAlt }}>読み込み中…</div>
        ) : entries.length === 0 ? (
          <EmptyState icon="📋" title="まだ記録はありません" body="会話を確認すると、ここに履歴が残ります。" />
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {entries.map((e) => (
              <div key={e.id} style={{ border: `1px solid ${colors.borderSoft}`, borderRadius: 12, padding: "11px 13px", background: colors.white }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: 8 }}>
                  <span style={{ fontSize: 12.5, fontWeight: 700, color: colors.textPrimary }}>
                    {e.adminName ?? "（不明な運営）"}
                  </span>
                  <span style={{ fontSize: 10.5, color: colors.textMutedSoft, flex: "0 0 auto" }}>
                    {new Date(e.accessedAt).toLocaleString("ja-JP", { year: "numeric", month: "numeric", day: "numeric", hour: "2-digit", minute: "2-digit" })}
                  </span>
                </div>
                <div style={{ fontSize: 11.5, color: colors.textSecondary, marginTop: 4 }}>
                  対象: {e.targetName ?? "（退会ユーザー）"}
                </div>
                <div style={{ fontSize: 11.5, color: colors.textSecondary, marginTop: 6, lineHeight: 1.7, whiteSpace: "pre-wrap", overflowWrap: "anywhere" }}>
                  理由: {e.reason}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
