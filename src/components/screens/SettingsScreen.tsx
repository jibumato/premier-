"use client";

import { useState } from "react";
import type { ReactNode } from "react";
import { colors } from "@/lib/tokens";
import { useRouter } from "../AppRouter";
import { AppBar, Toggle } from "../ui";
import { ChevronRightIcon } from "../icons";

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
  const [pushApply, setPushApply] = useState(true);
  const [pushMsg, setPushMsg] = useState(true);
  const [pushLike, setPushLike] = useState(false);
  const [privateAccount, setPrivateAccount] = useState(false);
  const [showSupport, setShowSupport] = useState(true);

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
        />
        <ToggleRow
          title="応援リンクを表示"
          desc="年齢確認済みの相手にのみ表示されます"
          on={showSupport}
          onChange={setShowSupport}
          last
        />
      </Group>

      <Group title="安全とサポート">
        <LinkRow title="ブロックしたユーザー" onClick={() => nav("report")} />
        <LinkRow title="本人確認" onClick={() => nav("onboardVerify")} />
        <LinkRow title="ヘルプ・お問い合わせ" onClick={() => nav("qa")} last />
      </Group>

      <Group title="サービス">
        <LinkRow title="法人のお客様へ（掲載案内）" onClick={() => nav("corporate")} last />
      </Group>

      <Group title="アカウント">
        <LinkRow title="ログアウト" onClick={() => nav("onboardRole")} danger last />
      </Group>

      <div style={{ textAlign: "center", fontSize: 10.5, color: colors.textMutedSoft, marginTop: 22 }}>
        プルミエ！ v1.0.0
      </div>
    </div>
  );
}
