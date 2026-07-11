# プルミエ！ 開発 進行表

> コスプレイヤー交流マッチングアプリの開発ロードマップ。デザイン・プロトタイプは
> 完了、ここからプロダクション実装フェーズへ。フェーズ定義の詳細は
> [ARCHITECTURE.md](ARCHITECTURE.md)、Phase 1 の実装計画は
> [PHASE1_PLAN.md](PHASE1_PLAN.md) を参照。

- **更新日**: 2026-07-08 ・ 版: v2.2
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
| レビュー機能（Phase 3 の一部） | ✅ 100% |
| Phase 4（フリマ・イベント・知恵袋） | ✅ 100% |
| Phase 5（通報自動処理・自動バッジ・法人掲載） | ✅ 100% |
| Phase 3（本人確認・ゾーニング） | ✅ 100%（手動運用版） |

- 実装済み画面: **25**（プロトタイプ 8 ・ 新規 13 ・ デザイン集 4）
- 直近の成果: **本人確認（手動運用版）＋ゾーニング完了**（eKYC は高コストのため、初期は身分証画像を運営が目視確認する手動フローで先行対応。`verify` 画面新設・`verification_requests` テーブル・承認で `is_verified`/`is_age_verified` を運営が更新→確認済バッジ反映。応援リンクは**閲覧者本人の年齢確認**でゾーニング。運用手順は SETUP.md 参照。スケール時に eKYC へ移行）
- フェーズ進捗: **全フェーズの設計スコープを実データ化完了**（Phase 0〜5＋本人確認手動版）。残りは非機能・拡張（NSFW自動判定・通報フィルタ拡張・将来の eKYC/金銭仲介）のみ

凡例: ✅ 完了 ・ 🟡 進行中 ・ ⬜ 未着手 ・ ⏸ 保留（方針） ・ ⚠️ 要判断

## フェーズ・ロードマップ

各フェーズは既存の 24 画面に 1:1 対応しており、UI 追加なしでデータを差し込めます。

| フェーズ | スコープ | 対応画面 | 状態 | 想定 | 依存 |
| --- | --- | --- | --- | --- | --- |
| **Phase 0** | デザイン検討・プロトタイプ実装（全24画面 / CI / 設計書） | 全画面 | ✅ 完了 | 済 | — |
| **Phase 1 (P0)** | コア基盤: Auth＋profiles＋awase＋applications | オンボ/home/search/detail/applied/create/profile | ✅ 完了 | 済 | — |
| **Phase 2 (P1)** | メッセージ(realtime)・通知・画像基盤(R2アップロード) | messages/chat/notify/create(参考画像) | ✅ 完了 | 済 | — |
| **Phase 3 (P2)** | 本人確認・ゾーニング・レビュー | onboardVerify/verify/応援リンク/reviewWrite | ✅ 完了（本人確認は手動運用版・eKYCはスケール時移行） | 済 | — |
| **Phase 4 (P3)** | コミュニティ拡張(フリマ/イベント/知恵袋) | market*/events*/qa* | ✅ 完了 | 済 | Phase 1–2 |
| **Phase 5 (P4)** | 通報自動処理・自動バッジ・法人掲載 | report/profile(バッジ)/corporate | ✅ 完了 | 済 | Phase 1–4 |
| **後日** | 金銭仲介・投げ銭（[設計: MONETIZATION.md](MONETIZATION.md)） | profile(応援ギフトUI) | 🟡 設計済（着手は要判断） | 中 | 料率・法務・タイミング |

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
| Phase 2 | 投稿ギャラリー（`posts` テーブル新設・マイページ実接続） | ✅ 完了 | — | 済 |
| Phase 2 | （フォローアップ）NSFW自動判定・画像変換・Web Push | ⬜ 未着手 | — | 未定 |
| Phase 3 | 本人確認（**手動運用版**: 身分証申請→運営目視→フラグ更新）＋ゾーニング | ✅ 完了 | — | 済 |
| Phase 3 | eKYC ベンダー連携（Webhook自動更新）※スケール時に手動から移行 | ⏸ 保留 | ベンダー契約 | 2週 |
| Phase 3 | レビュー（投稿・平均集計、完了条件をRLSで制御） | ✅ 完了 | Phase 1 | 済 |
| Phase 4 | 知恵袋（質問・回答・いいね・ベストアンサー選定） | ✅ 完了 | Phase 1 | 済 |
| Phase 4 | イベントカレンダーのサーバー化（一覧・詳細・参加表明） | ✅ 完了 | Phase 1 | 済 |
| Phase 4 | フリマのサーバー化（一覧・詳細・出品フォーム・SOLD切替） | ✅ 完了 | Phase 1–2 | 済 |
| Phase 5 | 通報自動処理（3人闾値で自動非表示・フィード除外） | ✅ 完了 | Phase 1–4 | 済 |
| Phase 5 | 自動バッジ（併せマイスターを実績闾値で自動付与） | ✅ 完了 | Phase 1 | 済 |
| Phase 5 | 法人掲載リード（実フォーム送信・自動審査前提） | ✅ 完了 | — | 済 |
| 後日 | コイン・ギフト・出金 | ⏸ 保留 | 運用体制 | 未定 |

## リスク・要判断

| 重要度 | 項目 | 内容 |
| --- | --- | --- |
| ✅ 解消 | ~~バックエンド基盤の選定~~ | **Cloudflare（配信/R2）＋ Supabase（Auth/DB）で確定**（2026-07-08）。 |
| ✅ 解消 | ~~Next.js × Cloudflare の載せ方~~ | ダッシュボードが Workers 連携（`wrangler deploy`）だったため OpenNext Cloudflare アダプタ(@opennextjs/cloudflare)に切替、ビルド検証済み。 |
| ✅ 解消 | ~~eKYC ベンダー契約~~ | **初期は手動本人確認で先行**（コストゼロ）と決定。売上（法人掲載・将来の投げ銭）が立ち、手動で捌けなくなった時点で eKYC へ移行する方針。 |
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
- [x] **Phase 3「レビュー」完了**: `reviews` テーブル＋RLS（`has_confirmed_participation` で accepted/done の相手のみ投稿可）。
      チャット画面の「レビュー」ボタン→会話の相手・関連する併せを実データ判定→投稿（`ReviewWriteScreen`）。
      マイページに「受け取ったレビュー」セクション（平均評価・件数・一覧）を追加。未接続時は元のモック表示を完全維持
- [x] **他ユーザーのプロフィール閲覧**: ルーターに `openProfile(userId)` / `selectedProfileId` を追加。
      募集詳細のホストカードから実際のプロフィールIDへ遷移するように。本人以外を見ている場合は
      アバター/カバーのアップロード・設定ボタンを非表示にし、「メッセージ」ボタンは
      `useGetOrCreateConversation` で実際の会話を作成/再開して `openChat` するよう接続
      （フリマ出品者カードは Phase 4 未着手のため据え置き）
- [x] **投稿ギャラリー機能**: `posts` テーブル新設（RLSは profiles と同じ非公開ルールを踏襲）。
      マイページのギャラリーが実投稿に接続、本人閲覧時は「＋」タイルから
      `useUploadImage`（kind: "post"）→ R2 アップロード→ `useCreatePost` で投稿。
      「投稿」統計も実カウントに。未接続時は元のモック表示を完全維持
- [x] **Phase 4「知恵袋」完了**: `qa_questions`/`qa_answers`/`qa_answer_likes` テーブル新設。
      一覧画面の「質問する」から実際に質問を投稿できるように（未接続時は従来通り詳細画面へnav）。
      詳細画面は実際の質問・回答・「役に立った」いいね（1人1回、トグルで取消可）に接続。
      ベストアンサーは質問の投稿者のみが選べる（`mark_best_answer()` がRLSではなくSECURITY DEFINER関数で権限チェック）。
      「解決済み」表示はベストアンサーの有無から導出（専用カラムなし）。未接続時は元のモック表示を完全維持
- [x] **Phase 4「イベントカレンダー」完了**: `events`/`event_rsvps` テーブル新設（モックの4イベントをシード投入）。
      イベントはキュレーション前提のコンテンツのため、一般ユーザー向けの新規作成UIはあえて設けず、
      authenticated 向けの書き込みポリシーも `events` には無い（管理者がマイグレーション/ダッシュボードから投入）。
      一覧・詳細・「参加表明する」(RSVP) を実データ化、参加予定人数は実カウント。
      「併せ募集 N件」の副次表示は awase と event の紐付けが未実装のため、実データ接続時は表示から外した
      （フェイクの数値を出さない方針。将来 `awase.event_id` を追加すれば復活可能）。
      未接続時は元のモック表示を完全維持
- [x] **Phase 4「フリマ」完了 → Phase 4 全体完了**: `market_items` テーブル新設（公開select、本人のみ書込のRLS）。
      一覧・詳細を実データ化。「出品する」からインライン出品フォーム（作品選択・価格・サイズ・状態・発送・説明＋
      `useUploadImage`(kind: "market") 画像アップロード）で実際に出品可能に。出品者への「メッセージ」は
      `useGetOrCreateConversation` で実会話を作成、出品者カードは `openProfile` で実プロフィールへ。
      出品者本人には「売却済みにする」ボタン（RLSで本人のみ）→ SOLD 表示に切替。
      アプリ内決済はワンオペ制約によりスコープ外（取引は直接メッセージ）。未接続時は元のモック表示を完全維持
- [x] **Phase 5 完了**: `reports`/`blocks`/`content_flags`/`corporate_leads` テーブル新設。
      通報が同一対象で3人（distinct）に達すると `content_flags.auto_hidden` を立てる SECURITY DEFINER トリガー。
      ホーム/検索フィードは `useModerationFilter` でブロック済みホスト・自動非表示併せを除外。
      併せ実績（主催＋accepted/done参加）が5件到達で `profiles.meister_title='併せマイスター'` を
      トリガーで自動付与。法人掲載は会社名・メールの実リード送信フォームに（審査は自動の想定）。
      通報導線は Detail/Profile/MarketDetail から対象付きで起動（`openReport`）、未接続/対象なし時はモック動作維持
- [x] **Phase 3（本人確認）完了 ＝ 手動運用版**: `verify` 画面新設・`verification_requests` テーブル。
      設定→本人確認→身分証アップロード→申請。運営が目視確認して `is_verified`/`is_age_verified` を更新
      （手順は SETUP.md）。画像は確認後削除。ゾーニングは**閲覧者本人の年齢確認**で支援リンクを出し分け。
      eKYC はスケール時に移行（保留）
- [x] **通報の自動非表示フィルタを market/qa/messages に展開**: `useModerationFilter` が
      ブロック済みユーザー＋自動非表示ID（awase/market/qa）を返し、フリマ一覧・知恵袋一覧＆回答・
      メッセージ一覧でブロック相手／自動非表示コンテンツを除外（従来は awase フィードのみ）。
      通報ベース運用（手動先行）の土台を強化
- [x] **規約・コミュニティガイドラインの草案**（[TERMS_DRAFT.md](TERMS_DRAFT.md)）: 禁止事項を
      通報理由に対応づけて明文化。同種サービス（WorldCosplay/コスプレイヤーズアーカイブ/acosta!/
      Fantia 等）の公開規約を参考に、撮影同意・肖像権・版権・併せマナー等のコスプレ特有条項を反映。
      ※本番公開前に弁護士レビュー必須、プライバシーポリシー・特商法表記は別途必要
- [x] **規約のアプリ内表示＋同意フロー**: `terms` 画面（設定→利用規約・ガイドライン）を新設、
      本文は `TermsContent` を共有。サインアップ時に同意チェック（未同意はアカウント作成不可、
      規約はオーバーレイで閲覧可）を追加
- [x] **プライバシーポリシーの草案**（[PRIVACY_DRAFT.md](PRIVACY_DRAFT.md)）: 取得情報・利用目的・
      本人確認書類（確認後削除）・Supabase/Cloudflare の越境移転・将来の決済（Stripe）・
      開示等請求・保存期間を個人情報保護法に沿って整理。※本番前に弁護士レビュー、事業者情報・
      越境移転先の確定が必要
- [x] **プライバシーポリシーのアプリ内表示＋同意への併記**: `privacy` 画面（設定→プライバシー
      ポリシー）を新設、本文は `PrivacyContent` を共有。サインアップの同意チェックを
      「利用規約・プライバシーポリシーに同意」に変更し、両方をオーバーレイで閲覧可能に
- [ ] NSFW 判定 API：当面は**通報ベース＋規約明示**で運用（手動先行）。量が増えたらアップロード時の
      一次フィルタとして自動判定 API を導入（eKYC と同じ「手動→スケール時に自動」の型）
- [ ] 投げ銭・金銭仲介（[設計: MONETIZATION.md](MONETIZATION.md)、手数料20%確定）— 着手は料率/法務/タイミング判断後
