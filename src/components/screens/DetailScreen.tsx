"use client";

import { useRef, useState, type CSSProperties, type ReactNode } from "react";
import { colors } from "@/lib/tokens";
import { detailRoles, regions } from "@/lib/data";
import { useRouter } from "../AppRouter";
import { ImageSlot } from "../ImageSlot";
import { SectionHeading, PrimaryButton } from "../ui";
import { ChevronLeftIcon, FlagIcon, PlusIcon, ShareIcon } from "../icons";
import { useAuth } from "@/lib/auth/useAuth";
import {
  useAddAwaseImage,
  useApply,
  useAwase,
  useAwaseImages,
  useAwaseRoles,
  useDeleteAwase,
  useRemoveAwaseImage,
  useUpdateAwase,
} from "@/lib/queries/awase";
import { useAwaseAchievementCount } from "@/lib/queries/profile";
import { useUploadImage } from "@/lib/queries/upload";
import { isSupabaseConfigured } from "@/lib/supabase/config";

const EDIT_WORLD_TAGS = ["透明感", "ファンタジー", "和風", "サイバー", "ナチュラル", "ダーク", "かわいい系", "クール系"];
const editableRegions = regions.filter((r) => r !== "すべて");

const mockInfoGrid = [
  { label: "日程", value: "7/26(日) 13:00〜" },
  { label: "場所", value: "都内スタジオ" },
  { label: "募集人数", value: "あと2名（4/6）" },
  { label: "費用", value: "スタジオ代 割り勘" },
];

export function DetailScreen() {
  const { back, nav, openProfile, openReport, selectedAwaseId } = useRouter();
  const { user } = useAuth();
  const configured = isSupabaseConfigured();

  const awaseQuery = useAwase(selectedAwaseId);
  const rolesQuery = useAwaseRoles(selectedAwaseId);
  const apply = useApply();
  const updateAwase = useUpdateAwase();
  const deleteAwase = useDeleteAwase();
  const imagesQuery = useAwaseImages(selectedAwaseId);
  const addImage = useAddAwaseImage();
  const removeImage = useRemoveAwaseImage();
  const uploadImage = useUploadImage();
  const imageInputRef = useRef<HTMLInputElement>(null);

  const real = configured && selectedAwaseId ? awaseQuery.data : undefined;
  const roles = real ? (rolesQuery.data ?? []) : detailRoles;
  const isHost = Boolean(real && user && real.host_id === user.id);
  const images = real ? (imagesQuery.data ?? []) : [];
  const [heroIndex, setHeroIndex] = useState(0);
  const heroUrl = images[heroIndex]?.url ?? images[0]?.url ?? undefined;

  const handleAddImage = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file || !real) return;
    const result = await uploadImage.mutateAsync({ file, kind: "awase" });
    addImage.mutate({ awaseId: real.id, storagePath: result.key, sort: images.length });
  };
  const handleRemoveImage = (id: string, storagePath: string) => {
    if (!real) return;
    removeImage.mutate({ awaseId: real.id, id, storagePath });
    setHeroIndex(0);
  };

  const [confirmApply, setConfirmApply] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [editing, setEditing] = useState(false);
  const [eTitle, setETitle] = useState("");
  const [eBody, setEBody] = useState("");
  const [eDate, setEDate] = useState("");
  const [ePlace, setEPlace] = useState("");
  const [eRegion, setERegion] = useState("");
  const [eFee, setEFee] = useState("");
  const [eCapacity, setECapacity] = useState("");
  const [eWomenOnly, setEWomenOnly] = useState(false);
  const [eBeginnerOk, setEBeginnerOk] = useState(false);
  const [eTags, setETags] = useState<string[]>([]);

  const title = real?.title ?? "魔法学園シリーズ 生徒会併せ";
  const workName = real?.works?.name ?? "葬送のフリーレン";
  const worldTag = real?.world_tags?.[0] ?? "透明感";
  const hostName = real?.profiles?.display_name ?? "澪 / mio";
  const hostVerified = real?.profiles?.is_verified ?? true;
  const hostAchievements = useAwaseAchievementCount(real?.host_id);
  const hostAchievementCount = real ? (hostAchievements.data ?? 0) : 36;
  const infoGrid = real
    ? [
        { label: "日程", value: real.event_date },
        { label: "場所", value: real.place ?? "未定" },
        { label: "募集人数", value: real.capacity ? `定員${real.capacity}名` : "募集中" },
        { label: "費用", value: real.fee_text ?? "応相談" },
      ]
    : mockInfoGrid;
  const bodyText =
    real?.body ||
    "生徒会メンバーで併せをします◎ 透明感のある世界観で、自然光メインのスタジオ撮影予定。カメラマンさん1名にも入っていただけると嬉しいです。初めての方も歓迎、当日は和やかに進めます。";

  const handleApply = () => {
    setConfirmApply(false);
    if (real && user) {
      apply.mutate({ awaseId: real.id, applicantId: user.id });
    }
    nav("applied");
  };

  const openEdit = () => {
    if (!real) return;
    setETitle(real.title);
    setEBody(real.body ?? "");
    setEDate(real.event_date);
    setEPlace(real.place ?? "");
    setERegion(real.region);
    setEFee(real.fee_text ?? "");
    setECapacity(real.capacity != null ? String(real.capacity) : "");
    setEWomenOnly(real.women_only);
    setEBeginnerOk(real.beginner_ok);
    setETags(real.world_tags ?? []);
    setEditing(true);
  };
  const saveEdit = () => {
    if (!real || !eTitle.trim() || !eDate.trim() || !eRegion) return;
    const cap = eCapacity.trim() ? Number(eCapacity) : null;
    updateAwase.mutate(
      {
        awaseId: real.id,
        title: eTitle.trim(),
        eventDate: eDate.trim(),
        region: eRegion,
        place: ePlace.trim() || null,
        feeText: eFee.trim() || null,
        body: eBody.trim() || null,
        capacity: cap != null && Number.isFinite(cap) && cap > 0 ? cap : null,
        womenOnly: eWomenOnly,
        beginnerOk: eBeginnerOk,
        worldTags: eTags,
      },
      { onSuccess: () => setEditing(false) },
    );
  };
  const doDelete = () => {
    if (!real) return;
    deleteAwase.mutate(
      { awaseId: real.id },
      { onSuccess: () => nav("home", "home") },
    );
  };

  const [copied, setCopied] = useState(false);
  const handleShare = async () => {
    if (typeof window === "undefined") return;
    const url = window.location.href;
    const shareData = { title: `${title}｜プルミエ！`, text: `${title}（${workName}）`, url };
    try {
      if (navigator.share) {
        await navigator.share(shareData);
      } else if (navigator.clipboard) {
        await navigator.clipboard.writeText(url);
        setCopied(true);
        window.setTimeout(() => setCopied(false), 1800);
      }
    } catch {
      // user cancelled the share sheet — nothing to do
    }
  };

  return (
    <div>
      {/* app bar */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          padding: "10px 18px 8px",
        }}
      >
        <button
          onClick={back}
          style={{ background: "none", border: "none", cursor: "pointer", padding: 0 }}
          aria-label="戻る"
        >
          <ChevronLeftIcon size={24} />
        </button>
        <div style={{ fontSize: 14, fontWeight: 600, color: colors.textPrimaryAlt }}>募集の詳細</div>
        <button
          onClick={handleShare}
          style={{ background: "none", border: "none", cursor: "pointer", padding: 0 }}
          aria-label="共有"
        >
          <ShareIcon />
        </button>
      </div>

      {copied && (
        <div
          style={{
            position: "fixed",
            left: "50%",
            bottom: 90,
            transform: "translateX(-50%)",
            background: "rgba(38,34,47,.92)",
            color: colors.white,
            fontSize: 12.5,
            fontWeight: 600,
            padding: "10px 18px",
            borderRadius: 999,
            zIndex: 50,
            whiteSpace: "nowrap",
          }}
        >
          リンクをコピーしました
        </div>
      )}

      {/* hero */}
      <div style={{ position: "relative", padding: "6px 22px 0" }}>
        <div style={{ height: 194 }}>
          <ImageSlot radius={18} src={heroUrl} />
        </div>
        <span
          style={{
            position: "absolute",
            left: 34,
            top: 18,
            fontSize: 11,
            fontWeight: 600,
            color: colors.white,
            background: "rgba(109,93,171,.92)",
            padding: "6px 12px",
            borderRadius: 999,
          }}
        >
          募集中
        </span>
        {(real ? real.women_only : true) && (
          <span
            style={{
              position: "absolute",
              right: 34,
              top: 18,
              fontSize: 11,
              fontWeight: 600,
              color: colors.pinkText,
              background: "rgba(255,255,255,.92)",
              padding: "6px 12px",
              borderRadius: 999,
            }}
          >
            女性限定
          </span>
        )}
      </div>

      {/* thumbnails (when the awase has more than one image) */}
      {images.length > 1 && (
        <div className="noscroll" style={{ display: "flex", gap: 8, overflowX: "auto", padding: "10px 22px 0" }}>
          {images.map((img, i) => (
            <button
              key={img.id}
              onClick={() => setHeroIndex(i)}
              aria-label={`画像 ${i + 1}`}
              style={{
                flex: "0 0 auto",
                width: 56,
                height: 56,
                padding: 0,
                border: i === heroIndex ? `2px solid ${colors.primary}` : "2px solid transparent",
                borderRadius: 12,
                overflow: "hidden",
                cursor: "pointer",
                background: "none",
              }}
            >
              <ImageSlot radius={10} src={img.url ?? undefined} />
            </button>
          ))}
        </div>
      )}

      {/* title + tags */}
      <div style={{ padding: "18px 22px 0" }}>
        <h2 style={{ margin: 0, fontSize: 21, lineHeight: 1.4, fontWeight: 700, color: colors.textPrimary }}>
          {title}
        </h2>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginTop: 12 }}>
          <span
            style={{
              fontSize: 11.5,
              color: colors.primary,
              background: colors.primaryBg1,
              padding: "6px 12px",
              borderRadius: 999,
              fontWeight: 500,
            }}
          >
            {workName}
          </span>
          {worldTag && (
            <span
              style={{
                fontSize: 11.5,
                color: "#4A4458",
                border: `1px solid ${colors.border}`,
                padding: "6px 12px",
                borderRadius: 999,
              }}
            >
              {worldTag}
            </span>
          )}
        </div>
      </div>

      {/* host card */}
      <div style={{ padding: "18px 22px 0" }}>
        <button
          onClick={() => (real ? openProfile(real.host_id) : nav("profile", "mypage"))}
          style={{
            width: "100%",
            display: "flex",
            alignItems: "center",
            gap: 12,
            border: `1px solid ${colors.borderSoft}`,
            borderRadius: 16,
            padding: "12px 14px",
            background: colors.primaryBg5,
            cursor: "pointer",
            fontFamily: "inherit",
            textAlign: "left",
          }}
        >
          <div style={{ width: 44, height: 44, borderRadius: "50%", overflow: "hidden", flex: "0 0 auto" }}>
            <ImageSlot circle />
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 13.5, fontWeight: 700, color: colors.textPrimary }}>主催・{hostName}</div>
            <div style={{ fontSize: 11, color: colors.textMutedAlt, marginTop: 2 }}>
              {hostVerified ? "本人確認済" : "本人確認前"} · 併せ実績 {hostAchievementCount}回
            </div>
          </div>
          <span style={{ fontSize: 11.5, color: colors.primary, fontWeight: 600, whiteSpace: "nowrap" }}>
            プロフ →
          </span>
        </button>
      </div>

      {/* info grid */}
      <div style={{ padding: "20px 22px 0" }}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
          {infoGrid.map((it) => (
            <div
              key={it.label}
              style={{ border: `1px solid ${colors.borderSoft}`, borderRadius: 14, padding: "13px 14px" }}
            >
              <div style={{ fontSize: 10.5, color: colors.textMutedAlt }}>{it.label}</div>
              <div style={{ fontSize: 13, fontWeight: 700, color: colors.textPrimary, marginTop: 5 }}>
                {it.value}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* body */}
      <div style={{ padding: "24px 22px 0" }}>
        <SectionHeading size={15}>募集内容</SectionHeading>
        <p style={{ margin: "12px 0 0", fontSize: 13, lineHeight: 1.9, color: colors.textSecondary }}>
          {bodyText}
        </p>
      </div>

      {/* roles */}
      <div style={{ padding: "22px 22px 26px" }}>
        <SectionHeading size={15}>募集キャラ</SectionHeading>
        <div style={{ display: "flex", flexDirection: "column", gap: 9, marginTop: 13 }}>
          {roles.map((ro) => {
            const confirmed = ro.status === "確定";
            // カメラマン専用プロフィール画面は実データ未接続のため、当面は遷移
            // させない（役割は一覧表示のみ）。接続時にここへ導線を戻す。
            return (
              <div
                key={ro.key}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 12,
                  border: `1px solid ${colors.borderSoft}`,
                  borderRadius: 14,
                  padding: "11px 13px",
                  background: confirmed ? colors.primaryBg5 : colors.white,
                }}
              >
                <div
                  style={{
                    width: 38,
                    height: 38,
                    borderRadius: "50%",
                    overflow: "hidden",
                    flex: "0 0 auto",
                    background: colors.primaryBg1,
                  }}
                >
                  <ImageSlot circle />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: colors.textPrimary }}>{ro.char}</div>
                  <div style={{ fontSize: 11, color: colors.textMutedAlt, marginTop: 2 }}>{ro.who}</div>
                </div>
                <span
                  style={{
                    fontSize: 11,
                    fontWeight: 600,
                    color: confirmed ? colors.primary : colors.pinkText,
                    background: confirmed ? colors.primaryBg1 : colors.pinkBg1,
                    padding: "5px 11px",
                    borderRadius: 999,
                    whiteSpace: "nowrap",
                  }}
                >
                  {ro.status}
                </span>
              </div>
            );
          })}
        </div>
        {isHost ? (
          <div style={{ display: "flex", gap: 9, marginTop: 22 }}>
            <button
              onClick={openEdit}
              style={{
                flex: 1,
                border: `1px solid ${colors.border}`,
                background: colors.white,
                color: colors.primary,
                fontFamily: "inherit",
                fontSize: 13,
                fontWeight: 700,
                padding: "13px 0",
                borderRadius: 13,
                cursor: "pointer",
              }}
            >
              編集する
            </button>
            <button
              onClick={() => setConfirmDelete(true)}
              style={{
                flex: 1,
                border: "1px solid #E7C6C4",
                background: colors.white,
                color: "#C0453F",
                fontFamily: "inherit",
                fontSize: 13,
                fontWeight: 700,
                padding: "13px 0",
                borderRadius: 13,
                cursor: "pointer",
              }}
            >
              削除する
            </button>
          </div>
        ) : (
          <>
            <PrimaryButton onClick={() => setConfirmApply(true)} style={{ marginTop: 22 }}>
              この併せに応募する
            </PrimaryButton>
            <button
              onClick={() =>
                real
                  ? openReport({ type: "awase", id: real.id, userId: real.host_id })
                  : nav("report")
              }
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 6,
                width: "100%",
                marginTop: 14,
                border: "none",
                background: "none",
                color: colors.textMutedAlt,
                fontFamily: "inherit",
                fontSize: 12,
                padding: 8,
                cursor: "pointer",
              }}
            >
              <FlagIcon size={14} color={colors.textMutedAlt} />
              この募集を通報する
            </button>
          </>
        )}
      </div>

      {/* apply confirmation — avoids accidental taps */}
      {confirmApply && (
        <ConfirmDialog
          title="この併せに応募しますか？"
          body="主催者にあなたのプロフィールが通知されます。"
          confirmLabel="応募する"
          onConfirm={handleApply}
          onCancel={() => setConfirmApply(false)}
        />
      )}

      {/* delete confirmation (host) */}
      {confirmDelete && (
        <ConfirmDialog
          title="この募集を削除しますか？"
          body="応募・募集キャラ・画像も含めて削除され、元に戻せません。"
          confirmLabel={deleteAwase.isPending ? "削除中…" : "削除する"}
          danger
          disabled={deleteAwase.isPending}
          onConfirm={doDelete}
          onCancel={() => setConfirmDelete(false)}
        />
      )}

      {/* edit form (host) */}
      {editing && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 90,
            background: "rgba(20,14,28,.5)",
            display: "flex",
            alignItems: "flex-end",
            justifyContent: "center",
          }}
          onClick={() => setEditing(false)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              width: "100%",
              maxWidth: 560,
              maxHeight: "88vh",
              overflowY: "auto",
              background: colors.white,
              borderTopLeftRadius: 20,
              borderTopRightRadius: 20,
              padding: "20px 20px 28px",
            }}
          >
            <div style={{ fontSize: 15, fontWeight: 700, color: colors.textPrimary, marginBottom: 14 }}>
              募集を編集
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 13 }}>
              <Field label="画像">
                <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginTop: 6 }}>
                  {images.map((img) => (
                    <div key={img.id} style={{ position: "relative", width: 76, height: 76 }}>
                      <ImageSlot radius={12} src={img.url ?? undefined} />
                      <button
                        onClick={() => handleRemoveImage(img.id, img.storagePath)}
                        aria-label="画像を削除"
                        style={{
                          position: "absolute",
                          right: 3,
                          top: 3,
                          width: 22,
                          height: 22,
                          borderRadius: "50%",
                          border: "none",
                          background: "rgba(30,20,40,.65)",
                          color: colors.white,
                          fontSize: 14,
                          lineHeight: 1,
                          cursor: "pointer",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                        }}
                      >
                        ×
                      </button>
                    </div>
                  ))}
                  {images.length < 4 && (
                    <button
                      type="button"
                      onClick={() => imageInputRef.current?.click()}
                      disabled={uploadImage.isPending || addImage.isPending}
                      aria-label="画像を追加"
                      style={{
                        width: 76,
                        height: 76,
                        border: "1.5px dashed #D8D2E6",
                        borderRadius: 12,
                        background: colors.primaryBg5,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        cursor: uploadImage.isPending ? "not-allowed" : "pointer",
                      }}
                    >
                      <PlusIcon size={20} color={colors.textMutedAlt} />
                    </button>
                  )}
                </div>
                <input ref={imageInputRef} type="file" accept="image/*" onChange={handleAddImage} style={{ display: "none" }} />
              </Field>
              <Field label="タイトル *">
                <input value={eTitle} onChange={(e) => setETitle(e.target.value)} style={editInput} placeholder="タイトル" />
              </Field>
              <Field label="募集内容">
                <textarea value={eBody} onChange={(e) => setEBody(e.target.value)} rows={4} style={{ ...editInput, resize: "none", lineHeight: 1.7 }} placeholder="どんな併せか、集合や費用の目安など" />
              </Field>
              <div style={{ display: "flex", gap: 10 }}>
                <Field label="日程 *" flex>
                  <input value={eDate} onChange={(e) => setEDate(e.target.value)} style={editInput} placeholder="例：7/26(日)" />
                </Field>
                <Field label="地域 *" flex>
                  <select value={eRegion} onChange={(e) => setERegion(e.target.value)} style={{ ...editInput, appearance: "none" }}>
                    <option value="">選択</option>
                    {editableRegions.map((r) => (
                      <option key={r} value={r}>{r}</option>
                    ))}
                  </select>
                </Field>
              </div>
              <div style={{ display: "flex", gap: 10 }}>
                <Field label="場所" flex>
                  <input value={ePlace} onChange={(e) => setEPlace(e.target.value)} style={editInput} placeholder="例：都内スタジオ" />
                </Field>
                <Field label="募集人数（定員）" flex>
                  <input value={eCapacity} onChange={(e) => setECapacity(e.target.value.replace(/[^0-9]/g, ""))} inputMode="numeric" style={editInput} placeholder="例：6" />
                </Field>
              </div>
              <Field label="費用">
                <input value={eFee} onChange={(e) => setEFee(e.target.value)} style={editInput} placeholder="例：スタジオ代 割り勘" />
              </Field>
              <Field label="世界観タグ">
                <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                  {EDIT_WORLD_TAGS.map((t) => {
                    const on = eTags.includes(t);
                    return (
                      <button
                        key={t}
                        type="button"
                        onClick={() => setETags((c) => (c.includes(t) ? c.filter((x) => x !== t) : [...c, t]))}
                        style={{
                          fontSize: 12,
                          color: on ? colors.white : "#4A4458",
                          background: on ? colors.primary : colors.white,
                          border: `1px solid ${on ? colors.primary : colors.border}`,
                          padding: "7px 13px",
                          borderRadius: 999,
                          fontWeight: on ? 600 : 500,
                          cursor: "pointer",
                          fontFamily: "inherit",
                        }}
                      >
                        {t}
                      </button>
                    );
                  })}
                </div>
              </Field>
              <EditToggle label="女性限定で募集" on={eWomenOnly} onChange={setEWomenOnly} />
              <EditToggle label="初心者歓迎" on={eBeginnerOk} onChange={setEBeginnerOk} />
              {updateAwase.isError && (
                <div style={{ fontSize: 12, color: "#C0453F" }}>保存に失敗しました。時間をおいて再度お試しください。</div>
              )}
            </div>
            <div style={{ display: "flex", gap: 8, marginTop: 18 }}>
              <button
                onClick={() => setEditing(false)}
                style={{ flex: 1, border: `1px solid ${colors.border}`, background: colors.white, color: colors.textSecondary, fontFamily: "inherit", fontSize: 13, fontWeight: 600, padding: "12px 0", borderRadius: 12, cursor: "pointer" }}
              >
                キャンセル
              </button>
              <button
                onClick={saveEdit}
                disabled={!eTitle.trim() || !eDate.trim() || !eRegion || updateAwase.isPending}
                style={{
                  flex: 2,
                  border: "none",
                  background: colors.primary,
                  color: colors.white,
                  fontFamily: "inherit",
                  fontSize: 13,
                  fontWeight: 700,
                  padding: "12px 0",
                  borderRadius: 12,
                  cursor: "pointer",
                  opacity: eTitle.trim() && eDate.trim() && eRegion && !updateAwase.isPending ? 1 : 0.5,
                }}
              >
                {updateAwase.isPending ? "保存中…" : "保存する"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

const editInput: CSSProperties = {
  width: "100%",
  marginTop: 6,
  border: "1px solid #E4DFEF",
  borderRadius: 12,
  padding: "11px 13px",
  fontSize: 13.5,
  fontFamily: "inherit",
  color: "#26222F",
  background: "#fff",
  outline: "none",
};

function Field({ label, children, flex }: { label: string; children: ReactNode; flex?: boolean }) {
  return (
    <div style={flex ? { flex: 1, minWidth: 0 } : undefined}>
      <label style={{ fontSize: 12, fontWeight: 700, color: colors.textSecondary }}>{label}</label>
      {children}
    </div>
  );
}

function EditToggle({ label, on, onChange }: { label: string; on: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      type="button"
      onClick={() => onChange(!on)}
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        border: `1px solid ${colors.borderSoft}`,
        borderRadius: 12,
        padding: "11px 14px",
        background: colors.primaryBg5,
        cursor: "pointer",
        fontFamily: "inherit",
      }}
    >
      <span style={{ fontSize: 13, fontWeight: 600, color: colors.textPrimary }}>{label}</span>
      <span
        style={{
          width: 40,
          height: 24,
          borderRadius: 999,
          background: on ? colors.primary : "#D8D2E6",
          position: "relative",
          transition: "background .15s",
          flex: "0 0 auto",
        }}
      >
        <span
          style={{
            position: "absolute",
            top: 3,
            left: on ? 19 : 3,
            width: 18,
            height: 18,
            borderRadius: "50%",
            background: "#fff",
            transition: "left .15s",
          }}
        />
      </span>
    </button>
  );
}

function ConfirmDialog({
  title,
  body,
  confirmLabel,
  danger,
  disabled,
  onConfirm,
  onCancel,
}: {
  title: string;
  body?: string;
  confirmLabel: string;
  danger?: boolean;
  disabled?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  return (
    <div
      onClick={onCancel}
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 100,
        background: "rgba(20,14,28,.5)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 24,
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{ width: "100%", maxWidth: 320, background: colors.white, borderRadius: 18, padding: "20px 20px 16px" }}
      >
        <div style={{ fontSize: 15, fontWeight: 700, color: colors.textPrimary, textAlign: "center" }}>{title}</div>
        {body && (
          <p style={{ margin: "9px 0 0", fontSize: 12.5, color: colors.textMutedAlt, lineHeight: 1.7, textAlign: "center" }}>
            {body}
          </p>
        )}
        <div style={{ display: "flex", gap: 8, marginTop: 18 }}>
          <button
            onClick={onCancel}
            style={{ flex: 1, border: `1px solid ${colors.border}`, background: colors.white, color: colors.textSecondary, fontFamily: "inherit", fontSize: 13, fontWeight: 600, padding: "11px 0", borderRadius: 12, cursor: "pointer" }}
          >
            キャンセル
          </button>
          <button
            onClick={onConfirm}
            disabled={disabled}
            style={{
              flex: 1,
              border: "none",
              background: danger ? "#C0453F" : colors.primary,
              color: colors.white,
              fontFamily: "inherit",
              fontSize: 13,
              fontWeight: 700,
              padding: "11px 0",
              borderRadius: 12,
              cursor: disabled ? "default" : "pointer",
              opacity: disabled ? 0.6 : 1,
            }}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
