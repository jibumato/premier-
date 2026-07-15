# 運営セットアップ実行チェックリスト（Supabase）

未適用のマイグレーションと初期データを、**上から順に一度だけ**実行するための
チェックリストです。すべて Supabase ダッシュボード → **SQL Editor**（service_role
権限）で実行します。

> 迷ったら「ステップ 0」を先に実行し、どこまで済んでいるかを確認してください。
> 各ステップは冪等寄りに作ってあり、二重実行しても壊れにくい設計です
> （知恵袋の投入だけは重複に注意 → ステップ 3 参照）。

---

## ステップ 0: 適用状況の確認（最初に実行）

```sql
select
  to_regclass('public.announcements')                    as announcements_table, -- null → 0012 未適用
  (select count(*) from events where name like '%2026%') as events_2026,          -- 0 → 0013 未適用
  (select count(*) from events where name like '%2027%') as events_2027,          -- 0 → 0014 未適用
  (select exists(select 1 from information_schema.columns
     where table_name='posts' and column_name='sort'))  as posts_sort_col,       -- false → 0015 未適用
  (select count(*) from works)                           as works_count,          -- 少ない → 0016 未適用
  (select to_regprocedure('public.close_awase_when_full()') is not null)
                                                         as host_tools,           -- false → 0017 未適用
  (select exists(select 1 from information_schema.columns
     where table_name='awase' and column_name='publish_at')) as scheduling,      -- false → 0018 未適用
  (select exists(select 1 from information_schema.columns
     where table_name='awase' and column_name='accept_waitlist')) as waitlist,   -- false → 0019 未適用
  (select to_regclass('public.studios') is not null)     as studios_table,        -- false → 0020 未適用
  (select exists(select 1 from information_schema.columns
     where table_name='posts' and column_name='visibility')) as post_visibility, -- false → 0021 未適用
  (select exists(select 1 from information_schema.columns
     where table_name='awase' and column_name='view_count')) as awase_views,     -- false → 0022 未適用
  (select to_regprocedure('public.is_admin()') is not null) as admin_verify_fn,   -- false → 0023 未適用
  (select to_regprocedure('public.delete_my_account()') is not null)
                                                         as delete_account_fn,    -- false → 0024 未適用
  (select to_regprocedure('public.is_conversation_member(uuid,uuid)') is not null)
                                                         as msg_rls_fix,          -- false → 0025 未適用（メッセージ不具合）
  (select to_regprocedure('public.create_direct_conversation(uuid,uuid)') is not null)
                                                         as msg_create_fn,        -- false → 0026 未適用（メッセージ不具合）
  (select exists(select 1 from information_schema.columns
     where table_name='events' and column_name='starts_on')) as events_sort,     -- false → 0027 未適用（近日順）
  (select to_regprocedure('public.notify_on_application_status()') is not null)
                                                         as notify_status_fn,     -- false → 0028 未適用（通知）
  (select exists(select 1 from pg_publication_tables
     where pubname='supabase_realtime' and tablename='conversation_members'))
                                                         as read_receipts_rt,     -- false → 0029 未適用（既読）
  (select exists(select 1 from pg_policies
     where tablename='awase_applications' and policyname='applications_update'
       and with_check is not null))                      as app_update_guard,     -- false → 0030 未適用（自己承認防止）
  (select exists(select 1 from pg_publication_tables
     where pubname='supabase_realtime' and tablename='awase_applications'))
                                                         as app_realtime,         -- false → 0031 未適用（応募RT）
  (select pg_get_functiondef('public.admin_approve_verification(uuid,boolean)'::regprocedure)
     like '%insert into notifications%')                 as verify_notify,        -- false → 0032 未適用（本人確認通知）
  (select to_regprocedure('public.get_or_create_awase_group_chat(uuid)') is not null)
                                                         as group_chat_fn,        -- false → 0033 未適用（グループチャット）
  (select exists(select 1 from information_schema.columns
     where table_name='messages' and column_name='image_url')) as chat_images,   -- false → 0034 未適用（チャット画像）
  (select to_regprocedure('public.admin_delete_qa_question(uuid)') is not null)
                                                         as qa_delete_policy,     -- false → 0035 未適用（知恵袋の削除方針）
  (select to_regclass('public.home_pickups') is not null)
                                                         as home_pickups_table,   -- false → 0036 未適用（トップのピックアップ）
  (select exists(select 1 from pg_policies
     where tablename='home_pickups' and policyname='home_pickups_admin_insert'))
                                                         as home_pickups_admin,    -- false → 0037 未適用（運営画面から管理）
  (select count(*) from studios where region='中部')      as studios_chubu,         -- 0 → 0038 未適用（名古屋スタジオ）
  (select to_regclass('public.awase_schedule_options') is not null)
                                                         as awase_schedule,         -- false → 0039 未適用（日程調整）
  (select exists(select 1 from information_schema.columns
     where table_name='works' and column_name='reading')) as works_reading,        -- false → 0040 未適用（作品のあいうえお順）
  (select to_regprocedure('public.notify_on_follow()') is not null)
                                                         as follow_notify,         -- false → 0041 未適用（フォロー通知）
  (select to_regprocedure('public.sync_role_assignment()') is not null)
                                                         as role_assignment,       -- false → 0042 未適用（希望キャラの自動確定）
  (select exists(select 1 from information_schema.columns
     where table_name='events' and column_name='image_url'))
                                                         as event_images,          -- false → 0043 未適用（イベントのサムネ）
  (select exists(select 1 from pg_policies
     where tablename='events' and policyname='events_admin_update'))
                                                         as events_admin,          -- false → 0044 未適用（サムネを運営画面から管理）
  (select to_regclass('public.feedback') is not null)    as feedback_table,        -- false → 0045 未適用（運営へ要望フォーム）
  (select to_regclass('public.activity_events') is not null)
                                                         as activity_events_table, -- false → 0046 未適用（ホームのにぎわい）
  (select exists(select 1 from pg_policies
     where tablename='activity_events' and policyname='activity_events_admin_delete'))
                                                         as activity_events_admin, -- false → 0047 未適用（うごきを運営画面から管理）
  (select exists(select 1 from pg_policies
     where tablename='announcements' and policyname='announcements_admin_insert'))
                                                         as announcements_admin,   -- false → 0048 未適用（お知らせを運営画面から管理）
  (select count(*) from qa_questions)                    as qa_count;             -- 0 → 知恵袋 未投入
```

- `announcements_table` が `null` → **ステップ 1**（0012）
- `events_2026` が `0` → **ステップ 2**（0013）
- `events_2027` が `0` → **ステップ 2b**（0014）
- `posts_sort_col` が `false` → **ステップ 2c**（0015）
- `works_count` が少ない（数十未満）→ **ステップ 2d**（0016）
- `host_tools` が `false` → **ステップ 2e**（0017）
- `scheduling` が `false` → **ステップ 2f**（0018）
- `waitlist` が `false` → **ステップ 2g**（0019）
- `studios_table` が `false` → **ステップ 2h**（0020）
- `post_visibility` が `false` → **ステップ 2i**（0021）
- `awase_views` が `false` → **ステップ 2j**（0022）
- `admin_verify_fn` が `false` → **ステップ 2k**（0023）
- `delete_account_fn` が `false` → **ステップ 2l**（0024）
- `msg_rls_fix` が `false` → **ステップ 2m**（0025・メッセージ不具合の修正／要適用）
- `msg_create_fn` が `false` → **ステップ 2n**（0026・メッセージ作成の修正／要適用）
- `events_sort` が `false` → **ステップ 2o**（0027・イベントを近日順に）
- `notify_status_fn` が `false` → **ステップ 2p**（0028・通知の改善）
- `read_receipts_rt` が `false` → **ステップ 2q**（0029・既読のリアルタイム）
- `app_update_guard` が `false` → **ステップ 2r**（0030・応募承認の権限強化／推奨）
- `app_realtime` が `false` → **ステップ 2s**（0031・応募ステータスのリアルタイム）
- `verify_notify` が `false` → **ステップ 2t**（0032・本人確認結果の通知）
- `group_chat_fn` が `false` → **ステップ 2u**（0033・併せグループチャット）
- `chat_images` が `false` → **ステップ 2v**（0034・チャット画像）
- `qa_delete_policy` が `false` → **ステップ 2w**（0035・知恵袋の削除方針）
- `home_pickups_table` が `false` → **ステップ 2x**（0036・トップのピックアップ）
- `home_pickups_admin` が `false` → **ステップ 2y**（0037・ピックアップを運営画面から管理）
- `studios_chubu` が `0` → **ステップ 2z**（0038・撮影スタジオに中部/名古屋を追加）
- `awase_schedule` が `false` → **ステップ 2aa**（0039・併せの日程調整）
- `works_reading` が `false` → **ステップ 2ab**（0040・作品をあいうえお順に）
- `follow_notify` が `false` → **ステップ 2ac**（0041・フォロー機能の通知）
- `role_assignment` が `false` → **ステップ 2ad**（0042・希望キャラの承認で自動確定）
- `event_images` が `false` → **ステップ 2ae**（0043・イベントのサムネイル）
- `events_admin` が `false` → **ステップ 2af**（0044・サムネを運営画面から管理）
- `feedback_table` が `false` → **ステップ 2ag**（0045・運営へ要望フォーム）
- `activity_events_table` が `false` → **ステップ 2ah**（0046・ホームのにぎわい）
- `activity_events_admin` が `false` → **ステップ 2ai**（0047・うごきを運営画面から管理）
- `announcements_admin` が `false` → **ステップ 2aj**（0048・お知らせを運営画面から管理）
- `qa_count` が `0` → **ステップ 3**（知恵袋）

> 2026-07 時点では **0001〜0035（このドキュメント記載分すべて）が適用済み**です。
> 以下の各手順は、新しい環境の構築や、今後マイグレーションが追加されたときの
> 参照用として残しています。適用済みのステップはスキップして構いません
> （各マイグレーションは冪等・再実行安全）。

---

## ☐ ステップ 1: お知らせ機能（マイグレーション 0012）

`announcements_table` が `null` のときだけ実行します。

1. リポジトリの **`supabase/migrations/0012_announcements.sql`** を開く
2. 中身を**全部コピー**して SQL Editor に貼り付け、実行

→ `announcements` テーブルが作成され、初期のお知らせ3件（公開／PC対応／
本人確認バッジ）が入ります。以後のお知らせ追加は `docs/ANNOUNCEMENTS.md`。

> 0012 は**何度実行してもエラーにならない（冪等）**書き方です。すでに適用済みでも
> 安全に再実行できます（`ERROR: 42P07 ... already exists` は出ません）。

---

## ☐ ステップ 2: 2026年のイベント（マイグレーション 0013）

`events_2026` が `0` のときだけ実行します。

1. リポジトリの **`supabase/migrations/0013_events_2026.sql`** を開く
2. 中身を**全部コピー**して SQL Editor に貼り付け、実行

→ 旧サンプル4件が削除され、2026年の実在イベント5件（コスサミ／夏コミ／
Ultra acosta!／池ハロ／冬コミ）に置き換わります。開催前に各公式で日程の
最終確認を。

---

## ☐ ステップ 2b: 2027年のイベント（マイグレーション 0014）

`events_2027` が `0` のときだけ実行します。

1. リポジトリの **`supabase/migrations/0014_events_2027.sql`** を開く
2. 中身を**全部コピー**して SQL Editor に貼り付け、実行

→ 発表済みの2027年イベント2件（コスブー2nd／世界コスプレサミット2027）が
追加されます（2026年イベントは残ります）。追加のみ・冪等。

---

## ☐ ステップ 2c: ギャラリー並び替え対応（マイグレーション 0015）

`posts_sort_col` が `false` のときだけ実行します。

1. リポジトリの **`supabase/migrations/0015_posts_sort.sql`** を開く
2. 中身を**全部コピー**して SQL Editor に貼り付け、実行

→ `posts` に並び順の列 `sort` と本人向けの更新ポリシーが追加され、マイページの
ギャラリーで並び替えができるようになります。冪等・再実行安全。

---

## ☐ ステップ 2d: 作品カタログの拡充（マイグレーション 0016）

`works_count` が少ない（数十未満）ときに実行します。

1. リポジトリの **`supabase/migrations/0016_seed_works_2026.sql`** を開く
2. 中身を**全部コピー**して SQL Editor に貼り付け、実行

→ 近年人気のアニメ・ゲーム・VTuber など約50作品が `works` に追加され、併せ作成の
作品選択が充実します。`on conflict do nothing` で追加のみ・冪等。

---

## ☐ ステップ 2e: 主催者向けツール（マイグレーション 0017）

`host_tools` が `false` のときだけ実行します。

1. リポジトリの **`supabase/migrations/0017_awase_host_tools.sql`** を開く
2. 中身を**全部コピー**して SQL Editor に貼り付け、実行

→ 応募の承認数が定員に達すると、その併せの募集を**自動で締め切る**トリガーが
入ります（応募者管理画面の「募集中／満員／締切」表示と連動）。定員未設定の併せは
対象外。冪等・再実行安全。

---

## ☐ ステップ 2f: 公開予約・応募締切・募集テンプレ（マイグレーション 0018）

`scheduling` が `false` のときだけ実行します。

1. リポジトリの **`supabase/migrations/0018_awase_scheduling.sql`** を開く
2. 中身を**全部コピー**して SQL Editor に貼り付け、実行

→ 併せに **公開予約（`publish_at`）** と **応募締切（`application_deadline`）** の列、
主催者ごとの **募集テンプレート（`awase_templates`）** が追加されます。公開予約の時刻
までは主催以外に非表示、応募締切を過ぎると応募不可（いずれもRLSで担保）。冪等・
再実行安全。

---

## ☐ ステップ 2g: キャンセル待ち受付（マイグレーション 0019）

`waitlist` が `false` のときだけ実行します。

1. リポジトリの **`supabase/migrations/0019_awase_waitlist.sql`** を開く
2. 中身を**全部コピー**して SQL Editor に貼り付け、実行

→ 併せに **`accept_waitlist`** 列が追加され、ONの併せは定員到達後も自動締切せず
**キャンセル待ち**として応募を受け付けます（第1弾の自動締切トリガーを更新）。応募者管理
画面で「満員・キャンセル待ち」表示、承認者への **一斉連絡** が使えます。冪等・再実行安全。

> 補足（任意）：**応募締切のリマインダーを自動送信**したい場合は、Supabase の
> pg_cron ＋ 関数で実現できます（アプリ側の常駐cronは無いため）。当面は応募者管理
> 画面の「一斉連絡 → リマインダー文を挿入」で**手動送信**すれば十分です。自動化が
> 必要になったら、日次で「翌日開催の併せの承認者へ通知を作る」関数を pg_cron に
> 登録する運用を検討してください（設計は要相談）。

---

## ☐ ステップ 2h: 撮影スタジオDB（マイグレーション 0020）

`studios_table` が `false` のときだけ実行します。

1. リポジトリの **`supabase/migrations/0020_studios.sql`** を開く
2. 中身を**全部コピー**して SQL Editor に貼り付け、実行

→ `studios` テーブルが作成され、有名どころ7件（ハコスタジアム系列・LUZZ STUDIO 等）が
シードされます。**料金・シチュエーションの詳細は各公式サイトで確認のうえ、適宜
UPDATE/INSERT で充実させてください**（一般ユーザーの書込みは不可・運営キュレーション型）。

---

## ☐ ステップ 2i: ギャラリー公開範囲（マイグレーション 0021）

`post_visibility` が `false` のときだけ実行します。

1. リポジトリの **`supabase/migrations/0021_post_visibility.sql`** を開く
2. 中身を**全部コピー**して SQL Editor に貼り付け、実行

→ 投稿ごとに「🌐 全体公開 / 🔒 併せ仲間のみ」を選べるようになります
（併せ仲間 = 同じ併せで承認済み/完了になった相手・主催⇄参加の関係。RLSで担保）。

---

## ☐ ステップ 2j: 併せの閲覧数（マイグレーション 0022）

`awase_views` が `false` のときだけ実行します。

1. リポジトリの **`supabase/migrations/0022_awase_views.sql`** を開く
2. 中身を**全部コピー**して SQL Editor に貼り付け、実行

→ 併せ詳細の閲覧が加算され、**主催者にだけ**「これまで◯回見られています」と表示
されます（閲覧者側には出しません）。

---

## ☐ ステップ 2k: 本人確認の承認画面（マイグレーション 0023）

`admin_verify_fn` が `false` のときだけ実行します。

1. リポジトリの **`supabase/migrations/0023_admin_verification.sql`** を開く
2. 中身を**全部コピー**して SQL Editor に貼り付け、実行
3. 運営アカウントを有効化（**1回だけ**、`PASTE_OPERATOR_USER_ID` を自分のIDに）:
   ```sql
   update profiles set is_admin = true where id = 'PASTE_OPERATOR_USER_ID';
   ```

→ 設定 →「運営」→「本人確認の承認」から、保留申請の一覧・身分証プレビュー・
承認/却下がアプリ上で行えるようになります。詳細は `docs/VERIFICATION_REVIEW.md`。

---

## ☐ ステップ 2l: 退会（アカウント削除）（マイグレーション 0024）

`delete_account_fn` が `false` のときだけ実行します。

1. リポジトリの **`supabase/migrations/0024_account_deletion.sql`** を開く
2. 中身を**全部コピー**して SQL Editor に貼り付け、実行

→ 設定 →「アカウント」→「退会（アカウント削除）」から、ユーザー本人が自分の
アカウントを完全削除できるようになります。プロフィール以下（併せ・応募・投稿・
DM・レビュー等）が cascade で削除されます。**取り消し不可**。

> R2 の画像（本人確認書類・併せカバー・投稿画像）は DB のカスケードでは
> 消えません。本人確認書類は従来どおり審査後に削除、その他は必要に応じて
> ストレージ側で孤児オブジェクトを掃除してください。

---

## ☐ ステップ 2m: メッセージ不具合の修正（マイグレーション 0025）【要適用】

`msg_rls_fix` が `false` のときは**必ず**実行してください。これが未適用だと
**メッセージ機能（会話作成・一覧取得）が動きません**（「メッセージ」ボタンが無反応）。

1. リポジトリの **`supabase/migrations/0025_fix_messaging_rls_recursion.sql`** を開く
2. 中身を**全部コピー**して SQL Editor に貼り付け、実行

→ `conversation_members` / `messages` の RLS が自己参照で無限再帰していたのを、
SECURITY DEFINER 関数 `is_conversation_member()` 経由に置き換えて解消します。冪等・再実行安全。

---

## ☐ ステップ 2n: メッセージ作成の修正（マイグレーション 0026）【要適用】

`msg_create_fn` が `false` のときは**必ず**実行してください。**0025 とセットで適用**します。
0025 だけでは、会話作成時の2行 INSERT が RLS の行単位チェックで落ちる場合があり、
「メッセージ」ボタンが無反応のままになります。

1. リポジトリの **`supabase/migrations/0026_create_direct_conversation.sql`** を開く
2. 中身を**全部コピー**して SQL Editor に貼り付け、実行

→ 1:1会話の find-or-create を SECURITY DEFINER 関数 `create_direct_conversation()` に
一本化し、RLS を安全に迂回して原子的に作成します。適用後、プロフィールの
「メッセージ」から確実に DM を開始できます。冪等・再実行安全。

---

## ☐ ステップ 2o: イベントを近日順に（マイグレーション 0027）

`events_sort` が `false` のときに実行します。

1. リポジトリの **`supabase/migrations/0027_events_sort_date.sql`** を開く
2. 中身を**全部コピー**して SQL Editor に貼り付け、実行

→ `events` に並べ替え用の `starts_on`（開始日）列を追加し、既存イベントの開始日を
バックフィルします。トップの「近日開催」とイベント一覧が**開始日の早い順**になり、
トップは**今日以降の近い3件**だけを表示します。冪等・再実行安全。

> 以後イベントを追加するときは `starts_on`（開始日, 例 `2027-05-03`）も入れてください。
> 未設定だと並び順で末尾になり、トップの近日欄にも出ません。

---

## ☐ ステップ 2p: 通知の改善（マイグレーション 0028）

`notify_status_fn` が `false` のときに実行します。

1. リポジトリの **`supabase/migrations/0028_notifications_fixes.sql`** を開く
2. 中身を**全部コピー**して SQL Editor に貼り付け、実行

→ 2点を修正します。
> - **Realtime を確実に配信**：`notifications` / `messages` を `replica identity full` に
>   して、ベルの未読バッジや新着メッセージがリアルタイムに届くようにする。
> - **承認/却下を応募者へ通知**：主催者が応募を承認・却下したとき、応募者の
>   おしらせに通知が届くトリガーを追加（従来は応募が入った時の主催者向け通知のみ）。

冪等・再実行安全。なお「おしらせ」のベルに**未読バッジ**を出すUI改善はアプリ側の
デプロイで自動反映されます（この SQL 適用でリアルタイム更新も有効になります）。

---

## ☐ ステップ 2q: 既読表示のリアルタイム化（マイグレーション 0029）

`read_receipts_rt` が `false` のときに実行します。

1. リポジトリの **`supabase/migrations/0029_read_receipts_realtime.sql`** を開く
2. 中身を**全部コピー**して SQL Editor に貼り付け、実行

→ チャットの「既読」表示（LINE風）は `conversation_members.last_read_at` を使います。
この SQL で `conversation_members` を Realtime パブリケーションに追加し、相手が
スレッドを開いた瞬間に自分の画面の「既読」が付くようにします。**未適用でも**
既読自体は表示されますが、画面を開き直すまで反映が遅れます。冪等・再実行安全。

---

## ☐ ステップ 2r: 応募承認の権限強化（マイグレーション 0030・推奨）

`app_update_guard` が `false` のときに実行します。

1. リポジトリの **`supabase/migrations/0030_applications_update_guard.sql`** を開く
2. 中身を**全部コピー**して SQL Editor に貼り付け、実行

→ 応募ステータス更新のRLSに `with check` を追加し、**承認/却下は主催者のみ**、
応募者は自分の行を `done`（参加済み）/`rejected`（辞退）にできる範囲に限定します。
未適用だと理論上、応募者が自分の応募を「承認」に書き換える自己承認が可能なため、
セキュリティ上の推奨対応です。冪等・再実行安全。

---

## ☐ ステップ 2s: 応募ステータスのリアルタイム反映（マイグレーション 0031）

`app_realtime` が `false` のときに実行します。

1. リポジトリの **`supabase/migrations/0031_applications_realtime.sql`** を開く
2. 中身を**全部コピー**して SQL Editor に貼り付け、実行

→ `awase_applications` を Realtime パブリケーションに追加（＋replica identity full）。
主催者が承認/却下/「応募中に戻す」を押した瞬間に、**応募者側の状態表示**と
**主催者側の応募者一覧**が即時更新されます。**未適用でも**画面を開き直せば反映
されますが、即時反映にはこの適用が必要。閲覧は RLS で本人/主催者に限定。冪等・再実行安全。

---

## ☐ ステップ 2t: 本人確認結果の通知（マイグレーション 0032）

`verify_notify` が `false` のときに実行します。

1. リポジトリの **`supabase/migrations/0032_verification_notify.sql`** を開く
2. 中身を**全部コピー**して SQL Editor に貼り付け、実行

→ `admin_approve_verification` / `admin_reject_verification` を更新し、承認/却下の
どちらでも申請者の**「おしらせ」に通知**が届くようにします（承認: バッジ付与のお知らせ、
却下: 理由付き・再申請できる旨）。通知をタップするとマイページへ遷移します。
`create or replace function` のため冪等・再実行安全。

---

## ☐ ステップ 2u: 併せグループチャット（マイグレーション 0033）

`group_chat_fn` が `false` のときに実行します。

1. リポジトリの **`supabase/migrations/0033_awase_group_chat.sql`** を開く
2. 中身を**全部コピー**して SQL Editor に貼り付け、実行

→ 併せごとに「主催＋承認済みメンバー全員」のグループチャットが使えるようになります。
- 主催者は応募者管理画面の「グループチャット」から、承認済みメンバーは併せ詳細の
  「メンバーのグループチャット」から開けます（初回に開いた人が作成）。
- 応募の承認/取り消しに合わせてメンバーが**自動で追加/削除**されます（トリガー）。
- メッセージの閲覧/送信は既存の RLS（メンバーのみ）がそのまま効きます。冪等・再実行安全。

---

## ☐ ステップ 2v: チャットで画像を送れるように（マイグレーション 0034）

`chat_images` が `false` のときは**デプロイ後すみやかに**実行してください
（メッセージ画面が新しい `image_url` 列を参照するため、未適用の間はチャットの
読み込みに失敗します）。

1. リポジトリの **`supabase/migrations/0034_chat_images.sql`** を開く
2. 中身を**全部コピー**して SQL Editor に貼り付け、実行

→ DM・グループチャット共通で📷ボタンから画像を送れるようになります
（R2にアップロード、タップで拡大表示、一覧では「📷 画像」と表示）。
本文なしの画像だけの送信も可能になります。冪等・再実行安全。

---

## ☐ ステップ 2w: 知恵袋の削除方針（マイグレーション 0035）

`qa_delete_policy` が `false` のとき実行します。

1. リポジトリの **`supabase/migrations/0035_qa_deletion_policy.sql`** を開く
2. 中身を**全部コピー**して SQL Editor に貼り付け、実行

→ 知恵袋の削除ルールが次のとおりになります。

- **質問**: 回答が付くまでは投稿者本人が削除可（詳細画面に「この質問を削除」）。
  回答が付いた後は運営のみ削除できます。
- **回答**: ベストアンサーに選ばれる前なら回答者本人が削除可（各回答に「削除」）。
  ベストアンサーは運営のみ削除できます。
- 運営が削除するときは SQL Editor で次を実行します（`is_admin` なアカウントの
  セッションでアプリから RPC を呼ぶか、SQL Editor から直接 `delete` でも可）。

```sql
-- 質問を運営権限で削除（回答・いいねも一緒に消えます）
delete from qa_questions where id = '質問のID';
-- 回答を運営権限で削除
delete from qa_answers where id = '回答のID';
```

冪等・再実行安全。

---

## ☐ ステップ 2x: トップの「プルミエ！ピックアップ」（マイグレーション 0036）

`home_pickups_table` が `false` のとき実行します。

1. リポジトリの **`supabase/migrations/0036_home_pickups.sql`** を開く
2. 中身を**全部コピー**して SQL Editor に貼り付け、実行

→ トップページに「プルミエ！ピックアップ」コーナー（運営がキュレーションした
レイヤーさん写真のショーケース）が出せるようになります。**タップ導線はなく、
見せるだけ**のコーナーです。

### 写真の登録方法

**必ず本人の同意を得た写真だけ**を登録してください（著作権・肖像権対策）。
表示枚数は「**8枚あれば8枚、4〜7枚なら4枚、4枚未満なら非表示**」に自動で
出し分きます。まずは **4枚か8枚** を目安に登録するのがおすすめです。

1. 画像を公開URLで用意する（例: Cloudflare R2 の公開バケットにアップロードして
   公開URLを取得。他の許諾済みホスティングURLでも可）。
2. `PASTE_URL_n` を実際の画像URLに置き換えて実行（`caption` は任意。レイヤー名や
   作品名など。今はタップしても遷移しないので装飾用途）。

```sql
insert into home_pickups (image_url, caption, sort) values
  ('PASTE_URL_1', null, 1),
  ('PASTE_URL_2', null, 2),
  ('PASTE_URL_3', null, 3),
  ('PASTE_URL_4', null, 4),
  ('PASTE_URL_5', null, 5),
  ('PASTE_URL_6', null, 6),
  ('PASTE_URL_7', null, 7),
  ('PASTE_URL_8', null, 8);
```

- 並び順は `sort`（小さいほど先）。一時的に隠したい写真は
  `update home_pickups set is_active = false where id = '対象のID';`。
- 差し替えは行を消して入れ直すか、`image_url` を更新するだけ。

冪等・再実行安全（テーブル作成は 0036、写真の登録は上記INSERTを必要な分だけ）。

> **0037 を適用すると、以下の SQL 操作はアプリの運営画面から行えるようになります**
> （設定 → 運営 → 「トップのピックアップ管理」）。SQL Editor での操作は
> 初期投入や緊急時のバックアップ手段として残しておいてください。

---

## ☐ ステップ 2y: ピックアップを運営画面から管理（マイグレーション 0037）

`home_pickups_admin` が `false` のとき実行します。

1. リポジトリの **`supabase/migrations/0037_home_pickups_admin.sql`** を開く
2. 中身を**全部コピー**して SQL Editor に貼り付け、実行

→ 運営アカウント（`profiles.is_admin = true`）が、アプリ内の
**設定 → 運営 → 「トップのピックアップ管理」** から、ピックアップ写真を
**追加（アップロード）・公開/非公開・並び替え・削除**できるようになります。
画像は R2 に `pickup/<運営のID>/…` として保存されます。書き込みは RLS で
`is_admin()` に限定されており、一般ユーザーからは変更できません。冪等・再実行安全。

> 運営アカウントの指定は `update profiles set is_admin = true where id = '対象のID';`
> （本人確認の承認画面と同じ運営フラグを使います）。

---

## ☐ ステップ 2z: 撮影スタジオに中部（名古屋）を追加（マイグレーション 0038）

`studios_chubu` が `0` のとき実行します。

1. リポジトリの **`supabase/migrations/0038_studios_chubu.sql`** を開く
2. 中身を**全部コピー**して SQL Editor に貼り付け、実行

→ スタジオ一覧の地域フィルタに「**中部**」チップが増え、名古屋の実在
スタジオ（Reve／photo space HISAYA／千代田ヴィレッジ／Buff STUDIO）が
表示されます。地域チップは `studios.region` から自動生成されるので、UI 側の
変更は不要です。`on conflict (name) do nothing` 付きで冪等・再実行安全。

- 追加・変更したいスタジオは、SQL Editor から `studios` に直接 INSERT/UPDATE
  してください（例のフォーマットは 0038 と 0020 を参照）。料金は変動するため
  `price_text` は「時間制（公式サイト参照）」のように公式サイト参照に留めるのが安全です。

---

## ☐ ステップ 2aa: 併せの日程調整（マイグレーション 0039）

`awase_schedule` が `false` のとき実行します。

1. リポジトリの **`supabase/migrations/0039_awase_schedule.sql`** を開く
2. 中身を**全部コピー**して SQL Editor に貼り付け、実行

→ 併せ詳細ページに「**日程調整**」セクション（調整さん風の○△×投票）が
使えるようになります。

- **候補日の追加・削除・確定**はホストのみ（「この日に確定」で候補をハイライト）
- **○△×の回答**はホスト＋承認済みメンバー（accepted/done）のみ。RLS でも強制
- 回答すると**ホストにおしらせ通知**が届き（初回回答時のみ）、タップでその併せに飛べます
- 回答は Realtime で他のメンバーの画面にも即時反映されます

未適用の間も既存画面は壊れません（日程調整セクションが表示されないだけ）。
冪等ではないため**実行は1回だけ**にしてください（`already exists` エラーが
出たら適用済みです）。

---

## ☐ ステップ 2ab: 作品をあいうえお順に（マイグレーション 0040）

`works_reading` が `false` のとき実行します。

1. リポジトリの **`supabase/migrations/0040_works_reading.sql`** を開く
2. 中身を**全部コピー**して SQL Editor に貼り付け、実行

→ `works` に読み（かな）列が付き、併せ作成画面の作品選択が
**あいうえお順＋読み検索（ナルト/naruto/なると）** で選べるようになります。
未適用の間も壊れず、従来どおり名前順で表示されます（`select("*")` で読み列が
無くても動作）。冪等（`add column if not exists`）で再実行安全。

- **今後 works に作品を追加**したら、あわせて読みも入れると並びが崩れません:
  `update works set reading = 'よみ' where name = '作品名';`
  （読み未設定でも致命的ではなく、その作品だけ名前基準で並びます）

---

## ☐ ステップ 2ac: フォロー機能の通知（マイグレーション 0041）

`follow_notify` が `false` のとき実行します。

1. リポジトリの **`supabase/migrations/0041_follow_notify.sql`** を開く
2. 中身を**全部コピー**して SQL Editor に貼り付け、実行

→ プロフィールの「フォローする」ボタンに合わせて、**フォローされた相手に
おしらせ通知**が届くようになります（タップでフォロワーのプロフィールへ）。
フォロー自体（follows テーブル・RLS）は 0001 で実装済みなので、**未適用でも
フォロー/解除とフォロワー数は動きます**（通知が届かないだけ）。

- あわせてこのリリースで、設定の「非公開アカウント」トグルが実際に
  `profiles.is_private` へ保存されるようになりました（ONにするとプロフィールが
  本人とフォロワー以外から見えなくなります）。DB側は 0001 実装済みのため
  マイグレーション不要です。

---

## ☐ ステップ 2ad: 希望キャラの承認で自動確定（マイグレーション 0042）

`role_assignment` が `false` のとき実行します。

1. リポジトリの **`supabase/migrations/0042_role_assignment.sql`** を開く
2. 中身を**全部コピー**して SQL Editor に貼り付け、実行

→ 応募時に選んだ「希望キャラ」（`awase_applications.role_id`）が、主催の
**承認で自動的に担当キャラとして確定**します（`awase_roles` の担当者・状態を更新）。
承認を外す（辞退/差し戻し）と枠が解放されます。トリガーのみで、
`role_id`・`awase_roles` は 0001 実装済み。

- **未適用でも壊れません**：応募時の希望キャラ選択・主催の一覧での希望表示や
  かぶり警告は動きます（承認しても担当キャラが自動確定しないだけ）。
- 応募側UI（希望キャラ選択）・主催側UI（希望表示・かぶり警告）にはマイグレーション不要。

---

## ☐ ステップ 2ae: イベントのサムネイル（マイグレーション 0043）

`event_images` が `false` のとき実行します。

1. リポジトリの **`supabase/migrations/0043_event_images.sql`** を開く
2. 中身を**全部コピー**して SQL Editor に貼り付け、実行

→ `events.image_url` にURLを入れたイベントは、一覧・ホーム・詳細で
その画像がサムネイル表示されます。**未設定のイベントはイベント名から
生成したデザイン**（作品カバーと同方式・権利リスクなし）で表示されるので、
空のままでも見栄えは保たれます。冪等（`add column if not exists`）。

### ⚠️ 画像の入手について（重要）

大型イベントの**公式ロゴ・キービジュアルは自由に使えません**。プレス素材は
審査制の取材申請を通した報道機関向けで、無許諾でのアプリ掲載は
著作権・商標のリスクがあります。入れてよいのは次のいずれかだけです:

- **主催から掲載許諾を得た画像**（各公式サイトのプレス／お問い合わせ窓口から
  「イベント情報アプリへのロゴ掲載可否」を打診。例: コスサミは
  worldcosplaysummit.jp/press/、コミケは comiket.co.jp、acosta! は
  hacosta 社の問い合わせ窓口）
- **運営が自分で撮影した会場・雰囲気写真**（写り込んだ人物が特定できない
  もの、または本人の同意があるもの）

### 画像URLの入れ方（許諾を得た後）

R2 の公開バケット等にアップロードして、公開URLを設定します:

```sql
update events set image_url = '画像の公開URL' where name = '世界コスプレサミット2026';
```

外したいときは `update events set image_url = null where name = '...';`

---

## ☐ ステップ 2af: サムネを運営画面から管理（マイグレーション 0044）

`events_admin` が `false` のとき実行します。

1. リポジトリの **`supabase/migrations/0044_events_admin.sql`** を開く
2. 中身を**全部コピー**して SQL Editor に貼り付け、実行

→ 運営アカウント（`profiles.is_admin = true`）が、アプリの
**設定 → 運営 → 「イベントのサムネイル管理」**から各イベントのサムネイルを
画像アップロードで設定・変更・解除できるようになります。ステップ 2ae のように
SQL でURLを直接入れる必要はなくなります（SQLでの設定も引き続き可能）。

- 追加された RLS は `events` の **update だけ**を `is_admin()` に開放するもので、
  イベントの新規作成・削除はできません（＝運営が誤って消せない）。
- 画像は R2 に `event/<運営のユーザーID>/<uuid>.<拡張子>` として保存されます。
- **掲載してよいのは主催から許諾を得た画像／運営が自ら撮影した会場写真だけ**
  （公式ロゴ・キービジュアルは不可。ステップ 2ae の注意書きと同じ）。

冪等ではないため（`create policy`）、既に適用済みなら実行不要です。再実行すると
「policy already exists」エラーになりますが無害です。

---

## ☐ ステップ 2ag: 運営へ要望フォーム（マイグレーション 0045）

`feedback_table` が `false` のとき実行します。

1. リポジトリの **`supabase/migrations/0045_feedback.sql`** を開く
2. 中身を**全部コピー**して SQL Editor に貼り付け、実行

→ ユーザーが**サイドバー最下部の「運営へ要望」**（モバイルは
設定 → 安全とサポート → 「運営へ要望を送る」）から要望・不具合報告を
送れるようになります。届いた内容は運営アカウントだけが
**設定 → 運営 → 「要望の管理」**で閲覧でき、ステータス
（未対応 → 対応中 → 完了）で消し込めます。

- 送信はログインユーザー本人のみ（RLS で `user_id = auth.uid()` を強制）。
- 閲覧・更新は `is_admin()` のみ。**他のユーザーには一切見えません**。
- 退会したユーザーの送信分は「（退会済み）」表示で残ります。

冪等ではないため（`create table`）、既に適用済みなら実行不要です。

---

## ☐ ステップ 2ah: ホームのにぎわい（マイグレーション 0046）

`activity_events_table` が `false` のとき実行します。

1. リポジトリの **`supabase/migrations/0046_home_liveliness.sql`** を開く
2. 中身を**全部コピー**して SQL Editor に貼り付け、実行

→ ホームに「いま○人が見ています」「今日 併せ○件・参加○件」「最近のうごき」
「急上昇の作品」を表示できるようになります。

- **最近のうごき**: 併せの新規募集・レビュー投稿・イベント参加表明を、
  トリガーが生成した固定文言（応募者名や投稿者IDは含めない）で記録し、
  Realtime でホームに即時反映します。**予約公開の併せは公開時刻が来るまで
  記録されません**（一覧の可視条件と同じ扱い）。
- **急上昇の作品**: `trending_works()` RPC で直近7日の新規募集数を集計。
- **同時接続人数・今日の新着**は Supabase Realtime Presence と既存テーブルの
  集計クエリで賄うため、この画面に紐づくデータはDBに残りません。

冪等ではないため（`create table`）、既に適用済みなら実行不要です。

> 運用メモ: `activity_events` は使うほど行が増えます。古い行の削除は
> ステップ 2ai（0047）を適用すると**運営画面から**できるようになります。

---

## ☐ ステップ 2ai: うごきを運営画面から管理（マイグレーション 0047）

`activity_events_admin` が `false` のとき実行します。

1. リポジトリの **`supabase/migrations/0047_activity_admin.sql`** を開く
2. 中身を**全部コピー**して SQL Editor に貼り付け、実行

→ 運営アカウントが、アプリの**設定 → 運営 → 「最近のうごきの管理」**から
「最近のうごき」の行を確認し、個別削除・古い行の一括削除（7日／14日／30日
より前）ができるようになります。ステップ 2ah の運用メモにある定期整理も、
SQL を書かずにこの画面から行えます。

- 追加された RLS は `activity_events` の **delete だけ**を `is_admin()` に
  開放するもので、行の内容（見出し文）は引き続きトリガー生成のみ・
  運営でも書き換えはできません。

冪等ではないため（`create policy`）、既に適用済みなら実行不要です。再実行すると
「policy already exists」エラーになりますが無害です。

---

## ☐ ステップ 2aj: お知らせを運営画面から管理（マイグレーション 0048）

`announcements_admin` が `false` のとき実行します。

1. リポジトリの **`supabase/migrations/0048_announcements_admin.sql`** を開く
2. 中身を**全部コピー**して SQL Editor に貼り付け、実行

→ 運営アカウントが、アプリの**設定 → 運営 → 「お知らせの管理」**から
お知らせ・更新履歴を**投稿・編集・削除**できるようになります。これまで
SQL Editor から `insert into announcements ...` していた作業が、SQLを書かずに
画面から行えるようになります（種別は お知らせ／アップデート／メンテナンス）。

- 投稿するとホームの最新1件と「お知らせ・更新履歴」画面に即反映されます。
- 追加された RLS は `announcements` の insert/update/delete を `is_admin()` に
  限定するもので、閲覧は従来どおり全員可のままです。

冪等ではないため（`create policy`）、既に適用済みなら実行不要です。再実行すると
「policy already exists」エラーになりますが無害です。

---

## ☐ ステップ 3: 知恵袋の初期FAQ投入

`qa_count` が `0` のとき推奨。**重複投入を避けるため、実行は1回だけ**にして
ください（もう一度入れたい場合は先に既存分を消す）。

### 3-1. 運営アカウントの user_id を調べる

これらの質問の投稿者にしたいアカウントで一度ログイン／プロフィール作成して
から、次を実行して `id` を控えます。

```sql
select id, handle, display_name, created_at
from profiles
order by created_at
limit 20;
```

### 3-2. 下の `PASTE_OPERATOR_USER_ID` を 3-1 の id に置き換えて実行

```sql
do $$
declare
  op uuid := 'PASTE_OPERATOR_USER_ID';   -- ← 3-1で調べた運営アカウントの id
  q  uuid;
begin
  insert into qa_questions (author_id, title, body, tag)
  values (op, 'プルミエ！の使い方を教えてください',
    'コスプレの「併せ（合わせ）」に参加してみたいのですが、何から始めればいいですか？', '使い方')
  returning id into q;
  insert into qa_answers (question_id, author_id, body, is_best)
  values (q, op,
    'ようこそ！ ①プロフィールを整える → ②好きな作品をフォロー → ③「さがす」から気になる募集に参加、の流れがおすすめです。自分で募集したいときは「＋（併せを作る）」から作成できます。わからないことがあれば、この知恵袋で気軽に質問してください🙌', true);

  insert into qa_questions (author_id, title, body, tag)
  values (op, '併せ募集の書き方のコツはありますか？',
    '参加者が集まりやすい募集の書き方を知りたいです。', '主催')
  returning id into q;
  insert into qa_answers (question_id, author_id, body, is_best)
  values (q, op,
    'タイトルに「作品名・キャラ・雰囲気」を入れると検索で見つかりやすくなります。日程・地域・世界観タグ・募集人数・費用（スタジオ代の割り勘など）を具体的に書くと集まりやすいです。参考画像を1〜2枚添えるのも効果的です◎', true);

  insert into qa_questions (author_id, title, body, tag)
  values (op, '安心して参加するために気をつけることは？',
    '初めての併せで不安です。トラブルを避けるコツを教えてください。', '安全')
  returning id into q;
  insert into qa_answers (question_id, author_id, body, is_best)
  values (q, op,
    '事前にメッセージで「集合場所・時間・費用の分担・撮影データの扱い」をすり合わせておくと安心です。不安な相手や不適切な内容は、プロフィールや募集ページから通報・ブロックできます。困ったときは無理をせず、まず連絡・相談を。', true);

  insert into qa_questions (author_id, title, body, tag)
  values (op, '本人確認は必須ですか？',
    'プロフィールの本人確認バッジについて知りたいです。', '本人確認')
  returning id into q;
  insert into qa_answers (question_id, author_id, body, is_best)
  values (q, op,
    '本人確認は任意です。行うとプロフィールのお名前の横に「確認済みバッジ」が表示され、相手に安心感を持ってもらいやすくなります。設定 →「本人確認」からお手続きできます（確認後、身分証画像は速やかに削除しています）。', true);

  insert into qa_questions (author_id, title, body, tag)
  values (op, '撮影した写真の掲載・共有はどうすればいい？',
    '併せで撮った写真をSNSに載せてよいか迷います。', '撮影')
  returning id into q;
  insert into qa_answers (question_id, author_id, body, is_best)
  values (q, op,
    '写り込む参加者がいる写真は、掲載前に「載せてよいか・どこまで公開するか」を本人へ確認しましょう。撮影時の合意と掲載の合意は別物として扱うのが安心です。原作・版権への配慮もお願いします。', true);
end $$;
```

---

## ☐ 完了確認

```sql
select
  (select count(*) from announcements)                    as announcements,   -- 3以上
  (select count(*) from events)                           as events,          -- 5
  (select count(*) from qa_questions)                     as qa_questions,    -- 5
  (select count(*) from qa_answers where is_best)         as qa_best_answers; -- 5
```

想定値: お知らせ 3、イベント **7**（2026: 5 ＋ 2027: 2）、質問 5、ベストアンサー 5。
アプリの「お知らせ」「イベント」「知恵袋」を開いて表示を確認してください。

---

## 運用時の参考（初期セットアップ後にときどき使うもの）

| やりたいこと | 手順書 |
| --- | --- |
| お知らせを追加・編集・削除 | `docs/ANNOUNCEMENTS.md` |
| 本人確認の承認・却下 | `docs/VERIFICATION_REVIEW.md` |
| 知恵袋にFAQを追記 | `docs/SEED_QA.md` |

> 2026-07 時点で **マイグレーション 0001〜0031 はすべて適用済み**です。今後さらに
> 新しいマイグレーションが追加されたら、ステップ 0 の診断クエリで未適用箇所を
> 確認し、同じ要領で SQL Editor から適用してください。
