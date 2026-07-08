"use client";

import { useState } from "react";
import { colors } from "@/lib/tokens";
import { onboardWorks as mockWorks, regions } from "@/lib/data";
import { useRouter } from "../AppRouter";
import { PrimaryButton, Toggle } from "../ui";
import { PlusIcon } from "../icons";
import { ImageSlot } from "../ImageSlot";
import { useAuth } from "@/lib/auth/useAuth";
import { useCreateAwase } from "@/lib/queries/awase";
import { useWorks } from "@/lib/queries/works";
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

export function CreateScreen() {
  const { nav } = useRouter();
  const { user } = useAuth();
  const configured = isSupabaseConfigured();

  const worksQuery = useWorks();
  const createAwase = useCreateAwase();
  // Real works (id/name) once connected; the handoff's mock list otherwise.
  const works = configured
    ? (worksQuery.data ?? []).map((w) => ({ id: w.id, name: w.name }))
    : mockWorks.map((w) => ({ id: w.key, name: w.name }));

  const [title, setTitle] = useState("");
  const [workId, setWorkId] = useState("");
  const [eventDate, setEventDate] = useState("");
  const [region, setRegion] = useState("");
  const [womenOnly, setWomenOnly] = useState(true);
  const [beginnerOk, setBeginnerOk] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const handlePublish = async () => {
    setError(null);
    if (!title.trim() || !workId || !eventDate.trim() || !region) {
      setError("タイトル・作品・日程・地域は必須です");
      return;
    }
    if (configured && user) {
      setSubmitting(true);
      try {
        await createAwase.mutateAsync({
          hostId: user.id,
          title: title.trim(),
          workId,
          eventDate: eventDate.trim(),
          region,
          womenOnly,
          beginnerOk,
        });
        nav("created");
      } catch (e) {
        setError(e instanceof Error ? e.message : "公開に失敗しました");
      } finally {
        setSubmitting(false);
      }
      return;
    }
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
          onClick={() => nav("home", "home")}
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
        <div style={{ fontSize: 14, fontWeight: 600, color: colors.textPrimaryAlt }}>併せ募集を作成</div>
        <span style={{ fontSize: 13.5, color: "#C6C0D2" }}>下書き</span>
      </div>

      {/* progress */}
      <div style={{ padding: "8px 22px 0" }}>
        <div style={{ height: 4, borderRadius: 99, background: "#EEEAF6", overflow: "hidden" }}>
          <div
            style={{ width: "60%", height: "100%", background: "linear-gradient(90deg,#8B79C4,#6D5DAB)" }}
          />
        </div>
        <div style={{ fontSize: 10.5, color: colors.textMutedAlt, marginTop: 7 }}>
          ステップ 2 / 3 · 基本情報
        </div>
      </div>

      {/* reference images */}
      <div style={{ padding: "22px 22px 0" }}>
        <label style={label}>参考画像・イメージ</label>
        <div style={{ display: "flex", gap: 9, marginTop: 10 }}>
          <div style={{ flex: 1, height: 92 }}>
            <ImageSlot radius={14} label="参考" />
          </div>
          <div style={{ flex: 1, height: 92 }}>
            <ImageSlot radius={14} />
          </div>
          <div
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
            }}
          >
            <PlusIcon size={22} color="#A79FC0" />
            <span style={{ fontSize: 10, color: "#A79FC0" }}>追加</span>
          </div>
        </div>
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
          <select style={{ ...inputBox, appearance: "none" }} value={workId} onChange={(e) => setWorkId(e.target.value)}>
            <option value="">選択してください</option>
            {works.map((w) => (
              <option key={w.id} value={w.id}>
                {w.name}
              </option>
            ))}
          </select>
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

        {/* world tags */}
        <div>
          <label style={label}>世界観タグ</label>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginTop: 10 }}>
            {["透明感", "ファンタジー"].map((t) => (
              <span
                key={t}
                style={{
                  fontSize: 12,
                  color: colors.white,
                  background: colors.primary,
                  padding: "7px 13px",
                  borderRadius: 999,
                  fontWeight: 500,
                }}
              >
                {t}
              </span>
            ))}
            <span
              style={{
                fontSize: 12,
                color: "#A79FC0",
                border: "1px dashed #D8D2E6",
                padding: "7px 13px",
                borderRadius: 999,
              }}
            >
              ＋ 追加
            </span>
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
