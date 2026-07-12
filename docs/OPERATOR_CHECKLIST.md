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
  to_regclass('public.announcements')                 as announcements_table, -- null → 0012 未適用
  (select count(*) from events where name like '%2026%') as events_2026,       -- 0 → 0013 未適用
  (select count(*) from qa_questions)                  as qa_count;            -- 0 → 知恵袋 未投入
```

- `announcements_table` が `null` → **ステップ 1** を実行
- `events_2026` が `0` → **ステップ 2** を実行
- `qa_count` が `0` → **ステップ 3** を実行

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

想定値: お知らせ 3、イベント 5、質問 5、ベストアンサー 5。
アプリの「お知らせ」「イベント」「知恵袋」を開いて表示を確認してください。

---

## 運用時の参考（初期セットアップ後にときどき使うもの）

| やりたいこと | 手順書 |
| --- | --- |
| お知らせを追加・編集・削除 | `docs/ANNOUNCEMENTS.md` |
| 本人確認の承認・却下 | `docs/VERIFICATION_REVIEW.md` |
| 知恵袋にFAQを追記 | `docs/SEED_QA.md` |

> マイグレーション 0001〜0011 は既に適用済みの前提です（バックエンド接続が
> できている＝適用済み）。未適用のものは 0012・0013 の2本だけです。
