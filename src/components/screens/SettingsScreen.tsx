"use client";

import { useState } from "react";
import type { ReactNode } from "react";
import { colors } from "@/lib/tokens";
import { useRouter } from "../AppRouter";
import { AppBar, Toggle } from "../ui";
import { ChevronRightIcon } from "../icons";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { useAuth } from "@/lib/auth/useAuth";
import { useProfile } from "@/lib/queries/profile";
import { useDeleteAccount } from "@/lib/queries/account";

function Group({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div style={{ padding: "0 22px", marginTop: 22 }}>
      <div style={{ fontSize: 11.5, fontWeight: 700, color: colors.textMutedAlt, marginBottom: 9, paddingLeft: 2 }}>
        {title}
      </div>
      <div style={{ border: `1px solid ${colors.borderSoft}`, borderRadius: 16, overflow: "hidden", background: colors.white }}>
        {children}
      </div>
    </div>
  );
}

function ToggleRow({
  title,
  desc,
  on,
  onChange,
  last,
}: {
  title: string;
  desc?: string;
  on: boolean;
  onChange: (v: boolean) => void;
  last?: boolean;
}) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: 12,
        padding: "13px 15px",
        borderBottom: last ? "none" : `1px solid ${colors.borderSofter}`,
      }}
    >
      <div style={{ minWidth: 0 }}>
        <div style={{ fontSize: 13.5, fontWeight: 600, color: colors.textPrimary }}>{title}</div>
        {desc && <div style={{ fontSize: 11, color: colors.textMutedAlt, marginTop: 2 }}>{desc}</div>}
      </div>
      <Toggle on={on} onChange={onChange} ariaLabel={title} />
    </div>
  );
}

function LinkRow({ title, onClick, danger, last }: { title: string; onClick: () => void; danger?: boolean; last?: boolean }) {
  return (
    <button
      onClick={onClick}
      style={{
        width: "100%",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "14px 15px",
        border: "none",
        borderBottom: last ? "none" : `1px solid ${colors.borderSofter}`,
        background: colors.white,
        cursor: "pointer",
        fontFamily: "inherit",
        textAlign: "left",
      }}
    >
      <span style={{ fontSize: 13.5, fontWeight: 600, color: danger ? "#C0453F" : colors.textPrimary }}>{title}</span>
      {!danger && <ChevronRightIcon />}
    </button>
  );
}

export function SettingsScreen() {
  const { back, nav } = useRouter();
  const { user } = useAuth();
  const profile = useProfile(user?.id);
  const isAdmin = Boolean(isSupabaseConfigured() && profile.data?.is_admin);
  const deleteAccount = useDeleteAccount();
  const [pushApply, setPushApply] = useState(true);
  const [pushMsg, setPushMsg] = useState(true);
  const [pushLike, setPushLike] = useState(false);
  const [privateAccount, setPrivateAccount] = useState(false);
  const [showDelete, setShowDelete] = useState(false);

  const handleDeleteAccount = async () => {
    if (!isSupabaseConfigured()) {
      // プロトタイプモード: 実アカウントが無いのでオンボーディングに戻すだけ
      setShowDelete(false);
      nav("onboardRole");
      return;
    }
    try {
      await deleteAccount.mutateAsync();
      // 削除成功: signOut 済みなので AuthGate がログイン画面へ戻す
      setShowDelete(false);
    } catch {
      // エラーはモーダル内に表示（deleteAccount.isError）
    }
  };

  const handleLogout = async () => {
    if (isSupabaseConfigured()) {
      // AuthGate reacts to onAuthStateChange and swaps in LoginScreen itself.
      await getSupabaseBrowserClient().auth.signOut();
      return;
    }
    nav("onboardRole"); // prototype mode: walk through the onboarding flow instead
  };

  return (
    <div style={{ paddingBottom: 30 }}>
      <AppBar title="設定" onBack={back} />

      <Group title="通知">
        <ToggleRow title="応募・参加の通知" on={pushApply} onChange={setPushApply} />
        <ToggleRow title="メッセージの通知" on={pushMsg} onChange={setPushMsg} />
        <ToggleRow title="いいね・フォローの通知" on={pushLike} onChange={setPushLike} last />
      </Group>

      <Group title="プライバシー">
        <ToggleRow
          title="非公開アカウント"
          desc="承認した相手だけがプロフィールを見られます"
          on={privateAccount}
          onChange={setPrivateAccount}
          last
        />
      </Group>

      <p style={{ padding: "10px 24px 0", margin: 0, fontSize: 10.5, color: colors.textMutedSoft, lineHeight: 1.7 }}>
        ※ 通知・プライバシーの各設定の保存は現在準備中です。切り替えは一時的に反映されますが、まだ保存されません。
      </p>

      <Group title="安全とサポート">
        <LinkRow title="ブロックしたユーザー" onClick={() => nav("report")} />
        <LinkRow title="本人確認" onClick={() => nav("verify")} />
        <LinkRow title="ヘルプ・お問い合わせ" onClick={() => nav("qa")} last />
      </Group>

      <Group title="サービス">
        <LinkRow title="お知らせ・更新履歴" onClick={() => nav("announcements")} />
        <LinkRow title="利用規約・ガイドライン" onClick={() => nav("terms")} />
        <LinkRow title="プライバシーポリシー" onClick={() => nav("privacy")} />
        <LinkRow title="法人のお客様へ（掲載案内）" onClick={() => nav("corporate")} last />
      </Group>

      {isAdmin && (
        <Group title="運営">
          <LinkRow title="本人確認の承認" onClick={() => nav("adminVerify")} />
          <LinkRow title="トップのピックアップ管理" onClick={() => nav("adminPickups")} last />
        </Group>
      )}

      <Group title="アカウント">
        <LinkRow title="ログアウト" onClick={handleLogout} danger />
        <LinkRow title="退会（アカウント削除）" onClick={() => setShowDelete(true)} danger last />
      </Group>

      <div style={{ textAlign: "center", fontSize: 10.5, color: colors.textMutedSoft, marginTop: 22 }}>
        プルミエ！ v1.0.0
      </div>

      {showDelete && (
        <DeleteAccountModal
          onCancel={() => {
            if (!deleteAccount.isPending) setShowDelete(false);
          }}
          onConfirm={handleDeleteAccount}
          pending={deleteAccount.isPending}
          error={deleteAccount.isError}
        />
      )}
    </div>
  );
}

function DeleteAccountModal({
  onCancel,
  onConfirm,
  pending,
  error,
}: {
  onCancel: () => void;
  onConfirm: () => void;
  pending: boolean;
  error: boolean;
}) {
  const [confirmText, setConfirmText] = useState("");
  const canDelete = confirmText.trim() === "退会" && !pending;

  return (
    <div
      onClick={onCancel}
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(20,16,34,0.55)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 24,
        zIndex: 100,
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: "100%",
          maxWidth: 340,
          background: colors.white,
          borderRadius: 20,
          padding: "24px 22px",
        }}
      >
        <div style={{ fontSize: 16, fontWeight: 800, color: "#C0453F" }}>退会（アカウント削除）</div>
        <p style={{ fontSize: 12.5, color: colors.textPrimary, lineHeight: 1.85, margin: "12px 0 0" }}>
          退会すると、プロフィール・作成した併せ・応募・投稿・メッセージ・レビューなど
          <b>すべてのデータが完全に削除</b>されます。この操作は<b>取り消せません</b>。
        </p>
        <p style={{ fontSize: 11, color: colors.textMutedAlt, lineHeight: 1.8, margin: "10px 0 0" }}>
          同じメールアドレスで再登録はできますが、削除したデータは復元できません。
        </p>

        <div style={{ marginTop: 16 }}>
          <label style={{ fontSize: 11.5, fontWeight: 700, color: colors.textMutedAlt }}>
            確認のため「退会」と入力してください
          </label>
          <input
            value={confirmText}
            onChange={(e) => setConfirmText(e.target.value)}
            placeholder="退会"
            disabled={pending}
            style={{
              width: "100%",
              boxSizing: "border-box",
              marginTop: 7,
              padding: "11px 13px",
              borderRadius: 12,
              border: `1px solid ${colors.borderSoft}`,
              fontSize: 14,
              fontFamily: "inherit",
              outline: "none",
            }}
          />
        </div>

        {error && (
          <p style={{ fontSize: 11.5, color: "#C0453F", margin: "10px 0 0", lineHeight: 1.7 }}>
            退会処理に失敗しました。通信環境を確認して、もう一度お試しください。
          </p>
        )}

        <div style={{ display: "flex", gap: 10, marginTop: 20 }}>
          <button
            onClick={onCancel}
            disabled={pending}
            style={{
              flex: 1,
              padding: "13px 0",
              borderRadius: 999,
              border: `1px solid ${colors.borderSoft}`,
              background: colors.white,
              color: colors.textPrimary,
              fontSize: 13.5,
              fontWeight: 700,
              fontFamily: "inherit",
              cursor: pending ? "default" : "pointer",
            }}
          >
            キャンセル
          </button>
          <button
            onClick={onConfirm}
            disabled={!canDelete}
            style={{
              flex: 1,
              padding: "13px 0",
              borderRadius: 999,
              border: "none",
              background: canDelete ? "#C0453F" : "#E4B6B3",
              color: colors.white,
              fontSize: 13.5,
              fontWeight: 700,
              fontFamily: "inherit",
              cursor: canDelete ? "pointer" : "default",
            }}
          >
            {pending ? "削除中…" : "退会する"}
          </button>
        </div>
      </div>
    </div>
  );
}
