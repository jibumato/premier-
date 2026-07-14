"use client";

import { useRef, useState } from "react";
import { colors } from "@/lib/tokens";
import { useRouter } from "../AppRouter";
import { AppBar } from "../ui";
import { EmptyState } from "../EmptyState";
import { useAuth } from "@/lib/auth/useAuth";
import { useProfile } from "@/lib/queries/profile";
import {
  useAdminHomePickups,
  useCreateHomePickup,
  useDeleteHomePickup,
  useUpdateHomePickup,
  type AdminHomePickup,
} from "@/lib/queries/pickups";
import { useUploadImage } from "@/lib/queries/upload";
import { isSupabaseConfigured } from "@/lib/supabase/config";

/**
 * 運営専用: トップの「プルミエ！ピックアップ」の写真を管理する画面。
 * 追加（R2アップロード）・公開/非公開・並び替え・削除ができる。
 * 書き込みは RLS で is_admin() に限定（0037）。UI 側でも is_admin で出し分け。
 */
export function AdminPickupsScreen() {
  const { back } = useRouter();
  const { user } = useAuth();
  const configured = isSupabaseConfigured();
  const profile = useProfile(user?.id);
  const isAdmin = Boolean(configured && profile.data?.is_admin);

  const listQuery = useAdminHomePickups(isAdmin);
  const create = useCreateHomePickup();
  const upload = useUploadImage();

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [caption, setCaption] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (configured && profile.data && !isAdmin) {
    return (
      <div>
        <AppBar title="ピックアップ管理" onBack={back} />
        <EmptyState icon="🔒" title="権限がありません" body="この画面は運営アカウントのみ利用できます。" />
      </div>
    );
  }

  const list = listQuery.data ?? [];
  const activeCount = list.filter((p) => p.isActive).length;
  // 公開側の表示ロジック（HomePickup と揃える）: 8以上→8, 4〜7→4, 4未満→非表示。
  const shownCount = activeCount >= 8 ? 8 : activeCount >= 4 ? 4 : 0;

  const handlePick = () => {
    if (!configured || busy) return;
    fileInputRef.current?.click();
  };

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    setError(null);
    setBusy(true);
    try {
      const result = await upload.mutateAsync({ file, kind: "pickup" });
      if (!result.url) throw new Error("画像URLの取得に失敗しました（R2未設定）");
      const nextSort = list.length ? Math.max(...list.map((p) => p.sort)) + 1 : 1;
      await create.mutateAsync({ imageUrl: result.url, caption: caption.trim() || null, sort: nextSort });
      setCaption("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "追加に失敗しました");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div>
      <AppBar title="ピックアップ管理" onBack={back} />

      {/* guidance */}
      <div style={{ padding: "10px 22px 0" }}>
        <div style={{ fontSize: 11.5, color: colors.textMutedAlt, lineHeight: 1.7, background: colors.primaryBg5, border: `1px solid ${colors.borderSoft}`, borderRadius: 12, padding: "11px 13px" }}>
          トップの「プルミエ！ピックアップ」に出す写真を管理します。
          <b>必ず本人の同意を得た写真だけ</b>を掲載してください。公開は
          <b>4枚以上</b>で有効になり、<b>8枚以上あれば8枚</b>表示されます
          （4枚未満のときはコーナーごと非表示）。
        </div>
      </div>

      {/* add form */}
      <div style={{ padding: "16px 22px 0" }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: colors.textPrimary, marginBottom: 10 }}>写真を追加</div>
        <input
          value={caption}
          onChange={(e) => setCaption(e.target.value)}
          placeholder="キャプション（任意・レイヤー名や作品名など）"
          style={{ width: "100%", border: `1px solid ${colors.border}`, borderRadius: 11, padding: "11px 13px", fontSize: 13, fontFamily: "inherit", outline: "none", background: colors.white }}
        />
        <input ref={fileInputRef} type="file" accept="image/*" onChange={handleFile} style={{ display: "none" }} />
        <button
          onClick={handlePick}
          disabled={busy || !configured}
          style={{
            width: "100%",
            marginTop: 10,
            border: "none",
            background: colors.primary,
            color: colors.white,
            fontFamily: "inherit",
            fontSize: 13,
            fontWeight: 700,
            padding: "12px 0",
            borderRadius: 12,
            cursor: busy ? "default" : "pointer",
            opacity: busy || !configured ? 0.55 : 1,
          }}
        >
          {busy ? "アップロード中…" : "画像を選んで追加"}
        </button>
        {error && <div style={{ fontSize: 11.5, color: "#C0453F", marginTop: 8 }}>{error}</div>}
        {!configured && (
          <div style={{ fontSize: 11.5, color: colors.textMutedAlt, marginTop: 8 }}>
            プレビュー環境（未接続）では追加できません。
          </div>
        )}
      </div>

      {/* list */}
      <div style={{ padding: "20px 22px 30px" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 13 }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: colors.textPrimary }}>登録済み {list.length}件</div>
          <div style={{ fontSize: 11, color: colors.textMutedAlt }}>
            公開 {activeCount}件 → 表示 {shownCount}枚
          </div>
        </div>

        {listQuery.isPending && isAdmin ? (
          <div style={{ padding: "40px 0", textAlign: "center", fontSize: 13, color: colors.textMutedAlt }}>読み込み中…</div>
        ) : list.length === 0 ? (
          <EmptyState icon="✨" title="まだ写真がありません" body="上のフォームから写真を追加してください。" />
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {list.map((p, i) => (
              <PickupRow
                key={p.id}
                pickup={p}
                isFirst={i === 0}
                isLast={i === list.length - 1}
                neighborUp={list[i - 1]}
                neighborDown={list[i + 1]}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function PickupRow({
  pickup,
  isFirst,
  isLast,
  neighborUp,
  neighborDown,
}: {
  pickup: AdminHomePickup;
  isFirst: boolean;
  isLast: boolean;
  neighborUp?: AdminHomePickup;
  neighborDown?: AdminHomePickup;
}) {
  const update = useUpdateHomePickup();
  const del = useDeleteHomePickup();
  const busy = update.isPending || del.isPending;

  // 隣とsort値を入れ替えて並び替える（小さいsortが先）。
  const swapWith = async (other?: AdminHomePickup) => {
    if (!other || busy) return;
    await update.mutateAsync({ id: pickup.id, patch: { sort: other.sort } });
    await update.mutateAsync({ id: other.id, patch: { sort: pickup.sort } });
  };

  const handleDelete = () => {
    if (busy) return;
    if (!window.confirm("この写真をピックアップから削除しますか？")) return;
    del.mutate({ id: pickup.id, imageUrl: pickup.imageUrl });
  };

  return (
    <div
      style={{
        display: "flex",
        gap: 12,
        border: `1px solid ${colors.borderSoft}`,
        borderRadius: 14,
        padding: 10,
        background: pickup.isActive ? colors.white : colors.primaryBg5,
      }}
    >
      <div style={{ flex: "0 0 60px", width: 60, height: 80, borderRadius: 10, overflow: "hidden", background: colors.primaryBg4, opacity: pickup.isActive ? 1 : 0.5 }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={pickup.imageUrl} alt={pickup.caption ?? ""} style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
      </div>

      <div style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
          <span
            style={{
              fontSize: 9.5,
              fontWeight: 700,
              padding: "3px 8px",
              borderRadius: 999,
              color: pickup.isActive ? colors.positive : colors.textMutedAlt,
              background: pickup.isActive ? "#E7F4EC" : colors.primaryBg4,
            }}
          >
            {pickup.isActive ? "公開" : "非公開"}
          </span>
          <span style={{ fontSize: 11, color: colors.textMutedAlt }}>#{pickup.sort}</span>
        </div>
        <div style={{ fontSize: 12.5, color: colors.textSecondary, marginTop: 6, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
          {pickup.caption || <span style={{ color: colors.textMutedSoft }}>（キャプションなし）</span>}
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 10, flexWrap: "wrap" }}>
          <RowBtn label="↑" disabled={isFirst || busy} onClick={() => swapWith(neighborUp)} />
          <RowBtn label="↓" disabled={isLast || busy} onClick={() => swapWith(neighborDown)} />
          <RowBtn
            label={pickup.isActive ? "非公開にする" : "公開する"}
            disabled={busy}
            onClick={() => update.mutate({ id: pickup.id, patch: { is_active: !pickup.isActive } })}
          />
          <RowBtn label="削除" danger disabled={busy} onClick={handleDelete} />
        </div>
      </div>
    </div>
  );
}

function RowBtn({
  label,
  onClick,
  disabled,
  danger,
}: {
  label: string;
  onClick: () => void;
  disabled?: boolean;
  danger?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      style={{
        border: `1px solid ${danger ? "#E7C6C4" : colors.border}`,
        background: colors.white,
        color: danger ? "#C0453F" : colors.textSecondary,
        borderRadius: 999,
        padding: "5px 11px",
        fontSize: 11,
        fontWeight: 600,
        fontFamily: "inherit",
        cursor: disabled ? "default" : "pointer",
        opacity: disabled ? 0.4 : 1,
      }}
    >
      {label}
    </button>
  );
}
