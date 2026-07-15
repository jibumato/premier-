import type { Screen } from "@/lib/types";

/**
 * ハイブリッド公開モデルの中核。
 * ここに列挙した画面は「未ログインでも閲覧できる」（コンテンツを広く見せて集客する）。
 * それ以外の画面（応募・投稿・DM・マイページ・作成・運営など、個人に紐づく情報や
 * アクションを伴う画面）は、未ログインだと `AuthGate` がログイン画面に差し替える。
 *
 * 個人情報（他ユーザーのプロフィール本体・写真ギャラリー）を含む `profile` /
 * `photographerProfile` は、いまはまだ登録必須のまま（次段でぼかし閲覧に対応予定）。
 */
export const PUBLIC_SCREENS: ReadonlySet<Screen> = new Set<Screen>([
  "home",
  "search",
  "detail",
  "market",
  "marketDetail",
  "events",
  "eventDetail",
  "studios",
  "qa",
  "qaDetail",
  "lounge",
  "announcements",
  "corporate",
  "terms",
  "privacy",
  "login",
]);

/** その画面が未ログインでも閲覧できるか。 */
export function isPublicScreen(screen: Screen): boolean {
  return PUBLIC_SCREENS.has(screen);
}
