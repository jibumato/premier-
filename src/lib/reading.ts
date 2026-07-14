/**
 * 読み（よみ）ベースの検索マッチ。
 *
 * 「ナルト」「naruto」「なると」のように**表記が違っても読みが同じ**なら
 * 引っかかるようにするための正規化ユーティリティ。カタカナ→ひらがな、
 * ローマ字→ひらがなに寄せた「読みキー」を作り、部分一致で比較する。
 *
 * 完全な形態素解析はしない（漢字の読みは辞書がないと出せない）。あくまで
 * 作品名・キャラ名によく使われる かな/ローマ字 表記の相互マッチが目的。
 */

// ローマ字（ヘボン式＋よくある異表記）→ ひらがな。長いものから貪欲マッチする。
const ROMAJI: Record<string, string> = {
  // 拗音（3文字）
  kya: "きゃ", kyu: "きゅ", kyo: "きょ",
  sha: "しゃ", shu: "しゅ", sho: "しょ", sya: "しゃ", syu: "しゅ", syo: "しょ",
  cha: "ちゃ", chu: "ちゅ", cho: "ちょ", tya: "ちゃ", tyu: "ちゅ", tyo: "ちょ",
  nya: "にゃ", nyu: "にゅ", nyo: "にょ",
  hya: "ひゃ", hyu: "ひゅ", hyo: "ひょ",
  mya: "みゃ", myu: "みゅ", myo: "みょ",
  rya: "りゃ", ryu: "りゅ", ryo: "りょ",
  gya: "ぎゃ", gyu: "ぎゅ", gyo: "ぎょ",
  jya: "じゃ", jyu: "じゅ", jyo: "じょ",
  bya: "びゃ", byu: "びゅ", byo: "びょ",
  pya: "ぴゃ", pyu: "ぴゅ", pyo: "ぴょ",
  tsu: "つ", chi: "ち", shi: "し",
  // 直音（2文字）
  ka: "か", ki: "き", ku: "く", ke: "け", ko: "こ",
  sa: "さ", si: "し", su: "す", se: "せ", so: "そ",
  ta: "た", ti: "ち", tu: "つ", te: "て", to: "と",
  na: "な", ni: "に", nu: "ぬ", ne: "ね", no: "の",
  ha: "は", hi: "ひ", hu: "ふ", fu: "ふ", he: "へ", ho: "ほ",
  ma: "ま", mi: "み", mu: "む", me: "め", mo: "も",
  ya: "や", yu: "ゆ", yo: "よ",
  ra: "ら", ri: "り", ru: "る", re: "れ", ro: "ろ",
  wa: "わ", wo: "を",
  ga: "が", gi: "ぎ", gu: "ぐ", ge: "げ", go: "ご",
  za: "ざ", zi: "じ", ji: "じ", zu: "ず", ze: "ぜ", zo: "ぞ",
  da: "だ", di: "ぢ", du: "づ", de: "で", do: "ど",
  ba: "ば", bi: "び", bu: "ぶ", be: "べ", bo: "ぼ",
  pa: "ぱ", pi: "ぴ", pu: "ぷ", pe: "ぺ", po: "ぽ",
  fa: "ふぁ", fi: "ふぃ", fe: "ふぇ", fo: "ふぉ",
  ja: "じゃ", ju: "じゅ", jo: "じょ",
  // 母音・撥音（1文字）
  a: "あ", i: "い", u: "う", e: "え", o: "お",
  n: "ん",
};

const VOWELS = new Set(["a", "i", "u", "e", "o"]);

/** ローマ字だけの文字列をひらがなに変換（貪欲＋促音/撥音の簡易処理）。 */
function romajiRunToHiragana(run: string): string {
  let out = "";
  let i = 0;
  while (i < run.length) {
    const c = run[i];
    // 促音: 同じ子音が続く（kk, tt, pp, ss …）→ っ
    if (c !== "n" && !VOWELS.has(c) && run[i + 1] === c) {
      out += "っ";
      i++;
      continue;
    }
    let matched = false;
    for (const len of [3, 2, 1]) {
      const seg = run.slice(i, i + len);
      if (ROMAJI[seg]) {
        out += ROMAJI[seg];
        i += len;
        matched = true;
        break;
      }
    }
    if (!matched) {
      // 変換できない文字（記号など）はそのまま残す
      out += c;
      i++;
    }
  }
  return out;
}

/** 比較用の「読みキー」。カタカナ→ひらがな、ローマ字→ひらがなに寄せ、記号や
 * 長音・空白を落とした文字列を返す。 */
export function readingKey(input: string): string {
  if (!input) return "";
  // 全角英数などを正規化してから小文字化
  let t = input.normalize("NFKC").toLowerCase();
  // カタカナ→ひらがな（U+30A1〜U+30F6 を 0x60 引く）
  t = Array.from(t)
    .map((ch) => {
      const code = ch.charCodeAt(0);
      return code >= 0x30a1 && code <= 0x30f6 ? String.fromCharCode(code - 0x60) : ch;
    })
    .join("");
  // 連続する英字（ローマ字）をひらがなに
  t = t.replace(/[a-z]+/g, (run) => romajiRunToHiragana(run));
  // 長音・記号・空白を除去して比較を緩くする
  t = t.replace(/[\s・･ー〜～\-＝=、。,.!！?？'"’”「」『』（）()【】[\]]/g, "");
  return t;
}

/**
 * `needle`（検索語）が `haystack`（対象）に、生の部分一致 or 読み一致で
 * 含まれるか。空の検索語は常に true（フィルタ無効）。
 */
export function readingMatch(haystack: string | null | undefined, needle: string | null | undefined): boolean {
  const hay = haystack ?? "";
  const need = (needle ?? "").trim();
  if (!need) return true;
  // まず生の部分一致（漢字やそのままの表記をカバー）
  if (hay.toLowerCase().includes(need.toLowerCase())) return true;
  // 読みキーどうしの部分一致
  const hk = readingKey(hay);
  const nk = readingKey(need);
  return nk.length > 0 && hk.includes(nk);
}
