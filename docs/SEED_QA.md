# 知恵袋（Q&A）の初期投入手順（運営案内 / FAQ）

知恵袋がまだ空なので、運営アカウントから「よくある質問＋運営の回答」を数件
入れて呼び水にします。各質問に運営の回答を**ベストアンサー**として付けるので、
アプリ上では「解決済」バッジ付きの FAQ として表示されます。

- 質問（`qa_questions`）・回答（`qa_answers`）はどちらも投稿者
  （`author_id`）が必須で、実在するプロフィールに紐づきます。そのため
  **運営アカウントの user_id で投入**します。
- 実行は Supabase → **SQL Editor**（service_role）で行います。

---

## 手順

### 1) 運営アカウントの user_id を調べる

運営として使うアカウント（＝これらの質問の投稿者にしたいアカウント）で
一度ログイン／プロフィール作成しておき、次のクエリで id を確認します。

```sql
select id, handle, display_name, created_at
from profiles
order by created_at
limit 20;
```

### 2) 下の `PASTE_OPERATOR_USER_ID` を①のidに置き換えて実行

まとめて質問＋ベストアンサーを投入します。文面は自由に編集してください。

```sql
do $$
declare
  op uuid := 'PASTE_OPERATOR_USER_ID';   -- ← ①で調べた運営アカウントの id
  q  uuid;
begin
  -- Q1: 使い方
  insert into qa_questions (author_id, title, body, tag)
  values (op,
    'プルミエ！の使い方を教えてください',
    'コスプレの「併せ（合わせ）」に参加してみたいのですが、何から始めればいいですか？',
    '使い方')
  returning id into q;
  insert into qa_answers (question_id, author_id, body, is_best)
  values (q, op,
    'ようこそ！ ①プロフィールを整える → ②好きな作品をフォロー → ③「さがす」から気になる募集に参加、の流れがおすすめです。自分で募集したいときは「＋（併せを作る）」から作成できます。わからないことがあれば、この知恵袋で気軽に質問してください🙌',
    true);

  -- Q2: 募集の書き方
  insert into qa_questions (author_id, title, body, tag)
  values (op,
    '併せ募集の書き方のコツはありますか？',
    '参加者が集まりやすい募集の書き方を知りたいです。',
    '主催')
  returning id into q;
  insert into qa_answers (question_id, author_id, body, is_best)
  values (q, op,
    'タイトルに「作品名・キャラ・雰囲気」を入れると検索で見つかりやすくなります。日程・地域・世界観タグ・募集人数・費用（スタジオ代の割り勘など）を具体的に書くと、参加のイメージが伝わって集まりやすいです。参考画像を1〜2枚添えるのも効果的です◎',
    true);

  -- Q3: 安全・マナー
  insert into qa_questions (author_id, title, body, tag)
  values (op,
    '安心して参加するために気をつけることは？',
    '初めての併せで不安です。トラブルを避けるコツを教えてください。',
    '安全')
  returning id into q;
  insert into qa_answers (question_id, author_id, body, is_best)
  values (q, op,
    '事前にメッセージで「集合場所・時間・費用の分担・撮影データの扱い」をすり合わせておくと安心です。少しでも不安な相手や不適切な内容は、プロフィールや募集ページから通報・ブロックできます。運営でも安全に配慮して運用しています。困ったときは無理をせず、まずは連絡・相談を。',
    true);

  -- Q4: 本人確認
  insert into qa_questions (author_id, title, body, tag)
  values (op,
    '本人確認は必須ですか？',
    'プロフィールの本人確認バッジについて知りたいです。',
    '本人確認')
  returning id into q;
  insert into qa_answers (question_id, author_id, body, is_best)
  values (q, op,
    '本人確認は任意です。行うとプロフィールのお名前の横に「確認済みバッジ」が表示され、相手に安心感を持ってもらいやすくなります。設定 →「本人確認」から、身分証の画像を提出してお手続きできます（確認後、画像は速やかに削除しています）。',
    true);

  -- Q5: 写真の扱い
  insert into qa_questions (author_id, title, body, tag)
  values (op,
    '撮影した写真の掲載・共有はどうすればいい？',
    '併せで撮った写真をSNSに載せてよいか迷います。',
    '撮影')
  returning id into q;
  insert into qa_answers (question_id, author_id, body, is_best)
  values (q, op,
    '写り込む参加者がいる写真は、掲載前に「載せてよいか・どこまで公開するか」を本人へ確認しましょう。撮影時の合意と掲載の合意は別物として扱うのが安心です。原作・版権への配慮（過度な営利利用を避ける等）もお願いします。',
    true);
end $$;
```

### 3) 反映を確認

```sql
select q.title, q.tag, count(a.*) filter (where a.is_best) as best_answers
from qa_questions q
left join qa_answers a on a.question_id = q.id
group by q.id, q.title, q.tag
order by q.created_at desc;
```

アプリの「知恵袋」を開くと、投入した質問が並び、運営の回答が付いたものは
「解決済」として表示されます。

---

## 補足

- 「解決済」はベストアンサー（`is_best = true`）の有無から自動判定されます。
  専用カラムはありません。
- あとから質問を足す場合も、同じ形（`qa_questions` に insert →
  `qa_answers` にベストアンサーを insert）で追加できます。
- 一般ユーザーの質問・回答・いいね・ベスト選定はアプリ上で通常どおり動作します
  （この手順は最初の呼び水を入れるためのものです）。
