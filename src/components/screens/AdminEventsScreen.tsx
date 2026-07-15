"use client";

import { useRef, useState } from "react";
import { colors } from "@/lib/tokens";
import { useRouter } from "../AppRouter";
import { AppBar } from "../ui";
import { EmptyState } from "../EmptyState";
import { ImageSlot } from "../ImageSlot";
import { WorkCover } from "../WorkCover";
import { useAuth } from "@/lib/auth/useAuth";
import { useProfile } from "@/lib/queries/profile";
import { useAdminEvents, useSetEventImage, type AdminEvent } from "@/lib/queries/events";
import { useUploadImage, deleteUploadedImage } from "@/lib/queries/upload";
import { isSupabaseConfigured } from "@/lib/supabase/config";

/**
 * 運営専用: 各イベントのサムネイル画像を管理する画面。
 * 本人確認の承認画面・ピックアップ管理画面と同じ作りで、is_admin() に限定。
 * ・行の新規作成／削除はここではできない（image_url の差し替えだけ）。書き込みは
 *   RLS で is_admin() に限定（0044）。UI 側でも is_admin で出し分ける。
 * ・掲載できるのは主催から許諾を得た画像／運営が自ら撮影した会場写真のみ。
 *   未設定のイベントはイベント名から生成した権利リスクゼロのデザインで表示される。
 */
export function AdminEventsScreen() {
  const { back } = useRouter();
  const { user } = useAuth();
  const configured = isSupabaseConfigured();
  const profile = useProfile(user?.id);
  const isAdmin = Boolean(configured && profile.data?.is_admin);

  const listQuery = useAdminEvents(isAdmin);

  if (configured && profile.data && !isAdmin) {
    return (
      <div>
        <AppBar title="イベントのサムネイル管理" onBack={back} />
        <EmptyState icon="🔒" title="権限がありません" body="この画面は運営アカウントのみ利用できます。" />
      </div>
    );
  }

  const list = listQuery.data ?? [];
  const withImage = list.filter((e) => e.imageUrl).length;

  return (
    <div>
      <AppBar title="イベントのサムネイル管理" onBack={back} />

      {/* guidance */}
      <div style={{ padding: "10px 22px 0" }}>
        <div style={{ fontSize: 11.5, color: colors.textMutedAlt, lineHeight: 1.7, background: colors.primaryBg5, border: `1px solid ${colors.borderSoft}`, borderRadius: 12, padding: "11px 13px" }}>
          各イベントのサムネイルを設定します。掲載できるのは
          <b>主催から許諾を得た画像</b>か<b>運営が自ら撮影した会場写真</b>だけです。
          大型イベントの公式ロゴ・キービジュアルはプレス審査制のため使えません。
          <b>未設定のイベントはイベント名から生成したデザイン</b>で表示されるので、
          空のままでも見栄えは保たれます。
        </div>
      </div>

      {/* list */}
      <div style={{ padding: "16px 22px 30px" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 13 }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: colors.textPrimary }}>イベント {list.length}件</div>
          <div style={{ fontSize: 11, color: colors.textMutedAlt }}>サムネ設定済み {withImage}件</div>
        </div>

        {listQuery.isPending && isAdmin ? (
          <div style={{ padding: "40px 0", textAlign: "center", fontSize: 13, color: colors.textMutedAlt }}>読み込み中…</div>
        ) : list.length === 0 ? (
          <EmptyState icon="🗓" title="イベントがありません" body="イベントはSQL Editorから登録されます。" />
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {list.map((ev) => (
              <EventRow key={ev.id} event={ev} configured={configured} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function EventRow({ event, configured }: { event: AdminEvent; configured: boolean }) {
  const setImage = useSetEventImage();
  const upload = useUploadImage();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
      const result = await upload.mutateAsync({ file, kind: "event" });
      if (!result.url) throw new Error("画像URLの取得に失敗しました（R2未設定）");
      const previous = event.imageUrl;
      await setImage.mutateAsync({ eventId: event.id, imageUrl: result.url });
      // 差し替え時は古い画像本体を片付ける（失敗しても差し替え自体は成立）。
      if (previous) await deleteUploadedImage(previous);
    } catch (err) {
      setError(err instanceof Error ? err.message : "設定に失敗しました");
    } finally {
      setBusy(false);
    }
  };

  const handleRemove = async () => {
    if (busy || !event.imageUrl) return;
    if (!window.confirm("このイベントのサムネイルを外しますか？（生成デザインに戻ります）")) return;
    setError(null);
    setBusy(true);
    try {
      const previous = event.imageUrl;
      await setImage.mutateAsync({ eventId: event.id, imageUrl: null });
      if (previous) await deleteUploadedImage(previous);
    } catch (err) {
      setError(err instanceof Error ? err.message : "解除に失敗しました");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div
      style={{
        display: "flex",
        gap: 12,
        border: `1px solid ${colors.borderSoft}`,
        borderRadius: 14,
        padding: 10,
        background: colors.white,
      }}
    >
      <div style={{ flex: "0 0 64px", width: 64, height: 64, borderRadius: 12, overflow: "hidden", opacity: busy ? 0.5 : 1 }}>
        {event.imageUrl ? (
          <ImageSlot radius={12} src={event.imageUrl} />
        ) : (
          <WorkCover name={event.name} radius={12} showName={false} />
        )}
      </div>

      <div style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
          <span
            style={{
              fontSize: 9.5,
              fontWeight: 700,
              padding: "3px 8px",
              borderRadius: 999,
              color: event.imageUrl ? colors.positive : colors.textMutedAlt,
              background: event.imageUrl ? "#E7F4EC" : colors.primaryBg4,
            }}
          >
            {event.imageUrl ? "設定済み" : "生成デザイン"}
          </span>
          <span style={{ fontSize: 9.5, color: colors.pinkText, background: colors.pinkBg1, padding: "2px 7px", borderRadius: 999, whiteSpace: "nowrap" }}>
            {event.tag}
          </span>
        </div>
        <div style={{ fontSize: 13, fontWeight: 700, color: colors.textPrimary, marginTop: 6, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
          {event.name}
        </div>
        <div style={{ fontSize: 11, color: colors.textMutedAlt, marginTop: 3, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
          {event.date}・{event.venue}
        </div>

        <input ref={fileInputRef} type="file" accept="image/*" onChange={handleFile} style={{ display: "none" }} />
        <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 10, flexWrap: "wrap" }}>
          <RowBtn
            label={busy ? "アップロード中…" : event.imageUrl ? "画像を変更" : "画像を選んで設定"}
            disabled={busy || !configured}
            onClick={handlePick}
          />
          {event.imageUrl && <RowBtn label="サムネを外す" danger disabled={busy} onClick={handleRemove} />}
        </div>
        {error && <div style={{ fontSize: 11, color: "#C0453F", marginTop: 8 }}>{error}</div>}
        {!configured && (
          <div style={{ fontSize: 11, color: colors.textMutedAlt, marginTop: 8 }}>
            プレビュー環境（未接続）では設定できません。
          </div>
        )}
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
