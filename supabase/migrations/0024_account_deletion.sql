-- 0024_account_deletion.sql
-- 退会（アカウント削除）
--
-- 本人が自分のアカウントを完全に削除できるようにする RPC。
-- profiles.id は auth.users(id) を `on delete cascade` で参照し、他テーブルも
-- profiles(id) を cascade / set null で参照しているため、auth.users を 1 件
-- 削除すれば当該ユーザーの全データ（併せ・応募・投稿・メッセージ・レビュー・
-- 本人確認申請など）がカスケードで削除される。
--
-- auth.users への delete は通常の RLS 権限では行えないため、SECURITY DEFINER
-- 関数（所有者 = postgres）で auth.uid() 本人の行だけを削除する。他人の ID は
-- 引数に取らないので、常に「自分自身のみ」を消せる。

create or replace function delete_my_account()
returns void
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  uid uuid := auth.uid();
begin
  if uid is null then
    raise exception 'not authenticated';
  end if;
  -- カスケードで profiles とその配下（併せ／応募／投稿／DM／レビュー等）も削除
  delete from auth.users where id = uid;
end;
$$;

revoke all on function delete_my_account() from public;
grant execute on function delete_my_account() to authenticated;

-- 補足（運営向け・DBの範囲外）:
--   R2 に保存された画像（本人確認書類・併せカバー・投稿画像など）は DB の
--   カスケードでは削除されない。本人確認書類は従来どおり審査後に削除する運用。
--   その他の画像はストレージ側で定期的に孤児オブジェクトを掃除するのが望ましい。
