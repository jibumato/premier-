import { ImageSlot } from "./ImageSlot";
import { WorkCover } from "./WorkCover";

/**
 * 併せカードのカバー画像。写真 → 作品デザイン → プレースホルダーの3段フォールバック。
 *
 * 1. ホストがアップロードした実写コス写真（coverUrl）があればそれを表示（最良）。
 * 2. 無ければ作品名から生成した WorkCover を表示（著作権セーフで見栄えも良い）。
 *    「順次コス写真へ切り替え」の移行期に、写真が無い併せが灰色の箱で並ぶのを防ぐ。
 * 3. 作品名も無い例外時のみ、中立のプレースホルダー。
 */
export function AwaseCover({
  coverUrl,
  work,
  radius = 12,
  showName = false,
}: {
  coverUrl?: string | null;
  work?: string | null;
  radius?: number;
  /** WorkCover フォールバック時に作品名キャプションを出すか（カードは別途ラベルがあるので既定 false） */
  showName?: boolean;
}) {
  if (coverUrl) return <ImageSlot radius={radius} src={coverUrl} />;
  if (work && work.trim()) return <WorkCover name={work} radius={radius} showName={showName} />;
  return <ImageSlot radius={radius} />;
}
