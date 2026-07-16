/** ローディング中のプレースホルダー（灰色ボックス）。角丸・幅・高さだけ指定して
 * 実際のカード形状に近い骨組みを見せる。「読み込み中…」の文字より、これから
 * 出る形が先に見えることで体感速度が上がる。 */
export function Skeleton({
  width = "100%",
  height,
  radius = 8,
  style,
}: {
  width?: number | string;
  height: number | string;
  radius?: number;
  style?: React.CSSProperties;
}) {
  return (
    <div
      className="pt-skeleton"
      style={{
        width,
        height,
        borderRadius: radius,
        flex: typeof width === "number" ? "0 0 auto" : undefined,
        ...style,
      }}
    />
  );
}

/** 併せ募集カード1件分の骨組み（SearchScreen/HomeScreenの一覧読み込み中に使う）。 */
export function AwaseCardSkeleton() {
  return (
    <div
      style={{
        display: "flex",
        gap: 13,
        border: "1px solid #F0EDF6",
        borderRadius: 18,
        padding: 12,
        background: "#fff",
      }}
    >
      <Skeleton width={84} height={84} radius={13} />
      <div style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column", gap: 8, justifyContent: "center" }}>
        <Skeleton height={14} width="70%" />
        <Skeleton height={11} width="45%" />
        <Skeleton height={11} width="55%" />
      </div>
    </div>
  );
}

/** イベントカード1件分の骨組み（EventsScreen/HomeScreenの一覧読み込み中に使う）。 */
export function EventCardSkeleton() {
  return (
    <div
      style={{
        display: "flex",
        gap: 13,
        alignItems: "center",
        border: "1px solid #F0EDF6",
        borderRadius: 16,
        padding: 13,
        background: "#fff",
      }}
    >
      <Skeleton width={54} height={54} radius={13} />
      <div style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column", gap: 7 }}>
        <Skeleton height={13.5} width="60%" />
        <Skeleton height={11} width="40%" />
      </div>
    </div>
  );
}

/** フリマ出品1件分の骨組み（MarketScreenの一覧読み込み中に使う）。 */
export function MarketCardSkeleton() {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
      <Skeleton height={140} radius={14} />
      <Skeleton height={12} width="80%" />
      <Skeleton height={12} width="40%" />
    </div>
  );
}
