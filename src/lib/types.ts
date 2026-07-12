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
  | "qa"
  | "qaDetail"
  | "report"
  | "settings"
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
  date: string;
  place: string;
  members: string;
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
}

export interface QaItem {
  key: string;
  title: string;
  excerpt: string;
  tag: string;
  answers: number;
  solved: boolean;
}

