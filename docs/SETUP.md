# セットアップ手順（Phase 1〜2 基盤）

採用スタック: **Cloudflare（Workers 配信 / R2 画像）＋ Supabase（Auth / Postgres＋RLS / Realtime）**。
コード側の土台は実装済み。以下の **アカウント側の作業**を行うと接続できます。

---

## ✅ コード側（実装済み）

- `@supabase/supabase-js` / `@supabase/ssr` / `@tanstack/react-query` 導入
- Supabase クライアント: `src/lib/supabase/client.ts`（ブラウザ）/ `server.ts`（サーバー）
- DB 型: `src/lib/database.types.ts`（スキーマ準拠。将来 `supabase gen types` で再生成）
- データ層: `src/components/Providers.tsx`（TanStack Query、layout に統合済み）
- Cloudflare: `wrangler.toml`（Workers + 静的アセット + R2 バインディング）/ `@opennextjs/cloudflare`
- 環境変数の雛形: `.env.example` / `.dev.vars.example`
- **検証済み**: `next build` ✅ / `typecheck` ✅ / `npm run cf:build`（`opennextjs-cloudflare build`）✅

---

## 🔧 あなたの作業（アカウント側チェックリスト）

### 1. Supabase（ログイン＋DB）
- [ ] [supabase.com](https://supabase.com) でプロジェクト作成
- [ ] SQL Editor で以下を**順番に**実行（またはローカル CLI: `supabase db push`）
  - [ ] `supabase/migrations/0001_phase1_core.sql`（コア基盤: profiles/works/awase 等）
  - [ ] `supabase/migrations/0002_seed_works.sql`（作品カタログのシード）
  - [ ] `supabase/migrations/0003_phase2_messaging.sql`（メッセージ・通知・Realtime 発行設定）
  - [ ] `supabase/migrations/0004_reviews.sql`（レビュー）
  - [ ] `supabase/migrations/0005_posts.sql`（投稿ギャラリー）
  - [ ] `supabase/migrations/0006_qa.sql`（知恵袋）
  - [ ] `supabase/migrations/0007_events.sql` → `0008_seed_events.sql`（イベント＋シード）
  - [ ] `supabase/migrations/0009_market.sql`（フリマ）
  - [ ] `supabase/migrations/0010_phase5.sql`（通報自動処理・自動バッジ・法人リード）
  - [ ] `supabase/migrations/0011_kyc.sql`（本人確認申請）
- [ ] Project Settings → API から **URL** と **anon key** を取得
- [ ] 認証プロバイダを有効化（メール / Google など）
- [ ] （任意）型を再生成: `supabase gen types typescript --project-id <id> > src/lib/database.types.ts`
      ※ 再生成後は `src/lib/queries/*.ts` の手書き cast 部分を見直すこと

### 2. Cloudflare（配信＋画像）— Workers プロジェクトとして連携
- [ ] [dash.cloudflare.com](https://dash.cloudflare.com) でアカウント作成
- [ ] R2 バケット作成: `wrangler r2 bucket create premier-images`
- [ ] **Workers & Pages → Create application → Import a repository** で GitHub の
      `jibumato/premier-` を連携（「Pages」タブではなく Git 連携の Worker プロジェクト）
  - プロジェクト名: `premier-`
  - **ビルドコマンド**: `npx opennextjs-cloudflare build`
  - **デプロイコマンド**: `npx wrangler deploy`（ダッシュボードの初期値のまま）
  - 「非本番ブランチのビルド」: チェックのままでOK
- [ ] プロジェクトの環境変数（Settings → Variables）に下記を設定（暗号化）
- [ ] （画像を実際に配信したい場合）R2 バケットの Public access を有効化 or カスタムドメインを
      接続し、その URL を `NEXT_PUBLIC_R2_PUBLIC_URL` に設定。未設定でもアップロード自体（R2書き込み）
      は成功する（画像URLだけ返らない）

### 3. 環境変数
`.env.example` をコピーして `.env`（ローカル）を作成し、値を入れる:
```bash
cp .env.example .env
# NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY を記入
```
本番は同じ値を **Cloudflare Pages のプロジェクト環境変数**に設定。
`SUPABASE_SERVICE_ROLE_KEY` はサーバー専用（クライアントへ出さない）。

### 4. ローカル起動 / プレビュー
```bash
npm run dev        # 通常の Next 開発サーバー
npm run cf:build   # Cloudflare Workers 用ビルド（opennextjs-cloudflare build）
npm run preview    # ローカルで Worker としてプレビュー
npm run deploy     # Cloudflare へデプロイ（wrangler ログイン後、ダッシュボード外からの手動デプロイ用）
```

---

## ⚠️ 補足・推奨

- **Next.js のセキュリティ更新**: `next@15.5.20` に更新済み（旧 15.1.6 のクリティカル
  advisory を解消）。残る `npm audit` の指摘は `@opennextjs/cloudflare` / `wrangler` の
  ビルド時 transitive dependency（express・path-to-regexp・eslint 関連等）由来で、
  `wrangler deploy` が生成する `.open-next/worker.js` には含まれない。強制修正は
  ツールチェーンを壊すため見送り。
- **CI**: `.github/workflows/ci.yml` で lint / typecheck / build / cf:build を実行。
  `.npmrc` の `legacy-peer-deps=true` は Cloudflare ツールチェーンの optional peer 競合
  （workers-types v4/v5）回避のため。
- **既知の警告（無害）**: `next build` 時に `@supabase/supabase-js` が Edge Runtime で
  `process.version` を参照する旨の warning が出るが、ビルドは成功する。Cloudflare Workers は
  `nodejs_compat` により `process` を提供するため実行にも影響なし（middleware でのセッション
  更新は正常）。

## Phase 1 (P0) — 完了

登録・募集・応募のコアループを実データ化済み（ログイン/サインアップ、home/search/detail/
create/apply、オンボ①②）。すべて **`isSupabaseConfigured()` でガード**されており、
未接続時は元のプロトタイプ動作を維持する。

## Phase 2 (P1) — 実装済み（このセットアップ完了後に有効化）

- **メッセージ**: `conversations` / `conversation_members` / `messages`。
  `src/lib/queries/messages.ts` — 一覧・スレッド・送信・既読、Realtime (`postgres_changes`) で
  新着メッセージを自動反映。応募完了画面「主催者にメッセージを送る」が実会話を作成/再利用
  （`find_direct_conversation` RPC で重複スレッドを防止）。
- **通知**: `notifications`。応募が入ると DB トリガー（`notify_on_application`、
  SECURITY DEFINER）が自動生成 — Constraints の「自動処理・人手の承認フローを作らない」に
  準拠。`src/lib/queries/notifications.ts` が Realtime で反映、おしらせ画面を開くと既読化。
- **画像アップロード**: `src/app/api/upload/route.ts`（R2 バインディング `MEDIA` 経由、
  署名付きURLではなく Worker 経由の直接 PUT）＋ `useUploadImage()`。募集作成フォームの
  参考画像スロットに接続済み（最大2枚）。R2 未接続時は 501 を返し、UI はボタンを無効化。

### 動作に必要なもの
- 上記チェックリストの migration `0003` 実行（Realtime 発行設定を含む）
- R2 バケットの作成・バインディング（`wrangler.toml` の `MEDIA`）
- （任意）`NEXT_PUBLIC_R2_PUBLIC_URL` — 未設定でも upload 自体は失敗しない

## 本人確認（手動運用）の運営手順
eKYC ベンダー導入前の暫定として、身分証を運営が目視確認する運用です
（`0011_kyc.sql`）。ユーザーは設定 →「本人確認」→ 身分証画像アップロード → 申請、で
`verification_requests`（status=`pending`）が作られます。運営側の対応：

1. Supabase の Table editor（または SQL）で `verification_requests` の `pending` を確認
2. `doc_url`（R2 の身分証画像）を開いて本人性・年齢を目視確認
3. **承認する場合**（service role 想定 / ダッシュボードから）:
   ```sql
   update profiles set is_verified = true, is_age_verified = true where id = '<user_id>';
   update verification_requests set status = 'approved', reviewed_at = now() where id = '<request_id>';
   ```
4. **却下する場合**:
   ```sql
   update verification_requests set status = 'rejected', note = '<理由>', reviewed_at = now() where id = '<request_id>';
   ```
5. **確認が終わったら身分証画像を必ず削除**（個人情報保護）。R2 の該当キー
   （`kyc/<user_id>/...`）を `wrangler r2 object delete` 等で削除する。

> ⚠️ マイナンバーカードは**番号を取得・保管しない**（表面の顔写真のみ）。画像は確認後
> 速やかに削除する。手動で捌けない規模になったら eKYC（TRUSTDOCK 等）へ移行し、Webhook で
> `is_verified`/`is_age_verified` を自動更新する。

**ゾーニング**: 応援・支援リンク（外部）は、閲覧者本人の `is_age_verified` が true のときだけ
表示されます（`ProfileScreen`）。未接続のプレビューでは従来どおり表示。

## 次のチケット
NSFW 自動判定 API の選定、通報の自動非表示フィルタの market/qa/messages への展開、
（将来）eKYC 移行・金銭仲介。詳細は [PROGRESS.md](PROGRESS.md) / [ARCHITECTURE.md](ARCHITECTURE.md)。
