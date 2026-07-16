"use client";

import { useEffect, useRef, useState } from "react";
import { colors } from "@/lib/tokens";
import { onboardWorks as mockWorks, regions } from "@/lib/data";
import { useRouter } from "../AppRouter";
import { PrimaryButton, Toggle } from "../ui";
import { PlusIcon } from "../icons";
import { ImageSlot } from "../ImageSlot";
import { useAuth } from "@/lib/auth/useAuth";
import {
  useAwase,
  useAwaseTemplates,
  useCreateAwase,
  useDeleteAwaseTemplate,
  useSaveAwaseTemplate,
  type AwaseTemplate,
} from "@/lib/queries/awase";
import { useWorks } from "@/lib/queries/works";
import { WorkPicker } from "../WorkPicker";
import { useUploadImage } from "@/lib/queries/upload";
import { isSupabaseConfigured } from "@/lib/supabase/config";

const inputBox: React.CSSProperties = {
  width: "100%",
  marginTop: 8,
  border: `1px solid ${colors.border}`,
  borderRadius: 13,
  padding: "13px 15px",
  fontSize: 13.5,
  color: colors.textPrimary,
  fontWeight: 500,
  fontFamily: "inherit",
  background: colors.white,
  outline: "none",
};

const label: React.CSSProperties = {
  fontSize: 12.5,
  fontWeight: 700,
  color: "#3A3548",
};

const creatableRegions = regions.filter((r) => r !== "すべて");
const WORLD_TAGS = ["透明感", "ファンタジー", "和風", "サイバー", "ナチュラル", "ダーク", "かわいい系", "クール系"];

/** datetime-local ("YYYY-MM-DDTHH:mm", ローカル時刻) → ISO文字列。空なら null。 */
function localToIso(v: string): string | null {
  if (!v.trim()) return null;
  const d = new Date(v);
  return Number.isNaN(d.getTime()) ? null : d.toISOString();
}

// 併せ作成フォームの下書き。スタジオ検索などへ一時的に離れても入力が消えないよう
// sessionStorage に保存し、戻ったときに復元する。公開成功で破棄する。
const DRAFT_KEY = "premier:awase-create-draft";
interface CreateDraft {
  title: string;
  workId: string;
  eventDate: string;
  region: string;
  womenOnly: boolean;
  beginnerOk: boolean;
  acceptWaitlist: boolean;
  worldTags: string[];
  place: string;
  feeText: string;
  capacity: string;
  body: string;
  publishAt: string;
  applicationDeadline: string;
  images: { key: string; url: string | null }[];
}
function readDraft(): Partial<CreateDraft> {
  if (typeof window === "undefined") return {};
  try {
    const raw = window.sessionStorage.getItem(DRAFT_KEY);
    return raw ? (JSON.parse(raw) as Partial<CreateDraft>) : {};
  } catch {
    return {};
  }
}
function clearDraft() {
  if (typeof window === "undefined") return;
  try {
    window.sessionStorage.removeItem(DRAFT_KEY);
  } catch {
    /* ignore */
  }
}

export function CreateScreen() {
  const { nav, duplicateAwaseId } = useRouter();
  const { user } = useAuth();
  const configured = isSupabaseConfigured();

  const worksQuery = useWorks();
  const duplicateSource = useAwase(duplicateAwaseId);
  const createAwase = useCreateAwase();
  const templatesQuery = useAwaseTemplates(user?.id);
  const saveTemplate = useSaveAwaseTemplate();
  const deleteTemplate = useDeleteAwaseTemplate();
  const uploadImage = useUploadImage();
  const fileInputRef = useRef<HTMLInputElement>(null);
  // Real works (id/name) once connected; the handoff's mock list otherwise.
  const works = configured
    ? (worksQuery.data ?? []).map((w) => ({ id: w.id, name: w.name }))
    : mockWorks.map((w) => ({ id: w.key, name: w.name }));

  // マウント時に一度だけ下書きを読み込み、各フィールドの初期値にする。
  const [draft] = useState<Partial<CreateDraft>>(() => readDraft());
  const [title, setTitle] = useState(draft.title ?? "");
  const [workId, setWorkId] = useState(draft.workId ?? "");
  const [eventDate, setEventDate] = useState(draft.eventDate ?? "");
  const [region, setRegion] = useState(draft.region ?? "");
  const [womenOnly, setWomenOnly] = useState(draft.womenOnly ?? false);
  const [beginnerOk, setBeginnerOk] = useState(draft.beginnerOk ?? false);
  const [acceptWaitlist, setAcceptWaitlist] = useState(draft.acceptWaitlist ?? false);
  const [worldTags, setWorldTags] = useState<string[]>(draft.worldTags ?? []);
  const [place, setPlace] = useState(draft.place ?? "");
  const [feeText, setFeeText] = useState(draft.feeText ?? "");
  const [capacity, setCapacity] = useState(draft.capacity ?? "");
  const [body, setBody] = useState(draft.body ?? "");
  const [publishAt, setPublishAt] = useState(draft.publishAt ?? "");
  const [applicationDeadline, setApplicationDeadline] = useState(draft.applicationDeadline ?? "");
  // チェックが入っている間は日時入力を無効化し、値を空（＝今すぐ公開／締切なし）に保つ。
  const [publishNow, setPublishNow] = useState(!draft.publishAt);
  const [noDeadline, setNoDeadline] = useState(!draft.applicationDeadline);
  const [templateName, setTemplateName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [images, setImages] = useState<{ key: string; url: string | null }[]>(draft.images ?? []);
  const [uploadError, setUploadError] = useState<string | null>(null);

  // 入力が変わるたびに下書きを保存（スタジオ検索などへ離れても復元できるように）。
  useEffect(() => {
    if (typeof window === "undefined") return;
    const d: CreateDraft = {
      title,
      workId,
      eventDate,
      region,
      womenOnly,
      beginnerOk,
      acceptWaitlist,
      worldTags,
      place,
      feeText,
      capacity,
      body,
      publishAt,
      applicationDeadline,
      images,
    };
    try {
      window.sessionStorage.setItem(DRAFT_KEY, JSON.stringify(d));
    } catch {
      /* ignore quota / privacy-mode errors */
    }
  }, [
    title,
    workId,
    eventDate,
    region,
    womenOnly,
    beginnerOk,
    acceptWaitlist,
    worldTags,
    place,
    feeText,
    capacity,
    body,
    publishAt,
    applicationDeadline,
    images,
  ]);

  // 募集の複製: 既存併せの内容をフォームに一度だけ差し込む（画像は引き継がない）。
  const prefilledRef = useRef(false);
  useEffect(() => {
    if (prefilledRef.current || !duplicateAwaseId) return;
    const src = duplicateSource.data;
    if (!src) return;
    prefilledRef.current = true;
    setTitle(src.title);
    setWorkId(src.work_id ?? "");
    setEventDate(src.event_date);
    setRegion(src.region);
    setWomenOnly(src.women_only);
    setBeginnerOk(src.beginner_ok);
    setAcceptWaitlist(src.accept_waitlist);
    setWorldTags(src.world_tags ?? []);
    setPlace(src.place ?? "");
    setFeeText(src.fee_text ?? "");
    setCapacity(src.capacity != null ? String(src.capacity) : "");
    setBody(src.body ?? "");
  }, [duplicateAwaseId, duplicateSource.data]);

  const applyTemplate = (t: AwaseTemplate) => {
    setTitle(t.title);
    setWorkId(t.workId ?? "");
    setRegion(t.region);
    setPlace(t.place ?? "");
    setFeeText(t.feeText ?? "");
    setBody(t.body ?? "");
    setCapacity(t.capacity != null ? String(t.capacity) : "");
    setWomenOnly(t.womenOnly);
    setBeginnerOk(t.beginnerOk);
    setWorldTags(t.worldTags);
  };

  const handleSaveTemplate = () => {
    if (!user || !templateName.trim()) return;
    saveTemplate.mutate(
      {
        hostId: user.id,
        name: templateName.trim(),
        title: title.trim(),
        workId: workId || null,
        region,
        place: place.trim() || null,
        feeText: feeText.trim() || null,
        body: body.trim() || null,
        capacity: capacity.trim() ? Number(capacity) : null,
        womenOnly,
        beginnerOk,
        worldTags,
      },
      { onSuccess: () => setTemplateName("") },
    );
  };

  const handlePickImage = () => {
    if (!configured) return; // uploads need R2 + a signed-in host; no-op in pure prototype mode
    fileInputRef.current?.click();
  };

  const handleFileSelected = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = ""; // allow re-selecting the same file later
    if (!file) return;
    setUploadError(null);
    try {
      const result = await uploadImage.mutateAsync({ file, kind: "awase" });
      setImages((cur) => [...cur, result]);
    } catch (err) {
      setUploadError(err instanceof Error ? err.message : "アップロードに失敗しました");
    }
  };

  const handlePublish = async () => {
    setError(null);
    if (!title.trim() || !workId || !eventDate.trim() || !region) {
      setError("タイトル・作品・日程・地域は必須です");
      return;
    }
    const pubIso = localToIso(publishAt);
    const deadIso = localToIso(applicationDeadline);
    if (pubIso && deadIso && deadIso <= pubIso) {
      setError("応募締切は公開日時より後にしてください");
      return;
    }
    if (configured && user) {
      setSubmitting(true);
      try {
        const cap = capacity.trim() ? Number(capacity) : null;
        await createAwase.mutateAsync({
          hostId: user.id,
          title: title.trim(),
          workId,
          eventDate: eventDate.trim(),
          region,
          womenOnly,
          beginnerOk,
          worldTags,
          place: place.trim() || null,
          feeText: feeText.trim() || null,
          body: body.trim() || null,
          capacity: cap != null && Number.isFinite(cap) && cap > 0 ? cap : null,
          publishAt: localToIso(publishAt),
          applicationDeadline: localToIso(applicationDeadline),
          acceptWaitlist,
          imageKeys: images.map((img) => img.key),
        });
        clearDraft();
        nav("created");
      } catch (e) {
        setError(e instanceof Error ? e.message : "公開に失敗しました");
      } finally {
        setSubmitting(false);
      }
      return;
    }
    clearDraft();
    nav("created"); // prototype mode: no backend to persist to
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
          onClick={() => {
            clearDraft(); // 明示的なキャンセルは下書きを破棄（スタジオ検索への遷移は保持）
            nav("home", "home");
          }}
          style={{
            background: "none",
            border: "none",
            fontSize: 13.5,
            color: colors.textMutedAlt,
            cursor: "pointer",
            fontFamily: "inherit",
          }}
        >
          キャンセル
        </button>
        <div style={{ fontSize: 14, fontWeight: 600, color: colors.textPrimaryAlt }}>
          {duplicateAwaseId ? "併せ募集を複製" : "併せ募集を作成"}
        </div>
        {/* spacer keeps the title centered (the old 下書き/進捗表示は未実装のため撤去) */}
        <span style={{ width: 52 }} />
      </div>

      {duplicateAwaseId && (
        <div style={{ padding: "14px 22px 0" }}>
          <div style={{ fontSize: 12, color: colors.primary, background: colors.primaryBg1, borderRadius: 12, padding: "11px 14px", lineHeight: 1.6 }}>
            前回の募集内容をコピーしました。日程や内容を編集して、新しい募集として公開できます（画像は引き継がれません）。
          </div>
        </div>
      )}

      {/* saved templates (host tool; needs a backend + signed-in host) */}
      {configured && user && (
        <div style={{ padding: "18px 22px 0" }}>
          <label style={label}>テンプレート</label>
          {(templatesQuery.data ?? []).length > 0 ? (
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginTop: 10 }}>
              {(templatesQuery.data ?? []).map((t) => (
                <span
                  key={t.id}
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 6,
                    border: `1px solid ${colors.border}`,
                    borderRadius: 999,
                    padding: "6px 6px 6px 12px",
                    background: colors.white,
                  }}
                >
                  <button
                    type="button"
                    onClick={() => applyTemplate(t)}
                    style={{ border: "none", background: "none", color: colors.primary, fontSize: 12, fontWeight: 700, cursor: "pointer", fontFamily: "inherit", padding: 0 }}
                  >
                    {t.name}
                  </button>
                  <button
                    type="button"
                    onClick={() => user && deleteTemplate.mutate({ id: t.id, hostId: user.id })}
                    aria-label={`${t.name}を削除`}
                    style={{ border: "none", background: "#F1EEF6", color: colors.textMutedAlt, width: 18, height: 18, borderRadius: "50%", fontSize: 12, lineHeight: 1, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>
          ) : (
            <p style={{ margin: "8px 0 0", fontSize: 11.5, color: colors.textMutedAlt, lineHeight: 1.6 }}>
              よく使う募集内容を保存しておくと、次回から一発で呼び出せます。
            </p>
          )}
          <div style={{ display: "flex", gap: 8, marginTop: 10 }}>
            <input
              style={{ ...inputBox, marginTop: 0, flex: 1, fontSize: 12.5, padding: "10px 12px" }}
              value={templateName}
              onChange={(e) => setTemplateName(e.target.value)}
              placeholder="このフォームをテンプレ保存（名前）"
            />
            <button
              type="button"
              onClick={handleSaveTemplate}
              disabled={!templateName.trim() || saveTemplate.isPending}
              style={{
                border: `1px solid ${colors.border}`,
                background: colors.white,
                color: templateName.trim() ? colors.primary : colors.textMutedAlt,
                fontFamily: "inherit",
                fontSize: 12.5,
                fontWeight: 700,
                padding: "0 16px",
                borderRadius: 12,
                cursor: templateName.trim() ? "pointer" : "default",
                whiteSpace: "nowrap",
              }}
            >
              {saveTemplate.isPending ? "保存中…" : "保存"}
            </button>
          </div>
        </div>
      )}

      {/* reference images */}
      <div style={{ padding: "22px 22px 0" }}>
        <label style={label}>参考画像・イメージ</label>
        <div style={{ display: "flex", gap: 9, marginTop: 10 }}>
          {[0, 1].map((i) => (
            <div key={i} style={{ flex: 1, height: 92 }}>
              <ImageSlot radius={14} label={i === 0 && !images[0] ? "参考" : undefined} src={images[i]?.url} />
            </div>
          ))}
          <button
            type="button"
            onClick={handlePickImage}
            disabled={!configured || images.length >= 2 || uploadImage.isPending}
            style={{
              flex: 1,
              height: 92,
              border: "1.5px dashed #D8D2E6",
              borderRadius: 14,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              gap: 5,
              background: colors.primaryBg5,
              cursor: !configured || images.length >= 2 ? "not-allowed" : "pointer",
              opacity: images.length >= 2 ? 0.5 : 1,
              fontFamily: "inherit",
            }}
          >
            <PlusIcon size={22} color="#A79FC0" />
            <span style={{ fontSize: 10, color: "#A79FC0" }}>
              {uploadImage.isPending ? "アップロード中…" : "追加"}
            </span>
          </button>
        </div>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleFileSelected}
          style={{ display: "none" }}
        />
        {uploadError && (
          <div style={{ marginTop: 9, fontSize: 11.5, color: "#C0453F", background: "#FBEBEA", borderRadius: 10, padding: "8px 11px" }}>
            {uploadError}
          </div>
        )}
      </div>

      {/* fields */}
      <div style={{ padding: "22px 22px 0", display: "flex", flexDirection: "column", gap: 16 }}>
        <div>
          <label style={label}>タイトル *</label>
          <input
            style={inputBox}
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="例：魔法学園シリーズ 生徒会併せ"
          />
        </div>
        <div>
          <label style={label}>作品 *</label>
          <WorkPicker works={works} value={workId} onChange={setWorkId} triggerStyle={{ ...inputBox, appearance: "none" }} />
        </div>
        <div style={{ display: "flex", gap: 12 }}>
          <div style={{ flex: 1 }}>
            <label style={label}>日程 *</label>
            <input
              style={{ ...inputBox, fontSize: 13, padding: "13px 14px" }}
              value={eventDate}
              onChange={(e) => setEventDate(e.target.value)}
              placeholder="例：7/26(日)"
            />
          </div>
          <div style={{ flex: 1 }}>
            <label style={label}>地域 *</label>
            <select
              style={{ ...inputBox, fontSize: 13, padding: "13px 14px", appearance: "none" }}
              value={region}
              onChange={(e) => setRegion(e.target.value)}
            >
              <option value="">選択</option>
              {creatableRegions.map((r) => (
                <option key={r} value={r}>
                  {r}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div style={{ display: "flex", gap: 12 }}>
          <div style={{ flex: 1 }}>
            <label style={label}>
              場所
              <button
                type="button"
                onClick={() => nav("studios")}
                style={{ marginLeft: 8, border: "none", background: "none", color: colors.primary, fontSize: 11, fontWeight: 700, cursor: "pointer", fontFamily: "inherit", padding: 0 }}
              >
                スタジオを探す →
              </button>
            </label>
            <input
              style={{ ...inputBox, fontSize: 13, padding: "13px 14px" }}
              value={place}
              onChange={(e) => setPlace(e.target.value)}
              placeholder="例：都内スタジオ"
            />
          </div>
          <div style={{ flex: 1 }}>
            <label style={label}>募集人数（定員）</label>
            <input
              style={{ ...inputBox, fontSize: 13, padding: "13px 14px" }}
              value={capacity}
              onChange={(e) => setCapacity(e.target.value.replace(/[^0-9]/g, ""))}
              inputMode="numeric"
              placeholder="例：6"
            />
          </div>
        </div>

        <div>
          <label style={label}>費用</label>
          <input
            style={inputBox}
            value={feeText}
            onChange={(e) => setFeeText(e.target.value)}
            placeholder="例：スタジオ代 割り勘"
          />
        </div>

        <div>
          <label style={label}>募集内容</label>
          <textarea
            style={{ ...inputBox, lineHeight: 1.7, resize: "none" }}
            rows={4}
            value={body}
            onChange={(e) => setBody(e.target.value)}
            placeholder="どんな併せか、集合・進行・雰囲気、参加条件など"
          />
        </div>

        {/* scheduled publish + application deadline (both optional) */}
        <div style={{ display: "flex", gap: 12 }}>
          <div style={{ flex: 1 }}>
            <label style={label}>公開日時（予約）</label>
            <label style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 7, cursor: "pointer" }}>
              <input
                type="checkbox"
                checked={publishNow}
                onChange={(e) => {
                  const checked = e.target.checked;
                  setPublishNow(checked);
                  if (checked) setPublishAt("");
                }}
                style={{ width: 14, height: 14, accentColor: colors.primary }}
              />
              <span style={{ fontSize: 11.5, color: colors.textSecondary }}>今すぐ公開</span>
            </label>
            <input
              type="datetime-local"
              disabled={publishNow}
              style={{
                ...inputBox,
                fontSize: 12.5,
                padding: "12px 12px",
                marginTop: 7,
                opacity: publishNow ? 0.5 : 1,
              }}
              value={publishAt}
              onChange={(e) => setPublishAt(e.target.value)}
            />
          </div>
          <div style={{ flex: 1 }}>
            <label style={label}>応募締切</label>
            <label style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 7, cursor: "pointer" }}>
              <input
                type="checkbox"
                checked={noDeadline}
                onChange={(e) => {
                  const checked = e.target.checked;
                  setNoDeadline(checked);
                  if (checked) setApplicationDeadline("");
                }}
                style={{ width: 14, height: 14, accentColor: colors.primary }}
              />
              <span style={{ fontSize: 11.5, color: colors.textSecondary }}>締め切りなし</span>
            </label>
            <input
              type="datetime-local"
              disabled={noDeadline}
              style={{
                ...inputBox,
                fontSize: 12.5,
                padding: "12px 12px",
                marginTop: 7,
                opacity: noDeadline ? 0.5 : 1,
              }}
              value={applicationDeadline}
              onChange={(e) => setApplicationDeadline(e.target.value)}
            />
          </div>
        </div>

        {/* world tags — tap to select (saved with the 併せ) */}
        <div>
          <label style={label}>世界観タグ</label>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginTop: 10 }}>
            {WORLD_TAGS.map((t) => {
              const on = worldTags.includes(t);
              return (
                <button
                  key={t}
                  type="button"
                  onClick={() =>
                    setWorldTags((cur) => (cur.includes(t) ? cur.filter((x) => x !== t) : [...cur, t]))
                  }
                  aria-pressed={on}
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
        </div>

        {/* toggles */}
        <ToggleRow
          title="女性限定で募集"
          desc="女性の参加者だけを募集します"
          on={womenOnly}
          onChange={setWomenOnly}
        />
        <ToggleRow
          title="初心者歓迎"
          desc="コスプレ・併せが初めての方も歓迎"
          on={beginnerOk}
          onChange={setBeginnerOk}
        />
        <ToggleRow
          title="満員後もキャンセル待ちを受付"
          desc="定員に達しても自動締切せず、キャンセル待ちを受け付けます"
          on={acceptWaitlist}
          onChange={setAcceptWaitlist}
        />

        {error && (
          <div style={{ fontSize: 12, color: "#C0453F", background: "#FBEBEA", borderRadius: 10, padding: "10px 12px" }}>
            {error}
          </div>
        )}
      </div>

      <div style={{ padding: "26px 22px 30px" }}>
        <PrimaryButton onClick={handlePublish} style={submitting ? { opacity: 0.6, cursor: "not-allowed" } : undefined}>
          {submitting ? "公開中…" : "公開する"}
        </PrimaryButton>
      </div>
    </div>
  );
}

function ToggleRow({
  title,
  desc,
  on,
  onChange,
}: {
  title: string;
  desc: string;
  on: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        border: `1px solid ${colors.borderSoft}`,
        borderRadius: 14,
        padding: "13px 15px",
        background: colors.primaryBg5,
      }}
    >
      <div>
        <div style={{ fontSize: 13, fontWeight: 700, color: colors.textPrimary }}>{title}</div>
        <div style={{ fontSize: 11, color: colors.textMutedAlt, marginTop: 2 }}>{desc}</div>
      </div>
      <Toggle on={on} onChange={onChange} ariaLabel={title} />
    </div>
  );
}
