import type {
  AwaseCard,
  DetailRole,
  GiftTier,
  Notification,
  Post,
  SearchResult,
} from "./types";

/**
 * Mock data for the prototype. Values are lifted verbatim from
 * clickable_prototype.dc.html so the port stays visually identical.
 * In production these come from the API.
 */

/** Popular works — home chips + onboarding follow list. */
export const popularWorks = [
  "葬送のフリーレン",
  "鬼滅の刃",
  "SPY×FAMILY",
  "呪術廻戦",
  "原神",
  "ブルーアーカイブ",
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
    date: "7/26(日)",
    place: "都内スタジオ",
    members: "4/6名 参加中",
  },
  {
    key: "a2",
    title: "和風ファンタジー併せ",
    work: "オリジナル",
    tag: "初心者歓迎",
    date: "8月上旬",
    place: "屋外ロケ",
    members: "3/5名 参加中",
  },
  {
    key: "a3",
    title: "アイドル衣装で合わせ",
    work: "某人気作",
    tag: "経験者歓迎",
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
