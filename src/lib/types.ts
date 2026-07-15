/**
 * Screen keys. The first block mirrors `state.screen` from the clickable
 * prototype; the rest are the "Not Yet Designed" features, newly designed to
 * fit the same design system.
 */
export type Screen =
  // designed in the handoff prototype
  | "home"
  | "search"
  | "detail"
  | "applied"
  | "create"
  | "created"
  | "hostApplicants"
  | "notify"
  | "profile"
  // newly designed features
  | "messages"
  | "chat"
  | "reviewWrite"
  | "market"
  | "marketDetail"
  | "events"
  | "eventDetail"
  | "studios"
  | "qa"
  | "qaDetail"
  | "lounge"
  | "report"
  | "settings"
  | "adminVerify"
  | "adminPickups"
  | "adminEvents"
  | "adminFeedback"
  | "adminActivity"
  | "adminAnnouncements"
  | "adminUsers"
  | "feedback"
  | "corporate"
  | "verify"
  | "terms"
  | "privacy"
  | "announcements"
  // designed in the canvas set (screens_all_options), newly implemented
  | "onboardRole"
  | "onboardWorks"
  | "onboardVerify"
  | "photographerProfile";

/** Bottom-nav tabs — mirror `state.tab`. */
export type Tab = "home" | "search" | "notify" | "mypage";

export interface AwaseCard {
  key: string;
  title: string;
  work: string;
  tag: string;
  /** 開催エリア（検索の地域フィルタキーと同じ）。カードにタグ表示する。 */
  region: string;
  date: string;
  place: string;
  members: string;
  /** cover image URL (real data); undefined in the mock/prototype list. */
  coverUrl?: string | null;
}

export interface SearchResult {
  key: string;
  title: string;
  work: string;
  world: string;
  region: string;
  date: string;
  members: string;
  womenOnly: boolean;
  /** cover image URL (real data); undefined in the mock/prototype list. */
  coverUrl?: string | null;
}

export interface DetailRole {
  key: string;
  char: string;
  who: string;
  status: "確定" | "募集中";
}

export interface Notification {
  key: string;
  text: string;
  time: string;
  unread: boolean;
  /** 通知の種別（application / follow / like / badge / message）。遷移先の判定に使う。 */
  kind?: string;
  /** 関連エンティティID（applicationなら併せID等）。タップ遷移に使う。 */
  entityId?: string | null;
}

export type AnnouncementCategory = "update" | "news" | "maintenance";

export interface Announcement {
  key: string;
  category: AnnouncementCategory;
  title: string;
  body: string;
  /** ISO 8601 timestamp; the list formats it as a relative label. */
  publishedAt: string;
}

export interface GiftTier {
  icon: string;
  label: string;
  coins: string;
}

export interface Post {
  key: string;
  likes: string;
}

export interface Conversation {
  key: string;
  name: string;
  last: string;
  time: string;
  unread: number;
}

export interface ChatMessage {
  key: string;
  from: "me" | "them";
  text: string;
  time: string;
  /** 画像付きメッセージ（R2の公開URL）。テキストのみなら undefined/null。 */
  imageUrl?: string | null;
}

export interface MarketItem {
  key: string;
  title: string;
  work: string;
  price: string;
  size: string;
  condition: string;
  sold?: boolean;
}

export interface EventItem {
  key: string;
  name: string;
  date: string;
  venue: string;
  region: string;
  going: number;
  tag: string;
  /** 近日判定用の開始日 (YYYY-MM-DD)。モックでは省略可。 */
  startsOn?: string | null;
  /** サムネイル画像URL（主催の許諾を得た画像のみ）。無ければ生成デザインで表示。 */
  imageUrl?: string | null;
}

export interface QaItem {
  key: string;
  title: string;
  excerpt: string;
  tag: string;
  answers: number;
  solved: boolean;
}

