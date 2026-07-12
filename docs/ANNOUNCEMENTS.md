# 運営お知らせ／更新履歴の運用手順

「お知らせ・更新履歴」は `announcements` テーブルに1行追加するだけで、アプリの
ホーム上部のストリップと「設定 → お知らせ・更新履歴」の一覧に即反映されます。
デプロイは不要です。

- 反映先: ホーム上部の最新お知らせ帯／お知らせ一覧画面
- 並び順: `published_at` の新しい順
- 権限: 閲覧は全員可。**追加・編集・削除は運営のみ**（下記の Supabase SQL エディタ
  から実行。RLS を迂回できる管理者操作なので、一般ユーザーからは書き込めません）

---

## 事前準備（初回のみ）

`supabase/migrations/0012_announcements.sql` を **Supabase → SQL Editor** で一度だけ
実行してください（他のマイグレーション 0001〜0011 と同じ手順）。テーブルと初期の
お知らせ3件が作成されます。

---

## お知らせを追加する（コピペ用）

Supabase → **SQL Editor** に貼り付けて実行します。`category` / `title` / `body` を
書き換えてください。

```sql
insert into announcements (category, title, body) values
  (
    'update',                    -- カテゴリ: 'news' | 'update' | 'maintenance'
    'ここにタイトルを書く',
    'ここに本文を書く。改行もそのまま表示されます。'
  );
```

### カテゴリの使い分け（バッジの色が変わります）

| category      | 画面での表示   | 用途の目安                         |
| ------------- | -------------- | ---------------------------------- |
| `news`        | お知らせ       | 公開・キャンペーン・お礼など        |
| `update`      | アップデート   | 新機能・改善（デフォルト）          |
| `maintenance` | メンテナンス   | メンテ予定・障害連絡                |

`category` を省略すると自動的に `update`（アップデート）になります。

### 公開日時を指定したい場合

`published_at` を省略すると「今」の日時になります。予約投稿はできません（指定した
時刻が過去なら即公開、未来にしても一覧には表示されます）。日時を明示するときは:

```sql
insert into announcements (category, title, body, published_at) values
  (
    'maintenance',
    'メンテナンスのお知らせ',
    '7/20 26:00〜27:00 の間、システムメンテナンスを実施します。',
    '2026-07-15 10:00:00+09'     -- JST。末尾の +09 を忘れずに
  );
```

### 複数まとめて追加

```sql
insert into announcements (category, title, body) values
  ('update', 'タイトルA', '本文A'),
  ('news',   'タイトルB', '本文B');
```

---

## 編集・削除

まず対象を一覧して `id` を確認します。

```sql
select id, category, title, published_at
from announcements
order by published_at desc;
```

**編集**（`title` や `body` を直す）:

```sql
update announcements
set title = '新しいタイトル',
    body  = '新しい本文'
where id = 'ここに対象の id を貼る';
```

**削除**:

```sql
delete from announcements
where id = 'ここに対象の id を貼る';
```

---

## 運用のコツ

- リリースや新機能のたびに1行 `insert` する、という運用が基本です。
- 文面はユーザー目線でやさしく。専門用語（例:「本人確認」→「任意の本人確認」）は
  一言そえると親切です。
- 古いお知らせは消さずに残しておくと「継続して運営している」印象につながります。
