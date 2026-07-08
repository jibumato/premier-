# プルミエ！ 開発 進行表

> コスプレイヤー交流マッチングアプリの開発ロードマップ。デザイン・プロトタイプは
> 完了、ここからプロダクション実装フェーズへ。フェーズ定義の詳細は
> [ARCHITECTURE.md](ARCHITECTURE.md)、Phase 1 の実装計画は
> [PHASE1_PLAN.md](PHASE1_PLAN.md) を参照。

- **更新日**: 2026-07-08 ・ 版: v1.4
- **リポジトリ**: jibumato/premier-
- **採用スタック（確定・稼働中）**: Cloudflare Workers（OpenNextアダプタ配信 / R2画像）＋ Supabase（Auth / Postgres＋RLS / Realtime）
- **本番URL**: https://premier.sunny-rainy1115.workers.dev（動作確認済み）
- ビジュアル版ダッシュボード（Artifact）:
  https://claude.ai/code/artifact/8cbe7489-6e47-4a9b-b0c9-731ca47ec17c

## 全体サマリー

| トラック | 進捗 |
| --- | --- |
| デザイン・プロトタイプ | ✅ 100% |
| バックエンド設計 | ✅ 100% |
| 基盤接続（P1-01） | ✅ 100% |
| コアループ実データ化（P1-03） | ✅ 100% |
| メッセージ・通知・画像基盤（Phase 2） | ✅ 100% |

- 実装済み画面: **24**（プロトタイプ 8 ・ 新規 12 ・ デザイン集 4）
- 直近の成果: **Phase 2 完了**（メッセージ Realtime・自動通知・R2画像アップロードを Supabase/Cloudflare に接続、未接続時は元のプロトタイプ動作を完全維持）
- フェーズ進捗: **Phase 0・Phase 1 (P0)・Phase 2 (P1) 完了 → Phase 3 へ**

凡例: ✅ 完了 ・ 🟡 進行中 ・ ⬜ 未着手 ・ ⏸ 保留（方針） ・ ⚠️ 要判断

## フェーズ・ロードマップ

各フェーズは既存の 24 画面に 1:1 対応しており、UI 追加なしでデータを差し込めます。

| フェーズ | スコープ | 対応画面 | 状態 | 想定 | 依存 |
| --- | --- | --- | --- | --- | --- |
| **Phase 0** | デザイン検討・プロトタイプ実装（全24画面 / CI / 設計書） | 全画面 | ✅ 完了 | 済 | — |
| **Phase 1 (P0)** | コア基盤: Auth＋profiles＋awase＋applications | オンボ/home/search/detail/applied/create/profile | ✅ 完了 | 済 | — |
| **Phase 2 (P1)** | メッセージ(realtime)・通知・画像基盤(R2アップロード) | messages/chat/notify/create(参考画像) | ✅ 完了 | 済 | — |
| **Phase 3 (P2)** | 本人確認(eKYC)・ゾーニング・レビュー | onboardVerify/応援リンク/reviewWrite/photographerProfile | ⬜ 未着手 | 2週 | eKYC契約 |
| **Phase 4 (P3)** | コミュニティ拡張(フリマ/イベント/知恵袋) | market*/events*/qa* | ⬜ 未着手 | 2–3週 | Phase 1–2 |
| **Phase 5 (P4)** | 通報自動処理・自動バッジ・法人掲載 | report/profile(バッジ)/corporate | ⬜ 未着手 | 2週 | Phase 1–4 |
| **後日** | 金銭仲介(コイン/ギフト/出金) | profile(応援ギフトUI) | ⏸ 保留 | 未定 | 運用体制 |

## タスク一覧

| フェーズ | タスク | 状態 | 依存 | 想定 |
| --- | --- | --- | --- | --- |
| Phase 0 | 全24画面・CI・設計書 | ✅ 完了 | — | 済 |
| Phase 1 | **詳細タスク分解・スキーマ確定**（[PHASE1_PLAN.md](PHASE1_PLAN.md) / [migration](../supabase/migrations/0001_phase1_core.sql)） | ✅ 完了 | — | 済 |
| Phase 1 | ~~バックエンド基盤の選定~~ → **Cloudflare＋Supabase で確定** | ✅ 完了 | — | 済 |
| Phase 1 | 基盤初期化（P1-01）: コード側の土台＋Cloudflare/Supabase 本番接続 | ✅ 完了 | — | 済 |
| Phase 1 | 認証・プロフィール（role/profiles/フォロー / ログインUI / P1-03〜05） | ✅ 完了 | 基盤接続 | 済 |
| Phase 1 | 募集・応募のデータ化（home/search/detail/create/apply） | ✅ 完了 | 認証 | 済 |
| Phase 1 | データ取得層の導入（TanStack Query 化・ガード付きフォールバック） | ✅ 完了 | 認証 | 済 |
| Phase 2 | 画像アップロード基盤（R2バインディング経由アップロード、募集作成フォームに接続） | ✅ 完了 | Phase 1 | 済 |
| Phase 2 | メッセージ・通知（Realtime/既読、応募時の自動通知トリガー） | ✅ 完了 | Phase 1 | 済 |
| Phase 2 | プロフィール画像（アバター/カバー）への `useUploadImage` 適用＋実プロフィール表示・併せ実績/フォロワー数の集計 | ✅ 完了 | — | 済 |
| Phase 2 | （フォローアップ）NSFW自動判定・画像変換・Web Push・投稿ギャラリー（要 posts テーブル新設） | ⬜ 未着手 | — | 未定 |
| Phase 3 | eKYC 連携・ゾーニング（Webhook自動更新/年齢確認） | ⚠️ 要判断 | ベンダー契約 | 2週 |
| Phase 3 | レビュー（投稿・平均集計、完了条件をRLSで制御） | ⬜ 未着手 | Phase 1 | 0.5週 |
| Phase 4 | フリマ / イベント / 知恵袋 のサーバー化 | ⬜ 未着手 | Phase 1–2 | 2–3週 |
| Phase 5 | 通報自動処理・自動バッジ・法人掲載（自動審査） | ⬜ 未着手 | Phase 1–4 | 2週 |
| 後日 | コイン・ギフト・出金 | ⏸ 保留 | 運用体制 | 未定 |

## リスク・要判断

| 重要度 | 項目 | 内容 |
| --- | --- | --- |
| ✅ 解消 | ~~バックエンド基盤の選定~~ | **Cloudflare（配信/R2）＋ Supabase（Auth/DB）で確定**（2026-07-08）。 |
| ✅ 解消 | ~~Next.js × Cloudflare の載せ方~~ | ダッシュボードが Workers 連携（`wrangler deploy`）だったため OpenNext Cloudflare アダプタ(@opennextjs/cloudflare)に切替、ビルド検証済み。 |
| 🔴 高 | **eKYC ベンダー契約** | TRUSTDOCK 等。契約・審査にリードタイム。Phase 3 の前提のため**先行着手**を推奨。 |
| 🟡 中 | 金銭仲介の運用体制 | ワンオペ制約により初期はスコープ外で合意済み。将来着手時に体制再検討。 |
| 🟡 中 | 画像の自動モデレーション | 投稿画像の NSFW 自動判定 API 選定。人手モデレーションを前提にしない方針。 |
| 🟣 低 | 画像アセット・ストレージ予算 | 実画像の配信量・CDN コストの見積り。ローンチ規模の想定が必要。 |

## 次アクション

- [x] **Phase 1 の詳細分解・見積確定**（→ [PHASE1_PLAN.md](PHASE1_PLAN.md) / スキーマ確定）
- [x] **バックエンド基盤を決定** → Cloudflare（配信/R2）＋ Supabase（Auth/DB）
- [x] **P1-01 コード側の土台**（Supabase クライアント・型・データ層・Cloudflare 設定）＋ **OpenNext Cloudflare (opennextjs-cloudflare) ビルド検証 ✅**
- [x] **P1-03 先行実装（接続不要な範囲）**: middleware / useAuth / profile・works フック / オンボ① role 保存の結線（ガード付き・検証は接続後）
- [x] **アカウント作成・接続完了**（Supabase プロジェクト＋マイグレーション適用済み、Cloudflare Workers+R2 連携済み、本番URL `premier.sunny-rainy1115.workers.dev` で実機動作確認済み）
- [x] **ログイン/サインアップ画面**（`LoginScreen`）＋ **AuthGate**（未ログイン時に自動表示、ログイン成功で自動的に消える）。設定「ログアウト」も実際に `signOut()` するよう修正
- [x] **works シード**（`0002_seed_works.sql`）＋ **オンボ②を実データ接続**（`useWorks`/`useFollowedWorks`/`useFollowWorks`、未接続時は従来のモック動作を維持）
- [x] **募集・応募のコアループを実データ化**: home/search/detail/create/apply を `src/lib/queries/awase.ts` で接続。作成フォームは実入力＋必須バリデーション化。未接続時は元のモック表示・遷移を完全維持（回帰テスト済み）
- [x] **Phase 2 完了**: メッセージ(Realtime)・自動通知(DBトリガー)・画像アップロード(R2バインディング)。
      応募完了画面の主催者名も実データ化済み（`useAwase` の `profiles.display_name` を再利用）
- [x] **Phase 2 フォローアップ**: マイページ（`ProfileScreen`）を実プロフィールに接続
      （名前・自己紹介・本人確認バッジ・称号・フォロワー数・併せ実績を実データ化）。
      アバター/カバーをタップでアップロード→`profiles.avatar_url`/`cover_url` に保存。
      募集詳細の主催者カードの「併せ実績」も実カウントに（`useAwaseAchievementCount`）
- [ ] **Phase 3 に着手**: eKYC 連携・ゾーニング・レビュー ← 現在ここ
- [ ] eKYC ベンダー選定を先行開始（Phase 3 のリードタイム対策）
- [ ] NSFW 判定 API の比較検討（画像投稿全般に適用）
- [ ] 投稿ギャラリー機能（`posts` テーブルの新設が必要。現状「投稿」統計とギャラリーはモックのまま）
- [ ] 他ユーザーのプロフィール閲覧（現状 `ProfileScreen` は常に自分のプロフィール。
      募集詳細のホストカード等から「他人のプロフィールをIDで見る」機能は未実装）
