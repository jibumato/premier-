-- =============================================================================
-- プルミエ！ — 運営向け「本人確認 承認」機能（アプリ内管理画面の土台）
--   これまで承認は service_role（SQL Editor）で行っていたが、運営アカウントが
--   アプリから承認/却下できるようにする。安全のため:
--     ・profiles.is_admin を追加（運営アカウントのみ手動で true にする）
--     ・一覧/承認/却下は SECURITY DEFINER 関数にして「呼び出し元が is_admin か」を
--       関数内でチェック（一般ユーザー向けの RLS は開けない＝申請の閲覧は本人のみ）
--   冪等（add column if not exists / create or replace）。
-- =============================================================================

alter table profiles add column if not exists is_admin boolean not null default false;

-- 呼び出し元が運営かどうか
create or replace function is_admin()
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (select 1 from profiles where id = auth.uid() and is_admin);
$$;

-- 保留中の申請一覧（運営のみ）。doc_url など本人以外に見せない情報を返すため関数化。
create or replace function admin_list_pending_verifications()
returns table (
  request_id   uuid,
  user_id      uuid,
  display_name text,
  handle       text,
  doc_url      text,
  created_at   timestamptz
)
language plpgsql
security definer
set search_path = public
as $$
begin
  if not is_admin() then
    raise exception 'not authorized';
  end if;
  return query
    select vr.id, vr.user_id, p.display_name, p.handle, vr.doc_url, vr.created_at
    from verification_requests vr
    join profiles p on p.id = vr.user_id
    where vr.status = 'pending'
    order by vr.created_at asc;
end;
$$;

-- 承認（運営のみ）: 申請を approved にし、本人確認バッジ（＋任意で年齢確認）を付与。
create or replace function admin_approve_verification(p_request_id uuid, p_age_verified boolean default true)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user uuid;
begin
  if not is_admin() then
    raise exception 'not authorized';
  end if;
  select user_id into v_user from verification_requests where id = p_request_id;
  if v_user is null then
    raise exception 'request not found';
  end if;
  update verification_requests
    set status = 'approved', reviewed_at = now()
    where id = p_request_id;
  update profiles
    set is_verified = true,
        is_age_verified = case when p_age_verified then true else is_age_verified end
    where id = v_user;
end;
$$;

-- 却下（運営のみ）: 理由を添えて rejected に。バッジは変更しない。
create or replace function admin_reject_verification(p_request_id uuid, p_note text default null)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not is_admin() then
    raise exception 'not authorized';
  end if;
  update verification_requests
    set status = 'rejected', note = p_note, reviewed_at = now()
    where id = p_request_id;
  if not found then
    raise exception 'request not found';
  end if;
end;
$$;

-- ▼ 運営アカウントを有効化する例（該当ユーザーの id に置き換えて手動実行）:
--   update profiles set is_admin = true where id = 'PASTE_OPERATOR_USER_ID';
