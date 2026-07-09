/** Compact Japanese relative-time label, e.g. "5分前" / "3時間前" / "7/20". */
export function formatRelativeTime(iso: string): string {
  const then = new Date(iso).getTime();
  const diffMs = Date.now() - then;
  const min = Math.floor(diffMs / 60_000);
  if (min < 1) return "たった今";
  if (min < 60) return `${min}分前`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr}時間前`;
  const day = Math.floor(hr / 24);
  if (day === 1) return "昨日";
  if (day < 7) return `${day}日前`;
  const d = new Date(iso);
  return `${d.getMonth() + 1}/${d.getDate()}`;
}
