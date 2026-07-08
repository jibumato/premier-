/** Screen keys — mirror `state.screen` from the clickable prototype. */
export type Screen =
  | "home"
  | "search"
  | "detail"
  | "applied"
  | "create"
  | "created"
  | "notify"
  | "profile";

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

export interface GiftTier {
  icon: string;
  label: string;
  coins: string;
}

export interface Post {
  key: string;
  likes: string;
}
