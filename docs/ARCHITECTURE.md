# 実データ連携・バックエンド設計（プルミエ！）

このドキュメントは、現状フロントエンドのみで動くプロトタイプ（`src/`）を、
本番のデータ・認証・配信基盤に接続するための実装設計です。画面の各
「プレースホルダ状態」を、実データのどこに対応させるかを一覧で示します。

設計は README の **Constraints（ワンオペ運営方針）** を最上位の制約として扱います。

- 人手の承認・審査フローを作らない（自動集計・自動判定で完結）
- 本人確認は外部 eKYC に委任（自動判定）
- 投げ銭・出金など金銭仲介は初期リリースで実装しない（外部応援リンクのみ）
- 通報は自動処理（即時一時非表示＋キュー）を前提にする
- R18 コンテンツはサイト内に置かない（年齢確認済みユーザーにのみ応援リンク表示）

---

## 1. 全体方針：マネージド BaaS を基盤に

ワンオペ運営では「自前で運用する可動部を最小化する」ことが最重要です。個別に
サーバー・DB・認証・ストレージ・キューを組むのではなく、**マネージド BaaS を
1 つ選び、その上に薄い Edge Function を足す**構成を推奨します。

### 推奨スタック（第一候補）

| レイヤ | 採用 | 理由 |
| --- | --- | --- |
| DB | **Supabase Postgres** | RLS（行レベルセキュリティ）で認可をDBに寄せられる＝アプリ側の穴が減る |
| 認証 | Supabase Auth | メール/OAuth、JWT が RLS と直結 |
| ストレージ | Supabase Storage（S3 互換）+ 画像変換 | 署名付きアップロード・CDN 配信・オンザフライ変換 |
| リアルタイム | Supabase Realtime | メッセージ・通知の購読 |
| サーバーロジック | Edge Functions / Next.js Route Handlers | eKYC Webhook、通報自動処理、集計バッチ |
| ホスティング | Vercel（Next.js） | 現行フロントとそのまま接続 |

> **代替**: Firebase（Firestore + Auth + Storage + Cloud Functions）も
> ワンオペ適性は高い。Postgres のリレーショナル整合性・RLS を重視するなら
> Supabase、フルマネージドの手離れ・プッシュ通知の一体感なら Firebase。
> どちらでも本設計のデータモデル・処理フローはそのまま移植できます。

### なぜ「BaaS + RLS」がワンオペに効くか

認可（誰が何を見られるか）をアプリコードに散らすと、画面が増えるほど穴が増え、
人手のレビューが必要になります。RLS で「非公開アカウントは承認者のみ」「応援リンクは
年齢確認済みのみ」といったルールを **DB のポリシーとして一元定義**すれば、
全クライアント（Web / 将来の RN）に自動で効き、運用の目視確認を減らせます。

---

## 2. データモデル（画面との対応）

現行の `src/lib/data.ts` のモック配列を、そのままテーブルに写像します。
以下は Postgres 想定の要点スキーマ（型は簡略表記）。

### users / profiles
```
users(id, auth_id, handle, display_name, role, created_at)
  role: 'layer' | 'photographer' | 'both'         -- オンボ8a
profiles(user_id, bio, cover_image_id, avatar_image_id,
         is_verified, is_age_verified, is_private,  -- 本人確認/年齢/非公開
         meister_title, avatar_frame_id)
  is_verified     -> プロフの本人確認バッジ / 8c
  is_age_verified -> 応援リンクのゾーニング可否
  is_private      -> 設定「非公開アカウント」
follows(follower_id, followee_id, created_at)       -- フォロー数/オンボ8b
work_follows(user_id, work_id)                      -- 好きな作品フォロー/8b
```

### awase（併せ募集） — home / search / detail / create
```
works(id, name)                                     -- 人気作品チップ・作品タグ
awase(id, host_id, title, work_id, world_tags[],
      date_text, place, region, fee_text, body,
      women_only, beginner_ok, capacity, status,    -- 募集中/締切
      created_at)
awase_images(awase_id, image_id, sort)              -- 参考画像（作成フォーム）
awase_roles(id, awase_id, char_name, assignee_id,
            status)                                  -- 確定/募集中（detailの募集キャラ）
awase_applications(id, awase_id, applicant_id,
                   role_id, status, created_at)      -- 応募（applied画面）
```
- `search` の地域フィルタ = `where region = :region`（現行 `state.region` に対応）
- 件数表示（「併せ募集 N」）= `count(*)`
- 作成フォームの各入力（タイトル/作品/日程/地域/世界観タグ/トグル2種）→ `awase` の各カラム。
  必須バリデーション（タイトル/作品/日程/地域）はクライアント＋DB `NOT NULL` の二重化。

### messages — messages / chat
```
conversations(id, awase_id?, created_at)
conversation_members(conversation_id, user_id, last_read_at)
messages(id, conversation_id, sender_id, body, created_at)
```
- 未読バッジ = `count(messages where created_at > last_read_at)`
- `chat` の送信は `insert into messages`、Realtime 購読で相手に即時反映
- `applied` → 「主催者にメッセージ」= 応募と同時に `conversations` を用意

### reviews — reviewWrite / photographerProfile
```
reviews(id, author_id, target_id, awase_id?,
        rating, good_points[], comment, created_at)
```
- 併せ完了後にのみ作成可（`awase_applications.status = 'done'` を RLS で条件化）
- プロフィールの評価平均・件数は集計ビューで自動算出（人手の承認なし）

### notifications — notify
```
notifications(id, user_id, type, actor_id, entity_id,
              body, is_read, created_at)
```
- 既読/未読 = `is_read`（現行 `notif.unread` に対応）
- push は後述の通知基盤へ

### marketplace — market / marketDetail
```
market_items(id, seller_id, title, work_id, price,
             size, condition, status, created_at)  -- status: on_sale/sold
market_images(item_id, image_id, sort)
```
- **初期は決済を実装しない**（Constraints）。取引は `chat` で当事者間。
  `price` は表示のみ。将来のエスクロー導入余地はスキーマに残す。

### events — events / eventDetail
```
events(id, name, date_text, venue, region, tag, source)
event_participations(event_id, user_id, created_at) -- 参加表明
```
- `going` 数 = `count(event_participations)`
- `source`: 法人掲載イベントか自動収集かを区別（後述の corporate と連動）

### qa — qa / qaDetail
```
qa_questions(id, author_id, title, body, tag, solved, created_at)
qa_answers(id, question_id, author_id, body,
           is_best, helpful_count, created_at)
```
- 「役に立った」= `helpful_count`（現行のローカル加算をサーバーへ）
- ベストアンサーは質問者が選択（人手運営の介在なし）

### moderation — report
```
reports(id, reporter_id, target_type, target_id,
        reason, detail, status, created_at)         -- 自動処理の起点
blocks(blocker_id, blocked_id, created_at)
content_hidden(target_type, target_id, until, reason) -- 一時非表示
```

### monetization（プレースホルダ／初期は導線のみ）
```
support_links(user_id, provider, handle, sort)      -- Fantia/FANBOX/Skeb 外部リンク
-- coins / gifts / payouts テーブルは定義だけ用意し、初期リリースでは未使用
```

### corporate — corporate
```
ad_placements(id, advertiser_id, kind, target_scope, -- studio/event/maker
              status, starts_at, ends_at, created_at) -- status は自動審査
```

---

## 3. 画像アップロード・保存・配信

現行の `ImageSlot`（空プレースホルダ）を実画像に置き換えます。

1. **アップロード**: クライアントは Edge Function から**署名付き URL**を取得し、
   Storage へ直接 PUT（サーバーを経由しない＝帯域・コスト削減）。
2. **保存**: `*_images` テーブルに `image_id`（Storage キー）を記録。原本は非公開バケット。
3. **配信**: CDN 経由の公開 URL ＋**オンザフライ変換**（`?width=&quality=`）で、
   一覧はサムネ・詳細は大サイズと出し分け（`home` の 3 列グリッド、`detail` のヒーロー等）。
4. **投稿画像の安全性**: アップロード時に自動 NSFW スコアリング（外部 API）を通し、
   閾値超過は自動で `content_hidden` に入れる（人手モデレーション前提にしない）。

`ImageSlot` の差し替え箇所は 1 コンポーネントに集約済みなので、`next/image` +
公開 URL へ置換するだけで全画面に反映されます。

---

## 4. 認証と本人確認（eKYC）

- **サインイン**: Supabase Auth（メール/OAuth）。JWT を RLS の `auth.uid()` に使用。
- **本人確認（8c / 設定→本人確認）**: 外部 eKYC（例: TRUSTDOCK / Persona 等）へ委任。
  1. クライアントは eKYC のホスト型フローへ遷移（アプリは書類を保持しない）
  2. 判定結果は **Webhook → Edge Function** で受信し、`profiles.is_verified` /
     `is_age_verified` を**自動更新**（運営の目視確認なし＝Constraints）
  3. `is_verified` は本人確認バッジ、`is_age_verified` は応援リンクのゾーニングに直結
- 女性限定募集への応募可否など「確認済みのみ」の制御は RLS で表現。

---

## 5. リアルタイム（メッセージ・通知）

- `chat` / `messages`: Realtime で `messages`・`notifications` を購読し即時反映。
- **プッシュ通知**: Web Push（VAPID）＋将来の RN 向けに FCM/APNs。
  設定画面のトグル（応募・メッセージ・いいね）を `notification_prefs` に保存し、
  配信前にサーバーで参照。

---

## 6. 通報の自動処理パイプライン（Constraints の中核）

`report` 画面の送信は、以下を**人手を介さず**実行します。

```
[通報送信]
  → reports に insert（reason/detail/target）
  → 同一 target への通報数・通報者信頼度で自動スコアリング
  → 閾値超過なら content_hidden に即時 insert（＝通報者にはすぐ非表示）
  → 重大カテゴリ（詐欺・なりすまし等）は優先キューへ
  → 「ブロックも」onなら blocks に insert（相互非表示は RLS/クエリで即反映）
[確認キュー]
  → 自動集計のダッシュボードに積まれる（対応は非同期・任意）
```

- 「即時一時非表示＋キューに積む」を実現。運営が張り付かなくても被害を止められる。
- バッジ付与・特集枠も同じ思想で**自動集計**（いいね数・実績カウント等）。

---

## 7. ゾーニング（R18 / 応援リンク）

- 応援リンク（Fantia/FANBOX/Skeb）は**外部誘導のみ**、サイト内に R18 を置かない。
- 表示条件: `viewer.is_age_verified = true`。RLS で `support_links` の SELECT を
  年齢確認済みビューアに限定し、UI 側は設定「応援リンクを表示」トグルで更に制御。
- 「サイト内にアダルトコンテンツはありません」の明記をプロフィール応援セクションに固定表示。

---

## 8. 金銭まわり（初期リリースは非実装）

- 応援ギフト（コイン）・出金・KYC を伴う金銭仲介は**当面実装しない**。
- 現行プロフィールの「応援ギフト」UI は将来機能のプレースホルダとして残し、
  初期は `support_links`（外部サービス誘導）のみを稼働。
- スキーマ上は `coins/gifts/payouts` の定義だけ用意し、フラグで無効化。

---

## 9. クライアント統合の指針

現行はルーター状態（`AppRouter`）＋モック配列で動いています。実データ化は段階的に：

1. **データ取得層を追加**: TanStack Query（or SWR）を導入し、
   `src/lib/data.ts` の各配列を `useAwaseList()` などのフックへ置換。
   画面コンポーネントは props/フック経由に変えるだけで構造は維持。
2. **画面内 useState → サーバー状態**:
   - `chat` の送信、`qaDetail` の「役に立った」、`eventDetail` の参加表明、
     `reviewWrite`/`report` の送信は、楽観更新（optimistic update）＋API 呼び出しへ。
   - `search` の `region` フィルタはクエリパラメータ化しサーバーページングへ。
3. **画像**: `ImageSlot` を実 `next/image` ラッパーへ差し替え（1 箇所）。
4. **認可はサーバー（RLS）に寄せる**: クライアントは表示制御のみ、真の可否は DB。

---

## 10. ロールアウト段階

| フェーズ | 範囲 |
| --- | --- |
| P0 | Auth＋profiles＋awase＋applications（コア: 登録〜募集〜応募） |
| P1 | messages（リアルタイム）＋notifications＋画像基盤 |
| P2 | eKYC 連携（本人確認/年齢）＋ゾーニング＋reviews |
| P3 | market / events / qa（コミュニティ拡張） |
| P4 | 通報自動処理の高度化＋自動バッジ集計＋corporate 掲載 |
| 後日 | コイン/ギフト/出金（金銭仲介、要運用体制の再検討） |

各フェーズは既存画面に 1:1 対応しており、UI 追加なしでデータを差し込めます。
