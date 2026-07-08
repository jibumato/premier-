# Phase 1 (P0) 実装計画 — コア基盤

> スコープ: **登録 → 募集 → 応募** のコアループを実データ化する。
> 対応画面: オンボーディング / home / search / detail / applied / create / profile
> 想定期間: **2–3 週間**（3 スプリント）
> 採用スタック（確定 2026-07-08）: **Cloudflare（Pages 配信 / R2 画像 / Workers）＋
> Supabase（Auth / Postgres＋RLS / Realtime）**。ログインと DB は RLS 連携のため
> Supabase に一体化、画面配信と画像は Cloudflare。詳細は [ARCHITECTURE.md](ARCHITECTURE.md) §1。

関連: [ARCHITECTURE.md](ARCHITECTURE.md)（全体設計） / [PROGRESS.md](PROGRESS.md)（進行表） /
確定スキーマ: [`supabase/migrations/0001_phase1_core.sql`](../supabase/migrations/0001_phase1_core.sql)

---

## 1. ゴール（Definition of Done）

- [ ] メール/OAuth でサインアップでき、オンボ（ロール・作品フォロー）が profiles に保存される
- [ ] 実ユーザーが併せ募集を作成でき、home/search に反映される
- [ ] 地域フィルタ・件数がサーバー側で算出される（現行のクライアント計算を置換）
- [ ] 募集詳細に応募でき、二重応募が防止され、主催に応募が届く
- [ ] 認可はすべて RLS で担保（クライアントは表示制御のみ）
- [ ] シードデータ＋ハッピーパスの E2E が green、CI に組込み

**このフェーズでやらないこと**: 画像アップロード本実装（Phase 2）/ リアルタイム通知（Phase 2）/
eKYC（Phase 3）。画像は Storage キーのプレースホルダのみ、通知は無し。

---

## 2. アーキテクチャ決定（ADR 要約）

| # | 決定 | 理由 |
| --- | --- | --- |
| A1 | 認可を RLS に寄せる | 画面が増えても認可の穴が増えない。ワンオペの目視確認削減 |
| A2 | profiles は auth.users をトリガで自動生成 | サインアップと profile 作成の不整合を防ぐ |
| A3 | サーバー状態は TanStack Query で管理 | `src/lib/data.ts` のモック配列をフックへ 1:1 置換 |
| A4 | `event_date` は text 型 | 「8月上旬」等の曖昧表現を許容（設計の hifi コピー準拠） |
| A5 | 女性限定は当面 `is_verified` で代替 | 性別属性は Phase 3 の eKYC 連携時に確定 |

---

## 3. データ取得層（フック ↔ 画面 対応）

`src/lib/data.ts` の各モックを以下のフックへ置換する（`src/lib/queries/`）。

| フック | 置換対象 | 画面 |
| --- | --- | --- |
| `useSession()` / `useProfile()` | （新規）ログインユーザー | 全体 / profile |
| `useWorks()` | `works` 配列 | home チップ / create / オンボ8b |
| `useAwaseFeed()` | `awase` 配列 | home |
| `useAwaseSearch({region})` | `allResults` + `filtered` | search（件数含む） |
| `useAwase(id)` / `useAwaseRoles(id)` | `detailRoles` | detail |
| `useCreateAwase()` | （新規 mutation） | create → created |
| `useApply()` | （新規 mutation） | detail → applied |
| `useFollowWork()` / `useFollowUser()` | オンボ選択 / プロフ | オンボ8b / profile |

楽観更新（optimistic update）を適用: 応募・フォロー・作成。

---

## 4. スプリント計画

### Sprint 1（Week 1）— 基盤・認証・プロフィール

| ID | チケット | 見積 | 依存 | 対応画面 |
| --- | --- | --- | --- | --- |
| P1-01 | 基盤初期化: Supabase 作成・接続、Cloudflare Pages+R2、`next-on-pages` 検証、環境変数・CI | 2d | — | — |
| P1-02 | マイグレーション適用（enums / profiles / works / follows）＋ RLS | 1d | P1-01 | — |
| P1-03 | 認証フロー（サインアップ/ログイン）＋ profile 自動生成トリガ | 2d | P1-02 | オンボ8a/8c |
| P1-04 | データ取得層セットアップ（TanStack Query / 型付きクライアント / auth コンテキスト） | 1d | P1-02 | 全体 |
| P1-05 | 作品フォロー＋マイページを実データ化 | 1.5d | P1-03,04 | オンボ8b / profile |

### Sprint 2（Week 2）— 併せ募集コア（募集〜応募）

| ID | チケット | 見積 | 依存 | 対応画面 |
| --- | --- | --- | --- | --- |
| P1-06 | マイグレーション適用（awase / images / roles / applications）＋ RLS | 1d | P1-02 | — |
| P1-07 | ホームフィード＋検索（地域フィルタ・件数をサーバー側へ） | 2d | P1-06,04 | home / search |
| P1-08 | 募集詳細を実データ化（募集キャラ・主催者カード） | 1.5d | P1-06 | detail |
| P1-09 | 募集作成フォーム（実入力・必須バリデーション・insert） | 2d | P1-06 | create / created |
| P1-10 | 応募フロー（insert・二重応募防止・完了画面） | 1.5d | P1-06,08 | detail / applied |

### Sprint 3（Week 3・0.5–1週）— 統合・検証・仕上げ

| ID | チケット | 見積 | 依存 | 対応画面 |
| --- | --- | --- | --- | --- |
| P1-11 | シードスクリプト（works / デモユーザー / デモ募集） | 1d | P1-06 | — |
| P1-12 | E2E ハッピーパス（登録→作成→応募）＋ RLS ポリシーテスト | 1.5d | 全て | — |
| P1-13 | ローディング/空/エラー状態・ハードニング | 1.5d | 全て | 全体 |

**合計見積**: 約 20 人日（バッファ込みで 2.5–3 週）

---

## 5. チケット詳細（受け入れ基準）

### P1-03 認証フロー＋profile 自動生成
- サインアップ完了時に `profiles` 行が 1 件だけ作られる（トリガ）
- オンボのロール選択（8a）が `profiles.role` に、作品フォロー（8b）が `work_follows` に保存
- 未ログインでオンボへ、ログイン済みで home へ振り分け
- 受け入れ: 新規登録→リロードしてもロール・フォローが保持される

### P1-07 ホームフィード＋検索
- home の併せカードが `useAwaseFeed()` の実データ
- search の地域チップ選択で `useAwaseSearch({region})` が再取得、件数表示が一致
- 0 件時に既存の空状態カードを表示
- 受け入れ: 地域「大阪」選択時、`region='大阪'` の open 募集のみ・件数一致

### P1-09 募集作成フォーム
- タイトル/作品/日程/地域は必須（クライアント＋DB `NOT NULL`）、参考画像は任意
- 送信で `awase`（＋`awase_roles` 初期行）を insert、`created` 画面へ
- 作成した募集が home/search に即時反映（キャッシュ invalidate）
- 受け入れ: 必須未入力で送信不可、作成後に自分の募集が一覧に出る

### P1-10 応募フロー
- 「応募する」で `awase_applications` を insert、`applied` 画面へ
- 同一募集への二重応募は unique 制約＋UI で防止（応募済み表示）
- 女性限定募集は `is_verified=false` のユーザーは応募不可（RLS で拒否＋UI 明示）
- 受け入れ: 二重応募がエラーにならず「応募済み」表示、主催のキューに出る

---

## 6. リスク・見積根拠

| リスク | 対応 |
| --- | --- |
| Next.js を Cloudflare Pages に載せる際の Edge Runtime 制約 | P1-01 で `@cloudflare/next-on-pages`（または OpenNext）を先に検証。非対応 API があれば Worker/API 側へ寄せる |
| RLS の作り込みで想定超過しやすい | P1-12 で RLS 専用テストを用意し早期に検証 |
| 女性限定の性別要件が未定義 | A5 の通り `is_verified` 代替で進め、Phase 3 で確定 |
| 画像なしで UI が寂しい | Phase 2 まではプレースホルダ継続（既存 `ImageSlot`） |

---

## 7. 完了後の状態

Phase 1 完了時点で「登録して募集を出し、仲間が応募する」コアループが実データで回る。
以降 Phase 2（メッセージ・通知・画像）で体験を厚くする。次スプリントの起点は本計画
P1-01（基盤初期化）。**着手の前提は「バックエンド基盤の決定」**（PROGRESS.md 次アクション）。
