"use client";

import { useEffect, useRef, useState, type CSSProperties, type ReactNode } from "react";
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
  useAwaseApplicantCount,
  useAwaseImages,
  useAwaseRoles,
  useDeleteAwase,
  useMyApplication,
  useRemoveAwaseImage,
  useSetAwaseCover,
  useSetAwaseRoles,
  useUpdateAwase,
} from "@/lib/queries/awase";
import { useAwaseAchievementCount, useProfile } from "@/lib/queries/profile";
import { useAwaseGroupChat } from "@/lib/queries/messages";
import { useUploadImage } from "@/lib/queries/upload";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { workGradient } from "../WorkCover";
import { AwaseCover } from "../AwaseCover";
import { ScheduleSection } from "../ScheduleSection";
import { siteTagline } from "@/lib/data";

const EDIT_WORLD_TAGS = ["透明感", "ファンタジー", "和風", "サイバー", "ナチュラル", "ダーク", "かわいい系", "クール系"];
const editableRegions = regions.filter((r) => r !== "すべて");

/** datetime-local ("YYYY-MM-DDTHH:mm", ローカル時刻) → ISO文字列。空なら null。 */
function localToIso(v: string): string | null {
  if (!v.trim()) return null;
  const d = new Date(v);
  return Number.isNaN(d.getTime()) ? null : d.toISOString();
}
/** ISO文字列 → datetime-local の value（ローカル時刻）。null は空文字。 */
function isoToLocalInput(iso: string | null): string {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}
/** 併せ詳細の予約/締切表示用の短い日時ラベル。 */
function formatDateTime(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleString("ja-JP", { month: "numeric", day: "numeric", hour: "2-digit", minute: "2-digit" });
}

const mockInfoGrid = [
  { label: "日程", value: "7/26(日) 13:00〜" },
  { label: "場所", value: "都内スタジオ" },
  { label: "募集人数", value: "あと2名（4/6）" },
  { label: "費用", value: "スタジオ代 割り勘" },
];

export function DetailScreen() {
  const { back, nav, openProfile, openReport, openChat, openCreateFromDuplicate, selectedAwaseId } = useRouter();
  const { user } = useAuth();
  const configured = isSupabaseConfigured();

  const awaseQuery = useAwase(selectedAwaseId);
  const rolesQuery = useAwaseRoles(selectedAwaseId);
  const apply = useApply();
  const updateAwase = useUpdateAwase();
  const setRoles = useSetAwaseRoles();
  const deleteAwase = useDeleteAwase();
  const imagesQuery = useAwaseImages(selectedAwaseId);
  const addImage = useAddAwaseImage();
  const removeImage = useRemoveAwaseImage();
  const setCover = useSetAwaseCover();
  const uploadImage = useUploadImage();
  const imageInputRef = useRef<HTMLInputElement>(null);

  const real = configured && selectedAwaseId ? awaseQuery.data : undefined;
  // 本番（接続済）で募集がまだ読み込めていない間はローディング表示にして、
  // プロトタイプ用のダミー内容がチラ見えするのを防ぐ。
  const loading = configured && Boolean(selectedAwaseId) && !awaseQuery.data && awaseQuery.isPending;
  const roles = real ? (rolesQuery.data ?? []) : detailRoles;
  const isHost = Boolean(real && user && real.host_id === user.id);
  const applicantCount = useAwaseApplicantCount(isHost ? selectedAwaseId : null);
  const applicantTotal = applicantCount.data?.total ?? 0;
  // 自分の応募状況（応募者側）。主催者は対象外。二重応募防止＋状態表示に使う。
  const myApplication = useMyApplication(!isHost ? selectedAwaseId : null, !isHost ? user?.id : undefined);
  const myAppStatus = configured ? myApplication.data ?? null : null;
  // 承認済みメンバーのグループチャット（主催＋accepted/doneで参加可能）
  const groupChat = useAwaseGroupChat();
  const openMemberGroupChat = () => {
    if (!real || groupChat.isPending) return;
    groupChat.mutate(
      { awaseId: real.id },
      {
        onSuccess: (convId) => openChat(convId),
        onError: () => alert("グループチャットを開けませんでした。もう一度お試しください。"),
      },
    );
  };
  // 女性限定募集は本人確認済みでないと応募できない（RLSで強制）。UI側でも導線を出す。
  const viewerProfile = useProfile(user?.id);
  const viewerVerified = configured ? Boolean(viewerProfile.data?.is_verified) : true;
  const needsVerifyToApply = Boolean(configured && real?.women_only && !isHost && !viewerVerified);
  const isClosed = real ? real.status === "closed" : false;
  const now = Date.now();
  const isScheduled = Boolean(real?.publish_at && new Date(real.publish_at).getTime() > now);
  const isDeadlinePassed = Boolean(real?.application_deadline && new Date(real.application_deadline).getTime() < now);

  // 閲覧数の加算（主催者にだけ見せる手応え指標）。主催者自身の閲覧は数えない。
  // 1回のマウントにつき1加算。失敗しても表示には影響させない（best-effort）。
  const countedRef = useRef<string | null>(null);
  const realId = real?.id ?? null;
  const realHostId = real?.host_id ?? null;
  useEffect(() => {
    if (!configured || !realId || !user || user.id === realHostId) return;
    if (countedRef.current === realId) return;
    countedRef.current = realId;
    getSupabaseBrowserClient().rpc("increment_awase_view", { target: realId }).then(() => {});
  }, [configured, realId, realHostId, user]);
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
  // 選んだ画像を一覧・ホーム・詳細のサムネ（カバー）にする。カバーは sort 昇順の
  // 先頭なので、その画像を現在の最小 sort より小さくして先頭へ持ってくる。
  const handleSetCover = (id: string) => {
    if (!real || images.length < 2) return;
    const minSort = Math.min(...images.map((img) => img.sort));
    setCover.mutate({ awaseId: real.id, imageId: id, minSort });
    setHeroIndex(0);
  };

  const [confirmApply, setConfirmApply] = useState(false);
  const [applyRoleId, setApplyRoleId] = useState<string | null>(null); // 応募時の希望キャラ
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
  const [eWaitlist, setEWaitlist] = useState(false);
  const [eTags, setETags] = useState<string[]>([]);
  const [ePublishAt, setEPublishAt] = useState("");
  const [eDeadline, setEDeadline] = useState("");
  const [eRoles, setERoles] = useState<string[]>([]); // 募集キャラ（char_name のリスト）

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
        ...(real.application_deadline
          ? [{ label: "応募締切", value: formatDateTime(real.application_deadline) + (isDeadlinePassed ? "（締切済）" : "まで") }]
          : []),
        ...(isScheduled && real.publish_at
          ? [{ label: "公開予約", value: formatDateTime(real.publish_at) + " に公開" }]
          : []),
      ]
    : mockInfoGrid;
  const bodyText =
    real?.body ||
    "生徒会メンバーで併せをします◎ 透明感のある世界観で、自然光メインのスタジオ撮影予定。カメラマンさん1名にも入っていただけると嬉しいです。初めての方も歓迎、当日は和やかに進めます。";

  const handleApply = () => {
    setConfirmApply(false);
    if (!real || !user) {
      // プロトタイプ（未接続）は従来どおり応募完了画面へ
      nav("applied");
      return;
    }
    if (apply.isPending) return;
    apply.mutate(
      { awaseId: real.id, applicantId: user.id, roleId: applyRoleId },
      {
        onSuccess: () => nav("applied"),
        onError: (e) => {
          const err = e as { code?: string; message?: string };
          // 診断用: 実際のエラーをコンソールに残す
          console.error("apply failed", err);
          let msg: string;
          if (err.code === "23505") {
            msg = "すでにこの併せに応募済みです。";
          } else if (err.code === "42501") {
            // RLS 違反 = 応募条件を満たさない
            msg =
              "応募条件を満たしていないため応募できませんでした。\n（募集終了・応募締切・公開前、または女性限定募集で本人確認が未完了の可能性があります）";
          } else {
            msg = `応募に失敗しました。もう一度お試しください。\n(${err.code ?? "?"}: ${err.message ?? "unknown"})`;
          }
          alert(msg);
        },
      },
    );
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
    setEWaitlist(real.accept_waitlist);
    setETags(real.world_tags ?? []);
    setEPublishAt(isoToLocalInput(real.publish_at));
    setEDeadline(isoToLocalInput(real.application_deadline));
    setERoles((rolesQuery.data ?? []).map((r) => r.char));
    setEditing(true);
  };
  const saveEdit = async () => {
    if (!real || !eTitle.trim() || !eDate.trim() || !eRegion) return;
    const cap = eCapacity.trim() ? Number(eCapacity) : null;
    const pubIso = localToIso(ePublishAt);
    const deadIso = localToIso(eDeadline);
    if (pubIso && deadIso && deadIso <= pubIso) return;
    try {
      await updateAwase.mutateAsync({
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
        publishAt: pubIso,
        applicationDeadline: deadIso,
        acceptWaitlist: eWaitlist,
      });
      await setRoles.mutateAsync({
        awaseId: real.id,
        charNames: eRoles.map((s) => s.trim()).filter(Boolean),
      });
      setEditing(false);
    } catch {
      // エラーは updateAwase.isError / setRoles.isError で表示
    }
  };
  const doDelete = () => {
    if (!real) return;
    deleteAwase.mutate(
      { awaseId: real.id },
      { onSuccess: () => nav("home", "home") },
    );
  };

  const [copied, setCopied] = useState(false);
  // 共有は /a/<id>（サーバーが OGP メタを返す共有用URL）を使う。X などの
  // クローラーは JS を実行しないため、/?awase=<id> だとリッチカードが出ない。
  const shareUrl = () =>
    real ? `${window.location.origin}/a/${real.id}` : window.location.href;

  const handleShare = async () => {
    if (typeof window === "undefined") return;
    const url = shareUrl();
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

  // X（旧Twitter）へワンボタン投稿。募集中なら「募集告知」、締切後は「募集終了」の
  // 定型文を自動で出し分ける。URL は OGP 付きの共有用URL（/a/<id>）。
  const shareToX = () => {
    if (typeof window === "undefined") return;
    const url = shareUrl();
    const date = real?.event_date ?? "7/26(日) 13:00〜";
    const place = real?.place ?? real?.region ?? "都内スタジオ";
    const text = isClosed
      ? `【募集終了】${title}（${workName}）\nたくさんのご応募ありがとうございました！\n#プルミエ #コスプレ`
      : `【併せ募集】${title}\n作品：${workName}\n📅 ${date}\n📍 ${place}\n一緒に併せしませんか？🙌\n#プルミエ #コスプレ #併せ #コスプレ好きさんと繋がりたい`;
    const intent = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`;
    window.open(intent, "_blank", "noopener,noreferrer");
  };

  // 告知画像（1200x675）を canvas で生成して PNG 保存。X の投稿に添付する用途。
  // 作品名から WorkCover と同じ配色を使うので、告知もアプリ内と同じ「作品の色」になる。
  const savePromoImage = () => {
    if (typeof document === "undefined") return;
    const W = 1200;
    const H = 675;
    const canvas = document.createElement("canvas");
    canvas.width = W;
    canvas.height = H;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const g = workGradient(workName);
    const grad = ctx.createLinearGradient(0, 0, W, H);
    grad.addColorStop(0, g.from);
    grad.addColorStop(1, g.to);
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, W, H);

    // 下部を暗くして文字を読みやすく
    const shade = ctx.createLinearGradient(0, H * 0.35, 0, H);
    shade.addColorStop(0, "rgba(30,20,50,0)");
    shade.addColorStop(1, "rgba(30,20,50,.55)");
    ctx.fillStyle = shade;
    ctx.fillRect(0, 0, W, H);

    // 作品の頭文字を透かしに（WorkCover と同じモチーフ）
    ctx.fillStyle = "rgba(255,255,255,.18)";
    ctx.font = "800 420px 'Zen Maru Gothic','Hiragino Sans',sans-serif";
    ctx.textBaseline = "alphabetic";
    ctx.fillText(Array.from(workName.trim())[0] ?? "？", W - 400, H - 60);

    const sans = "'Zen Kaku Gothic New','Hiragino Sans',sans-serif";

    // バッジ（募集中 / 募集終了）
    const badge = isClosed ? "募集終了" : "併せ募集";
    ctx.font = `700 34px ${sans}`;
    const bw = ctx.measureText(badge).width + 56;
    ctx.fillStyle = isClosed ? "rgba(90,82,110,.95)" : "rgba(255,255,255,.95)";
    ctx.beginPath();
    ctx.roundRect(72, 72, bw, 64, 32);
    ctx.fill();
    ctx.fillStyle = isClosed ? "#fff" : "#6D5DAB";
    ctx.fillText(badge, 72 + 28, 72 + 45);

    // タイトル（2行まで折返し）
    ctx.fillStyle = "#fff";
    ctx.font = `800 76px ${sans}`;
    ctx.shadowColor = "rgba(30,20,50,.35)";
    ctx.shadowBlur = 14;
    const maxW = W - 144;
    const chars = Array.from(title);
    const lines: string[] = [];
    let line = "";
    for (const ch of chars) {
      if (ctx.measureText(line + ch).width > maxW) {
        lines.push(line);
        line = ch;
        if (lines.length === 2) break;
      } else {
        line += ch;
      }
    }
    if (lines.length < 2 && line) lines.push(line);
    if (lines.length === 2 && line && lines[1] !== line) lines[1] = lines[1].slice(0, -1) + "…";
    lines.forEach((l, i) => ctx.fillText(l, 72, 250 + i * 96));

    // 作品・日程・場所
    ctx.shadowBlur = 8;
    ctx.font = `700 44px ${sans}`;
    ctx.fillText(`作品：${workName}`, 72, 448);
    const date = real?.event_date ?? "7/26(日) 13:00〜";
    const place = real?.place ?? real?.region ?? "都内スタジオ";
    ctx.font = `600 40px ${sans}`;
    ctx.fillText(`📅 ${date}　📍 ${place}`, 72, 516);

    // フッター（サービス名＋タグライン）
    ctx.shadowBlur = 0;
    ctx.fillStyle = "rgba(255,255,255,.95)";
    ctx.font = `800 42px 'Zen Maru Gothic',${sans}`;
    ctx.fillText("プルミエ！", 72, H - 64);
    ctx.font = `500 30px ${sans}`;
    ctx.fillStyle = "rgba(255,255,255,.8)";
    ctx.fillText(siteTagline, 72 + 230, H - 66);

    canvas.toBlob((blob) => {
      if (!blob) return;
      const a = document.createElement("a");
      a.href = URL.createObjectURL(blob);
      a.download = `premier-awase-${real?.id ?? "demo"}.png`;
      a.click();
      URL.revokeObjectURL(a.href);
    }, "image/png");
  };

  if (loading) {
    return (
      <div>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 18px 8px" }}>
          <button onClick={back} style={{ background: "none", border: "none", cursor: "pointer", padding: 0 }} aria-label="戻る">
            <ChevronLeftIcon size={24} />
          </button>
          <div style={{ fontSize: 14, fontWeight: 600, color: colors.textPrimaryAlt }}>募集の詳細</div>
          <span style={{ width: 24 }} />
        </div>
        <div style={{ padding: "60px 22px", textAlign: "center", fontSize: 13, color: colors.textMutedAlt }}>読み込み中…</div>
      </div>
    );
  }

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
          <AwaseCover radius={18} coverUrl={heroUrl} work={workName} />
        </div>
        <span
          style={{
            position: "absolute",
            left: 34,
            top: 18,
            fontSize: 11,
            fontWeight: 600,
            color: colors.white,
            background: isScheduled
              ? "rgba(199,146,79,.95)"
              : isClosed
                ? "rgba(120,110,140,.92)"
                : "rgba(109,93,171,.92)",
            padding: "6px 12px",
            borderRadius: 999,
          }}
        >
          {isScheduled ? "公開予約" : isClosed ? "募集終了" : "募集中"}
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

      {/* 日程調整（調整さん風の○△×投票）— 実データ接続時のみ */}
      {real && (
        <ScheduleSection
          awaseId={real.id}
          isHost={isHost}
          canVote={isHost || myAppStatus === "accepted" || myAppStatus === "done"}
          userId={user?.id}
        />
      )}

      {/* roles */}
      <div style={{ padding: "22px 22px 26px" }}>
        {/* 募集キャラはホストが登録した場合のみ表示（登録UIは未提供のため、
            実データで空のときは見出しごと出さない）。 */}
        {roles.length > 0 && (
        <>
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
        </>
        )}
        {isHost ? (
          <div style={{ display: "flex", flexDirection: "column", gap: 9, marginTop: 22 }}>
            <div style={{ textAlign: "center", fontSize: 11.5, color: colors.textMutedAlt }}>
              この募集はこれまで <b style={{ color: colors.primary }}>{real?.view_count ?? 0}回</b> 見られています（あなたにだけ表示）
            </div>
            <button
              onClick={() => nav("hostApplicants")}
              style={{
                width: "100%",
                border: "none",
                background: colors.primary,
                color: colors.white,
                fontFamily: "inherit",
                fontSize: 13.5,
                fontWeight: 700,
                padding: "14px 0",
                borderRadius: 13,
                cursor: "pointer",
              }}
            >
              応募者を見る{applicantTotal > 0 ? `（${applicantTotal}名）` : ""}
            </button>
            <div style={{ display: "flex", gap: 9 }}>
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
                onClick={() => real && openCreateFromDuplicate(real.id)}
                style={{
                  flex: 1,
                  border: `1px solid ${colors.border}`,
                  background: colors.white,
                  color: colors.textSecondary,
                  fontFamily: "inherit",
                  fontSize: 13,
                  fontWeight: 700,
                  padding: "13px 0",
                  borderRadius: 13,
                  cursor: "pointer",
                }}
              >
                複製する
              </button>
            </div>
            <button
              onClick={() => setConfirmDelete(true)}
              style={{
                width: "100%",
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
            {myAppStatus ? (
              <div style={{ marginTop: 22 }}>
                <div
                  style={{
                    textAlign: "center",
                    border: `1px solid ${myAppStatus === "accepted" ? colors.primary : colors.borderSoft}`,
                    background: myAppStatus === "accepted" ? colors.primaryBg1 : colors.primaryBg5,
                    color: myAppStatus === "accepted" ? colors.primary : colors.textMutedAlt,
                    fontSize: 13,
                    fontWeight: 700,
                    padding: "15px 0",
                    borderRadius: 14,
                  }}
                >
                  {myAppStatus === "accepted"
                    ? "参加が承認されました🎉"
                    : myAppStatus === "rejected"
                      ? "今回は見送りとなりました"
                      : myAppStatus === "done"
                        ? "参加済み"
                        : "応募済み（主催者の承認待ち）"}
                </div>
                {(myAppStatus === "accepted" || myAppStatus === "done") && (
                  <button
                    onClick={openMemberGroupChat}
                    disabled={groupChat.isPending}
                    style={{
                      width: "100%",
                      marginTop: 10,
                      border: `1px solid ${colors.primary}`,
                      background: colors.white,
                      color: colors.primary,
                      fontFamily: "inherit",
                      fontSize: 13,
                      fontWeight: 700,
                      padding: "13px 0",
                      borderRadius: 13,
                      cursor: groupChat.isPending ? "default" : "pointer",
                      opacity: groupChat.isPending ? 0.6 : 1,
                    }}
                  >
                    {groupChat.isPending ? "開いています…" : "メンバーのグループチャット"}
                  </button>
                )}
              </div>
            ) : isClosed ? (
              <div
                style={{
                  marginTop: 22,
                  textAlign: "center",
                  border: `1px solid ${colors.borderSoft}`,
                  background: colors.primaryBg5,
                  color: colors.textMutedAlt,
                  fontSize: 13,
                  fontWeight: 700,
                  padding: "15px 0",
                  borderRadius: 14,
                }}
              >
                この募集は終了しました
              </div>
            ) : isDeadlinePassed ? (
              <div
                style={{
                  marginTop: 22,
                  textAlign: "center",
                  border: `1px solid ${colors.borderSoft}`,
                  background: colors.primaryBg5,
                  color: colors.textMutedAlt,
                  fontSize: 13,
                  fontWeight: 700,
                  padding: "15px 0",
                  borderRadius: 14,
                }}
              >
                応募は締め切りました
              </div>
            ) : needsVerifyToApply ? (
              <div style={{ marginTop: 22 }}>
                <div
                  style={{
                    textAlign: "center",
                    fontSize: 11.5,
                    color: colors.pinkText,
                    lineHeight: 1.7,
                    marginBottom: 10,
                  }}
                >
                  女性限定の募集です。応募には本人確認が必要です。
                </div>
                <PrimaryButton onClick={() => nav("verify")}>本人確認をして応募する</PrimaryButton>
              </div>
            ) : (
              <PrimaryButton onClick={() => { setApplyRoleId(null); setConfirmApply(true); }} style={{ marginTop: 22 }}>
                この併せに応募する
              </PrimaryButton>
            )}
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

      {/* X（旧Twitter）へワンボタン告知／募集終了投稿 */}
      <div style={{ padding: "0 22px 30px" }}>
        <button
          onClick={shareToX}
          style={{
            width: "100%",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 8,
            border: "none",
            background: "#000",
            color: "#fff",
            fontFamily: "inherit",
            fontSize: 13,
            fontWeight: 700,
            padding: "13px 0",
            borderRadius: 13,
            cursor: "pointer",
          }}
        >
          <svg viewBox="0 0 24 24" width="15" height="15" fill="currentColor" aria-hidden>
            <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
          </svg>
          {isClosed ? "Xで募集終了を投稿" : "Xで募集を告知する"}
        </button>
        <button
          onClick={savePromoImage}
          style={{
            width: "100%",
            marginTop: 9,
            border: `1px solid ${colors.border}`,
            background: colors.white,
            color: colors.textSecondary,
            fontFamily: "inherit",
            fontSize: 12.5,
            fontWeight: 700,
            padding: "12px 0",
            borderRadius: 13,
            cursor: "pointer",
          }}
        >
          🖼 告知画像を保存（Xの投稿に添付）
        </button>
        <p style={{ margin: "8px 4px 0", fontSize: 10.5, color: colors.textMutedAlt, lineHeight: 1.6, textAlign: "center" }}>
          {isClosed
            ? "募集終了のお礼をXにワンボタンで投稿できます。"
            : "概要つきの告知文を投稿し、保存した画像を添付すると目に留まりやすくなります。"}
        </p>
      </div>

      {/* apply confirmation — 希望キャラ選択つき（キャラ登録済みの併せのみ） */}
      {confirmApply && (
        <div
          style={{ position: "fixed", inset: 0, zIndex: 95, background: "rgba(20,14,28,.5)", display: "flex", alignItems: "center", justifyContent: "center", padding: 22 }}
          onClick={() => setConfirmApply(false)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{ width: "100%", maxWidth: 380, maxHeight: "84vh", overflowY: "auto", background: colors.white, borderRadius: 18, padding: "22px 20px 20px" }}
          >
            <div style={{ fontSize: 16, fontWeight: 700, color: colors.textPrimary }}>この併せに応募しますか？</div>
            <div style={{ fontSize: 12.5, color: colors.textMutedAlt, lineHeight: 1.7, marginTop: 8 }}>
              主催者にあなたのプロフィールが通知されます。
            </div>

            {roles.length > 0 && (
              <div style={{ marginTop: 16 }}>
                <div style={{ fontSize: 12.5, fontWeight: 700, color: colors.textPrimary }}>希望キャラ（任意）</div>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginTop: 10 }}>
                  {roles.map((ro) => {
                    const taken = ro.status === "確定";
                    const on = applyRoleId === ro.key;
                    return (
                      <button
                        key={ro.key}
                        type="button"
                        disabled={taken}
                        onClick={() => setApplyRoleId(on ? null : ro.key)}
                        style={{
                          fontSize: 12.5,
                          fontWeight: on ? 700 : 500,
                          color: taken ? colors.textMutedSoft : on ? colors.white : colors.textSecondary,
                          background: on ? colors.primary : colors.white,
                          border: `1px solid ${on ? colors.primary : colors.border}`,
                          padding: "8px 13px",
                          borderRadius: 999,
                          cursor: taken ? "not-allowed" : "pointer",
                          fontFamily: "inherit",
                          opacity: taken ? 0.55 : 1,
                        }}
                      >
                        {ro.char}
                        {taken ? "（確定済み）" : ""}
                      </button>
                    );
                  })}
                  {/* 相談して決める＝希望なし */}
                  <button
                    type="button"
                    onClick={() => setApplyRoleId(null)}
                    style={{
                      fontSize: 12.5,
                      fontWeight: applyRoleId === null ? 700 : 500,
                      color: applyRoleId === null ? colors.white : colors.textSecondary,
                      background: applyRoleId === null ? colors.primary : colors.white,
                      border: `1px solid ${applyRoleId === null ? colors.primary : colors.border}`,
                      padding: "8px 13px",
                      borderRadius: 999,
                      cursor: "pointer",
                      fontFamily: "inherit",
                    }}
                  >
                    相談して決める
                  </button>
                </div>
                <div style={{ fontSize: 10.5, color: colors.textMutedSoft, marginTop: 8, lineHeight: 1.6 }}>
                  承認されると希望キャラが確定します。細かい希望はメッセージで相談できます。
                </div>
              </div>
            )}

            <div style={{ display: "flex", gap: 8, marginTop: 20 }}>
              <button
                onClick={() => setConfirmApply(false)}
                style={{ flex: 1, border: `1px solid ${colors.border}`, background: colors.white, color: colors.textSecondary, fontFamily: "inherit", fontSize: 13, fontWeight: 600, padding: "12px 0", borderRadius: 12, cursor: "pointer" }}
              >
                やめる
              </button>
              <button
                onClick={handleApply}
                disabled={apply.isPending}
                style={{ flex: 2, border: "none", background: colors.primary, color: colors.white, fontFamily: "inherit", fontSize: 13, fontWeight: 700, padding: "12px 0", borderRadius: 12, cursor: "pointer", opacity: apply.isPending ? 0.6 : 1 }}
              >
                {apply.isPending ? "応募中…" : "応募する"}
              </button>
            </div>
          </div>
        </div>
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
                {images.length >= 2 && (
                  <div style={{ fontSize: 11, color: colors.textMutedAlt, marginTop: 4, lineHeight: 1.6 }}>
                    先頭の画像が一覧・ホームのサムネイルになります。別の画像を「サムネにする」で入れ替えできます。
                  </div>
                )}
                <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginTop: 6 }}>
                  {images.map((img, i) => (
                    <div key={img.id} style={{ position: "relative", width: 76, height: 76 }}>
                      <ImageSlot radius={12} src={img.url ?? undefined} />
                      {i === 0 ? (
                        <span
                          style={{
                            position: "absolute",
                            left: 3,
                            bottom: 3,
                            fontSize: 9,
                            fontWeight: 700,
                            color: colors.white,
                            background: "rgba(109,93,171,.92)",
                            padding: "2px 6px",
                            borderRadius: 999,
                          }}
                        >
                          サムネ
                        </span>
                      ) : (
                        <button
                          onClick={() => handleSetCover(img.id)}
                          disabled={setCover.isPending}
                          style={{
                            position: "absolute",
                            left: 3,
                            bottom: 3,
                            fontSize: 9,
                            fontWeight: 700,
                            color: colors.primary,
                            background: "rgba(255,255,255,.92)",
                            border: "none",
                            padding: "2px 6px",
                            borderRadius: 999,
                            cursor: setCover.isPending ? "default" : "pointer",
                            fontFamily: "inherit",
                          }}
                        >
                          サムネにする
                        </button>
                      )}
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
              <Field label="募集キャラ（任意）">
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  {eRoles.map((name, i) => (
                    <div key={i} style={{ display: "flex", gap: 8 }}>
                      <input
                        value={name}
                        onChange={(e) => setERoles((r) => r.map((v, idx) => (idx === i ? e.target.value : v)))}
                        style={{ ...editInput, flex: 1 }}
                        placeholder="例：フリーレン"
                      />
                      <button
                        type="button"
                        onClick={() => setERoles((r) => r.filter((_, idx) => idx !== i))}
                        aria-label="キャラを削除"
                        style={{
                          flex: "0 0 auto",
                          width: 44,
                          border: `1px solid ${colors.border}`,
                          background: colors.white,
                          color: colors.textMutedAlt,
                          borderRadius: 11,
                          fontSize: 16,
                          cursor: "pointer",
                        }}
                      >
                        ×
                      </button>
                    </div>
                  ))}
                  <button
                    type="button"
                    onClick={() => setERoles((r) => [...r, ""])}
                    style={{
                      alignSelf: "flex-start",
                      border: `1px dashed ${colors.border}`,
                      background: colors.primaryBg5,
                      color: colors.primary,
                      borderRadius: 11,
                      padding: "9px 16px",
                      fontSize: 12.5,
                      fontWeight: 700,
                      fontFamily: "inherit",
                      cursor: "pointer",
                    }}
                  >
                    ＋ キャラを追加
                  </button>
                </div>
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
              <div style={{ display: "flex", gap: 10 }}>
                <Field label="公開日時（予約）" flex>
                  <input type="datetime-local" value={ePublishAt} onChange={(e) => setEPublishAt(e.target.value)} style={{ ...editInput, fontSize: 12.5 }} />
                </Field>
                <Field label="応募締切" flex>
                  <input type="datetime-local" value={eDeadline} onChange={(e) => setEDeadline(e.target.value)} style={{ ...editInput, fontSize: 12.5 }} />
                </Field>
              </div>
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
              <EditToggle label="満員後もキャンセル待ちを受付" on={eWaitlist} onChange={setEWaitlist} />
              {(updateAwase.isError || setRoles.isError) && (
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
                disabled={!eTitle.trim() || !eDate.trim() || !eRegion || updateAwase.isPending || setRoles.isPending}
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
                  opacity: eTitle.trim() && eDate.trim() && eRegion && !updateAwase.isPending && !setRoles.isPending ? 1 : 0.5,
                }}
              >
                {updateAwase.isPending || setRoles.isPending ? "保存中…" : "保存する"}
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
  // padding を含めても親幅を超えないように border-box。datetime-local など
  // ネイティブ入力はモバイルで最小幅が広く、これと minWidth:0 が無いと
  // flex セル（各50%）を突き抜けて横に大きくはみ出す。
  boxSizing: "border-box",
  minWidth: 0,
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
