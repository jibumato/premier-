import type {
  Announcement,
  AwaseCard,
  ChatMessage,
  Conversation,
  DetailRole,
  EventItem,
  GiftTier,
  MarketItem,
  Notification,
  Post,
  QaItem,
  SearchResult,
} from "./types";

/**
 * Mock data for the prototype. Values are lifted verbatim from
 * clickable_prototype.dc.html so the port stays visually identical.
 * In production these come from the API.
 */

/** サービスの理念を表す一行コピー（ロゴ横／下に添える）。 */
export const siteTagline = "“好き”でつながる、コスプレイヤーマッチング交流サイト";

/** Popular works — home cards / search suggestions. Order = display order. */
export const popularWorks = [
  "葬送のフリーレン",
  "ダンダダン",
  "薬屋のひとりごと",
  "【推しの子】",
  "鬼滅の刃",
  "呪術廻戦",
  "SPY×FAMILY",
  "チェンソーマン",
  "原神",
  "ゼンレスゾーンゼロ",
  "勝利の女神：NIKKE",
  "ブルーアーカイブ",
];

/** ホームの「最近のうごき」ティッカー用モック（プレビュー環境のみ）。実データは
 * activity_events（0046）を Realtime 購読して取得する。 */
export const mockActivity = [
  { key: "ac1", headline: "「魔法学園 生徒会併せ」の併せ募集がはじまりました", timeLabel: "たった今" },
  { key: "ac2", headline: "澪 / mioさんに新しいレビューが届きました", timeLabel: "3分前" },
  { key: "ac3", headline: "世界コスプレサミット2026に参加希望が増えました", timeLabel: "12分前" },
  { key: "ac4", headline: "「和風ファンタジー併せ」の併せ募集がはじまりました", timeLabel: "28分前" },
];

/** ホームの「急上昇作品」用モック（プレビュー環境のみ）。実データは
 * trending_works() RPC（0046）から取得する。 */
export const mockTrendingWorks = [
  { key: "tw1", name: "葬送のフリーレン", count: 9 },
  { key: "tw2", name: "【推しの子】", count: 6 },
  { key: "tw3", name: "ダンダダン", count: 4 },
  { key: "tw4", name: "呪術廻戦", count: 3 },
];

/** Region filter options (major Japanese cosplay-event cities). */
export const regions = [
  "すべて",
  "東京",
  "大阪",
  "名古屋",
  "福岡",
  "幕張",
  "京都",
  "札幌",
  "仙台",
];

export const homeAwase: AwaseCard[] = [
  {
    key: "a1",
    title: "魔法学園 生徒会併せ",
    work: "葬送のフリーレン",
    tag: "女性限定",
    region: "東京",
    date: "7/26(日)",
    place: "都内スタジオ",
    members: "4/6名 参加中",
  },
  {
    key: "a2",
    title: "和風ファンタジー併せ",
    work: "オリジナル",
    tag: "初心者歓迎",
    region: "名古屋",
    date: "8月上旬",
    place: "屋外ロケ",
    members: "3/5名 参加中",
  },
  {
    key: "a3",
    title: "アイドル衣装で合わせ",
    work: "某人気作",
    tag: "経験者歓迎",
    region: "大阪",
    date: "8/23(日)",
    place: "ホールスタジオ",
    members: "5/9名 参加中",
  },
];

export const homePosts: Post[] = [
  { key: "po1", likes: "324" },
  { key: "po2", likes: "289" },
  { key: "po3", likes: "241" },
  { key: "po4", likes: "198" },
  { key: "po5", likes: "176" },
  { key: "po6", likes: "152" },
];

export const searchResults: SearchResult[] = [
  {
    key: "s1",
    title: "魔法学園シリーズ 生徒会併せ",
    work: "葬送のフリーレン",
    world: "透明感",
    region: "東京",
    date: "7/26(日)",
    members: "あと2名",
    womenOnly: true,
  },
  {
    key: "s2",
    title: "和風ファンタジー 屋外ロケ併せ",
    work: "オリジナル",
    world: "和風・自然光",
    region: "京都",
    date: "8月上旬",
    members: "あと3名",
    womenOnly: false,
  },
  {
    key: "s3",
    title: "魔法使い2人併せ 撮影メイン",
    work: "葬送のフリーレン",
    world: "エモい",
    region: "名古屋",
    date: "8/9(土)",
    members: "あと1名",
    womenOnly: true,
  },
  {
    key: "s4",
    title: "勇者パーティー大人数併せ",
    work: "葬送のフリーレン",
    world: "ファンタジー",
    region: "大阪",
    date: "8/23(日)",
    members: "あと5名",
    womenOnly: false,
  },
  {
    key: "s5",
    title: "インテックス大阪 前日併せ",
    work: "某人気作",
    world: "映画風",
    region: "大阪",
    date: "9/6(土)",
    members: "あと4名",
    womenOnly: false,
  },
  {
    key: "s6",
    title: "ポートメッセ後 スタジオ併せ",
    work: "葬送のフリーレン",
    world: "透明感",
    region: "名古屋",
    date: "9/14(日)",
    members: "あと2名",
    womenOnly: true,
  },
  {
    key: "s7",
    title: "福岡コスイベ 合わせ募集",
    work: "オリジナル",
    world: "エモい",
    region: "福岡",
    date: "9/21(日)",
    members: "あと3名",
    womenOnly: false,
  },
  {
    key: "s8",
    title: "幕張メッセ 大型イベント併せ",
    work: "某人気作",
    world: "ファンタジー",
    region: "幕張",
    date: "10/4(土)",
    members: "あと6名",
    womenOnly: false,
  },
  {
    key: "s9",
    title: "札幌 雪まつり前ロケ併せ",
    work: "オリジナル",
    world: "自然光",
    region: "札幌",
    date: "1月下旬",
    members: "あと2名",
    womenOnly: true,
  },
  {
    key: "s10",
    title: "仙台 定禅寺どおり併せ",
    work: "葬送のフリーレン",
    world: "エモい",
    region: "仙台",
    date: "10/12(日)",
    members: "あと3名",
    womenOnly: false,
  },
];

export const detailRoles: DetailRole[] = [
  { key: "r1", char: "主人公キャラ", who: "澪 / mio（主催）", status: "確定" },
  { key: "r2", char: "魔法使いキャラ", who: "参加者2名 確定", status: "確定" },
  { key: "r3", char: "戦士キャラ", who: "募集中", status: "募集中" },
  { key: "r4", char: "カメラマン", who: "1名 募集中", status: "募集中" },
];

export const notifications: Notification[] = [
  { key: "n1", text: "かなさんがあなたの併せ募集に応募しました", time: "5分前", unread: true },
  { key: "n2", text: "澪さんがあなたをフォローしました", time: "1時間前", unread: false },
  { key: "n3", text: "あなたの投稿に24件のいいねがつきました", time: "3時間前", unread: false },
  { key: "n4", text: "「ベテラン主催」バッジを獲得しました🎉", time: "昨日", unread: false },
];

export const giftTiers: GiftTier[] = [
  { icon: "🌸", label: "おうえん", coins: "50" },
  { icon: "⭐", label: "きらきら", coins: "200" },
  { icon: "👑", label: "スペシャル", coins: "500" },
];

export const galleryKeys = ["g1", "g2", "g3", "g4", "g5", "g6"];

// ---------------------------------------------------------------------------
// Newly designed features (no handoff reference — designed to fit the system)
// ---------------------------------------------------------------------------

export const conversations: Conversation[] = [
  { key: "c1", name: "かな", last: "当日の持ち物リスト送りますね！", time: "5分前", unread: 2 },
  { key: "c2", name: "澪 / mio", last: "併せの件、ありがとうございました◎", time: "2時間前", unread: 0 },
  { key: "c3", name: "photographer_r", last: "撮影データ、こちらのURLです", time: "昨日", unread: 0 },
  { key: "c4", name: "すず", last: "はじめまして！屋外ロケ併せ気になっ…", time: "3日前", unread: 0 },
];

/** Fixed thread shown when opening a conversation (prototype: single thread). */
export const chatThread: ChatMessage[] = [
  { key: "m1", from: "them", text: "はじめまして！魔法学園の生徒会併せに応募しました🙌", time: "13:02" },
  { key: "m2", from: "me", text: "応募ありがとうございます！戦士キャラでお願いできますか？", time: "13:05" },
  { key: "m3", from: "them", text: "ぜひ！衣装は自前で用意できます✨", time: "13:07" },
  { key: "m4", from: "me", text: "助かります。当日は13時に都内スタジオ集合です。", time: "13:09" },
  { key: "m5", from: "them", text: "当日の持ち物リスト送りますね！", time: "13:10" },
];

export const marketItems: MarketItem[] = [
  { key: "mk1", title: "魔法使い衣装 一式（Mサイズ）", work: "葬送のフリーレン", price: "¥8,500", size: "M", condition: "美品" },
  { key: "mk2", title: "制服＋ウィッグセット", work: "某人気作", price: "¥6,000", size: "S", condition: "使用少" },
  { key: "mk3", title: "和風衣装 手作り", work: "オリジナル", price: "¥12,000", size: "F", condition: "新品未使用" },
  { key: "mk4", title: "勇者マント（撮影用）", work: "葬送のフリーレン", price: "¥3,200", size: "F", condition: "美品", sold: true },
  { key: "mk5", title: "戦士アーマー 小道具付き", work: "オリジナル", price: "¥15,000", size: "L", condition: "使用感あり" },
  { key: "mk6", title: "ロングウィッグ 銀髪", work: "共通", price: "¥4,800", size: "F", condition: "美品" },
];

// 2026年の実在イベント（出典確認済み）。本番は events テーブル（migration
// 0013）から取得し、これはプロトタイプ表示用のフォールバック。
export const events: EventItem[] = [
  { key: "e1", name: "世界コスプレサミット2026", date: "7/31(金)〜8/2(日)", venue: "OASIS 21 ほか名古屋市内各所", region: "名古屋", going: 0, tag: "世界大会" },
  { key: "e2", name: "コミックマーケット108（夏コミ）", date: "8/15(土)〜16(日)", venue: "東京ビッグサイト", region: "東京", going: 0, tag: "大型" },
  { key: "e3", name: "Ultra acosta! 2026", date: "9/4(金)〜6(日)", venue: "池袋サンシャインシティ", region: "東京", going: 0, tag: "撮影イベント" },
  { key: "e4", name: "池袋ハロウィンコスプレフェス2026", date: "10/30(金)〜11/1(日)", venue: "池袋エリア", region: "東京", going: 0, tag: "ハロウィン" },
  { key: "e5", name: "コミックマーケット109（冬コミ）", date: "12/29(火)〜31(木)", venue: "東京ビッグサイト", region: "東京", going: 0, tag: "大型" },
  // 2027年（2026-07時点で日程発表済みのもの）
  { key: "e6", name: "コスブー2nd（東京）", date: "2027/1/24(日)", venue: "TFTホール（東京・浜松町）", region: "東京", going: 0, tag: "撮影イベント" },
  { key: "e7", name: "世界コスプレサミット2027", date: "2027/11/12(金)〜14(日)", venue: "名古屋市内（会場は後日発表）", region: "名古屋", going: 0, tag: "世界大会" },
];

export const qaItems: QaItem[] = [
  { key: "q1", title: "併せ初心者です。当日の持ち物で必須なものは？", excerpt: "来月はじめて併せに参加します。衣装以外で持っていくと良いものを教えてください。", tag: "初心者", answers: 8, solved: true },
  { key: "q2", title: "ウィッグのセット崩れを防ぐコツはありますか？", excerpt: "移動中にどうしても崩れてしまいます。おすすめのスプレーや固定方法が知りたいです。", tag: "ウィッグ", answers: 12, solved: false },
  { key: "q3", title: "スタジオ代の割り勘、当日精算のスマートなやり方は？", excerpt: "主催をすることになりました。集金でもめないコツを教えてほしいです。", tag: "主催", answers: 5, solved: false },
  { key: "q4", title: "自然光ロケでレフ板は必要ですか？", excerpt: "屋外併せで撮影クオリティを上げたいです。カメラマンさん目線の意見が聞きたいです。", tag: "撮影", answers: 9, solved: true },
];

// --- 運営お知らせ / 更新履歴（プロトタイプ時のフォールバック） ---
// 本番は Supabase の announcements テーブルから取得する。相対時刻は描画時に
// formatRelativeTime で算出するため、ここでは固定の ISO 文字列を置いておく。
export const announcements: Announcement[] = [
  {
    key: "a1",
    category: "update",
    title: "本人確認バッジを導入しました",
    body: "本人確認（任意）を行うと、プロフィールに確認済みバッジが表示されるようになりました。設定 →「本人確認」からお手続きいただけます。",
    publishedAt: "2026-07-11T09:00:00+09:00",
  },
  {
    key: "a2",
    category: "update",
    title: "PC（パソコン）表示に対応しました",
    body: "パソコンのブラウザでも見やすいレイアウトに対応しました。スマートフォンと同じアカウントで、どちらからでもご利用いただけます。",
    publishedAt: "2026-07-10T12:00:00+09:00",
  },
  {
    key: "a3",
    category: "news",
    title: "プルミエ！を公開しました🎉",
    body: "コスプレの「併せ（合わせ）」を安心してつくれるサービス、プルミエ！を公開しました。作品・キャラクターから仲間を探して、募集・応募・メッセージのやり取りができます。",
    publishedAt: "2026-07-09T18:00:00+09:00",
  },
];

export const reportReasons = [
  "スパム・宣伝",
  "なりすまし",
  "迷惑行為・ハラスメント",
  "不適切なコンテンツ",
  "詐欺・金銭トラブル",
  "その他",
];

// --- onboarding ---

export const onboardWorks = [
  { key: "ow1", name: "葬送のフリーレン" },
  { key: "ow2", name: "鬼滅の刃" },
  { key: "ow3", name: "SPY×FAMILY" },
  { key: "ow4", name: "呪術廻戦" },
  { key: "ow5", name: "原神" },
  { key: "ow6", name: "ブルーアーカイブ" },
  { key: "ow7", name: "ダンダダン" },
  { key: "ow8", name: "薬屋のひとりごと" },
  { key: "ow9", name: "【推しの子】" },
  { key: "ow10", name: "チェンソーマン" },
  { key: "ow11", name: "ゼンレスゾーンゼロ" },
  { key: "ow12", name: "勝利の女神：NIKKE" },
];

// --- photographer profile ---

export const photoWorlds = ["サイバー", "夜景", "透明感", "和風", "ファンタジー"];

export const portfolioKeys = ["pf1", "pf2", "pf3", "pf4"];

export const photoRates = [
  { key: "pr1", title: "併せ参加（カメコ）", note: "スタジオ代の割り勘のみ", price: "応相談", accent: true },
  { key: "pr2", title: "個人撮影（データ納品）", note: "2時間・レタッチ込み", price: "¥10,000〜", accent: false },
];

export const photoReviews = [
  { key: "rv1", from: "澪 / mio", stars: "★★★★★", text: "世界観の作り込みがすごい！仕上がりの写真に感動しました。併せでもまたお願いしたいです。" },
  { key: "rv2", from: "かな", stars: "★★★★★", text: "当日はとても丁寧にリードしてくださって、初めてでも安心でした。レタッチも早かったです◎" },
];

// --- 撮影スタジオ（studios のモック。実データは migration 0020 でシード） ---

export interface StudioItem {
  key: string;
  name: string;
  region: string;
  area: string;
  tags: string[];
  price: string;
  url: string | null;
  description: string;
}

export const mockStudios: StudioItem[] = [
  { key: "st1", name: "ハコスタジアム東京 池袋", region: "関東", area: "東京・池袋", tags: ["シェア型", "多シチュエーション", "白ホリ"], price: "時間制（公式サイト参照）", url: "https://hacostadium.com/", description: "シェア型のコスプレ撮影スタジアム。多彩なセットを1施設で回れる定番スポット。" },
  { key: "st2", name: "ハコスタジアム大阪", region: "関西", area: "大阪・弁天町", tags: ["シェア型", "50種以上のセット"], price: "時間制（公式サイト参照）", url: "https://hacostadium.com/osaka/", description: "50種以上のシチュエーションから選べる大型シェアスタジオ。" },
  { key: "st3", name: "LUZZ STUDIO", region: "関西", area: "大阪", tags: ["貸切", "ベッドあり", "商用可"], price: "1時間単位（公式サイト参照）", url: "https://luzz-studio.com/", description: "商用・個人とも同一料金の時間貸しレンタルスタジオ。" },
  { key: "st4", name: "HACOSTUDIO LUX", region: "関西", area: "大阪・弁天町", tags: ["貸切", "洋風", "ゴージャス"], price: "貸切・時間制", url: "https://hacostudio.com/", description: "貸切型。洋風のラグジュアリーなセットが中心。" },
];
