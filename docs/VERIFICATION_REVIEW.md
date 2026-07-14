# 本人確認の承認手順（運営向け）

> **アプリ内の承認画面を使う場合（推奨・マイグレーション 0023 適用後）**
> 運営アカウントを有効化すると、設定 →「運営」→「本人確認の承認」から、
> 保留申請の一覧・身分証プレビュー・承認/却下がアプリ上で行えます。
> 有効化は一度だけ、SQL Editor で次を実行:
> ```sql
> update profiles set is_admin = true where id = 'PASTE_OPERATOR_USER_ID';
> ```
> 承認後は下記「4. 画像削除」に従い R2 の身分証画像を削除してください
> （画像削除はアプリからは行いません）。以下は SQL で直接行う従来手順です。

---


本人確認は「任意」です。ユーザーがアプリの本人確認画面から身分証画像を
アップロードすると `verification_requests` に申請（`status = 'pending'`）が
作られます。運営が画像を目視で確認し、問題なければ承認して
`profiles.is_verified` を `true` にすると、プロフィールのお名前の横に
**確認済みバッジ**が表示されます。

- 申請テーブル: `verification_requests`（`user_id` / `doc_url` / `status` / `note`）
- 承認結果: `profiles.is_verified`（本人確認バッジ） / `profiles.is_age_verified`（18歳以上ゾーニング）
- 権限: 申請の作成・自分の申請の閲覧は本人のみ。**承認・却下は運営が
  Supabase の service_role（SQL Editor）で行います**（一般ユーザー向けの
  update ポリシーはあえて付与していません）。

> eKYC ベンダー導入前の暫定運用です。手動で捌けなくなったら eKYC へ移行します。

---

## 0. 受付可能な書類

- **単体でOK**（顔写真＋生年月日つき）: 運転免許証・パスポート・マイナンバーカード（表面のみ、マイナンバーの番号部分は隠してもらう）
- **組み合わせでOK**: **学生証＋健康保険証を並べて1枚の写真**に収めたもの
  - 学生証だけでは生年月日が確認できないため、健康保険証（被保険者の生年月日が入っている）を並べて撮影してもらい、**同一人物・同一生年月日**であることを確認する。
  - 審査時は、学生証の氏名・顔写真と健康保険証の氏名・生年月日が一致しているかを見る。一致しない、どちらか一方しか写っていない、生年月日が読み取れない場合は却下（理由をnoteに記載）。
  - 健康保険証は**保険者番号・記号番号を隠して**もらうよう案内済み（アプリの案内文言に明記）。万一番号が写り込んでいる画像を確認した場合も、承認/却下いずれの場合も**確認後すみやかに削除**する（下記「4. 画像削除」を参照）。
- 上記のいずれも用意できない場合は却下し、理由をnoteに記載して再申請を案内する。

---

## 1. 保留中の申請を一覧する

Supabase → **SQL Editor** で実行します。`doc_url`（身分証画像のURL）と
申請者の表示名・ハンドルが出ます。

```sql
select
  vr.id            as request_id,
  vr.user_id,
  p.display_name,
  p.handle,
  vr.doc_url,
  vr.created_at
from verification_requests vr
join profiles p on p.id = vr.user_id
where vr.status = 'pending'
order by vr.created_at;
```

`doc_url` をブラウザで開き、身分証画像を確認します（氏名・生年月日・
本人性など）。

---

## 2. 承認する

問題なければ、申請を `approved` にし、プロフィールのバッジを立てます。
**`request_id` を控えてから**以下を実行してください。

```sql
-- ① 申請を承認済みに
update verification_requests
set status = 'approved',
    reviewed_at = now()
where id = 'ここに request_id';

-- ② 本人確認バッジを付与（＋18歳以上を確認できたら年齢確認もtrueに）
update profiles
set is_verified = true,
    is_age_verified = true       -- 18歳以上が確認できない場合はこの行を削除
where id = 'ここに user_id';
```

- `is_verified` … お名前の横の**確認済みバッジ**が表示されます。
- `is_age_verified` … 18歳以上のゾーニング（応援・支援リンクの表示可否）に
  使います。身分証で18歳以上が確認できた場合のみ `true` にしてください。

### user_id を控え忘れた場合

`request_id` から辿れます。

```sql
update profiles
set is_verified = true, is_age_verified = true
where id = (select user_id from verification_requests where id = 'ここに request_id');
```

---

## 3. 却下する

不備がある場合は理由を添えて却下します。プロフィールのバッジは変更しません。

```sql
update verification_requests
set status = 'rejected',
    note = '却下理由（例: 画像が不鮮明。氏名が確認できません）',
    reviewed_at = now()
where id = 'ここに request_id';
```

同じユーザーは却下後に再申請できます（保留中は1件までの制約があるため、
`pending` が残っていると再申請できません。却下＝`rejected` にすれば再申請可）。

---

## 4. 【重要】確認後は身分証画像を削除する（データ最小化）

身分証画像は確認のためだけに一時保管します。**承認・却下の判断が終わったら、
速やかに R2 バケットから画像を削除してください。**

1. `doc_url` の末尾がオブジェクトキーです（例: `…/kyc/<uu>/<file>` の
   `kyc/…` 部分）。
2. Cloudflare ダッシュボード → R2 → バケット `premier-images` →
   該当オブジェクトを検索して削除。
3. 台帳としては `verification_requests` の行（status / reviewed_at / note）が
   残るので、画像本体が無くても承認履歴は追えます。

> 画像を残し続けると個人情報の保有リスクが増えます。判断後は必ず削除を。

---

## 5. バッジを取り消したい場合（誤承認・失効など）

```sql
update profiles
set is_verified = false, is_age_verified = false
where id = 'ここに user_id';
```

---

## 状態の確認クエリ（任意）

```sql
-- 直近の申請と結果をまとめて見る
select vr.status, vr.created_at, vr.reviewed_at, p.display_name, p.is_verified, p.is_age_verified
from verification_requests vr
join profiles p on p.id = vr.user_id
order by vr.created_at desc
limit 50;
```
