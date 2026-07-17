import { colors } from "@/lib/tokens";

/**
 * 併せカードの「残り人数／募集状況」を、応募を促す視認性の高いピルで見せる。
 * 「あと◯名」で残りが少ない（2名以下）ときは 🔥 付きの強調色にして希少性を伝える。
 * 満員・締切は控えめな色。文字列ベースなので実データ（定員◯名/募集中）・
 * モック（あと◯名/◯/◯名 参加中）双方でそのまま使える。
 */
export function SlotBadge({ text, style }: { text: string; style?: React.CSSProperties }) {
  const m = text.match(/あと\s*(\d+)\s*名/);
  const remaining = m ? Number(m[1]) : null;
  const urgent = remaining !== null && remaining <= 2;
  const closed = /満員|締切|キャンセル待ち/.test(text);

  const bg = urgent ? "#FCE7E3" : closed ? colors.primaryBg1 : colors.pinkBg1;
  const fg = urgent ? "#C0392B" : closed ? colors.textMutedAlt : colors.pinkText;

  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 4,
        fontSize: 11.5,
        fontWeight: 800,
        color: fg,
        background: bg,
        padding: "4px 11px",
        borderRadius: 999,
        whiteSpace: "nowrap",
        ...style,
      }}
    >
      {urgent && <span aria-hidden>🔥</span>}
      {text}
    </span>
  );
}
