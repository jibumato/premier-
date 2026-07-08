# セットアップ手順（Phase 1 基盤 / P1-01）

採用スタック: **Cloudflare（Pages 配信 / R2 画像 / Workers）＋ Supabase（Auth / Postgres＋RLS / Realtime）**。
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
- [ ] SQL Editor で `supabase/migrations/0001_phase1_core.sql` を実行（またはローカル CLI: `supabase db push`）
- [ ] Project Settings → API から **URL** と **anon key** を取得
- [ ] 認証プロバイダを有効化（メール / Google など）
- [ ] （任意）型を再生成: `supabase gen types typescript --project-id <id> > src/lib/database.types.ts`

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

## P1-03 の先行実装（接続不要な範囲）

バックエンド未接続でも動くよう **`isSupabaseConfigured()` でガード**した状態で、以下を実装済み:

- `src/middleware.ts` — セッション更新（未設定時はパススルー）
- `src/lib/auth/useAuth.ts` — 認証状態フック
- `src/lib/queries/profile.ts` / `works.ts` — profile / works の取得・更新フック
- オンボ①（`OnboardRoleScreen`）— セッションがあれば role を profiles に保存（無ければ従来どおり）

いずれも **実装済み・最終動作確認は Supabase 接続後**。接続後の残作業: ログイン UI、
オンボ②の作品フォロー保存（works の実 UUID が必要）、各画面の実データ化。

## 次のチケット
基盤接続が済んだら **P1-03（認証・プロフィール）**へ。詳細は [PHASE1_PLAN.md](PHASE1_PLAN.md)。
