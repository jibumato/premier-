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
- `qa_count` が `0` → **ステップ 3**（知恵袋）

> 2026-07 時点では **0012〜0015 はすべて適用済み**です。以下の各手順は、新しい
> 環境の構築や、未適用が判明したときのための参照用として残しています。適用済みの
> ステップはスキップして構いません（各マイグレーションは冪等・再実行安全）。

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

> 2026-07 時点で **マイグレーション 0001〜0015 はすべて適用済み**です。**0016
> （作品カタログ）・0017（自動締切）・0018（公開予約等）・0019（キャンセル待ち）
> ・0020（スタジオDB）・0021（ギャラリー公開範囲）・0022（閲覧数）は新規追加**
> なので、ステップ 2d〜2j を順に実行してください。今後さらに新しいマイグレーションが
> 追加されたら、同じ要領で SQL Editor から適用してください。
