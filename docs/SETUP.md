# セットアップ手順（Phase 1 基盤 / P1-01）

採用スタック: **Cloudflare（Pages 配信 / R2 画像 / Workers）＋ Supabase（Auth / Postgres＋RLS / Realtime）**。
コード側の土台は実装済み。以下の **アカウント側の作業**を行うと接続できます。

---

## ✅ コード側（実装済み）

- `@supabase/supabase-js` / `@supabase/ssr` / `@tanstack/react-query` 導入
- Supabase クライアント: `src/lib/supabase/client.ts`（ブラウザ）/ `server.ts`（サーバー）
- DB 型: `src/lib/database.types.ts`（スキーマ準拠。将来 `supabase gen types` で再生成）
- データ層: `src/components/Providers.tsx`（TanStack Query、layout に統合済み）
- Cloudflare: `wrangler.toml`（R2 バインディング）/ `@cloudflare/next-on-pages`
- 環境変数の雛形: `.env.example` / `.dev.vars.example`
- **検証済み**: `next build` ✅ / `typecheck` ✅ / `npm run pages:build`（Cloudflare Pages 用ビルド）✅

---

## 🔧 あなたの作業（アカウント側チェックリスト）

### 1. Supabase（ログイン＋DB）
- [ ] [supabase.com](https://supabase.com) でプロジェクト作成
- [ ] SQL Editor で `supabase/migrations/0001_phase1_core.sql` を実行（またはローカル CLI: `supabase db push`）
- [ ] Project Settings → API から **URL** と **anon key** を取得
- [ ] 認証プロバイダを有効化（メール / Google など）
- [ ] （任意）型を再生成: `supabase gen types typescript --project-id <id> > src/lib/database.types.ts`

### 2. Cloudflare（配信＋画像）
- [ ] [dash.cloudflare.com](https://dash.cloudflare.com) でアカウント作成
- [ ] R2 バケット作成: `wrangler r2 bucket create premier-images`
- [ ] Pages プロジェクト作成（GitHub リポジトリを接続）
  - ビルドコマンド: `npx @cloudflare/next-on-pages`
  - 出力ディレクトリ: `.vercel/output/static`
  - 互換フラグ: `nodejs_compat`
- [ ] Pages のプロジェクト環境変数に下記を設定（暗号化）

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
npm run preview    # Cloudflare Pages 相当（next-on-pages + wrangler）
npm run deploy     # Cloudflare へデプロイ（wrangler ログイン後）
```

---

## ⚠️ 補足・推奨

- **Next.js のセキュリティ更新**: `next@15.5.20` に更新済み（旧 15.1.6 のクリティカル
  advisory を解消）。残る `npm audit` の指摘は dev/ビルドツール（vercel CLI・eslint・
  esbuild 等）由来で本番配信物には含まれず、強制修正はツールチェーンを壊すため見送り。
- **CI**: `.github/workflows/ci.yml` で lint / typecheck / build を実行。
  `.npmrc` の `legacy-peer-deps=true` は Cloudflare ツールチェーンの optional peer 競合
  （workers-types v4/v5）回避のため。

## 次のチケット
基盤接続が済んだら **P1-03（認証・プロフィール）**へ。詳細は [PHASE1_PLAN.md](PHASE1_PLAN.md)。
