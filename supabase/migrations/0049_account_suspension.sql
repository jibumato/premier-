-- =============================================================================
-- プルミエ！ 0049 — 違反アカウントへの運営処罰権限（停止・解除）
--   運営（is_admin）が、規約違反などのあったアカウントを停止できるようにする。
--   停止中はログインはできるがアプリの中身には一切アクセスできず、専用の通知
--   画面のみが表示される（AuthGate 側でチェック）。
--
--   ・profiles.is_suspended / suspension_reason / suspended_at を追加。
--     一般ユーザー向けの update ポリシーは追加しない（本人が自分の停止状態を
--     書き換えられないようにするため）。停止・解除は SECURITY DEFINER 関数
--     経由でのみ行い、関数内で is_admin() を確認する（0023 と同じ方針）。
--   ・運営が対象アカウントを見つけやすいよう、検索・通報一覧の関数も用意する。
--     reports の閲覧は本人分のみ（0010）で運営には見えないため、これも
--     SECURITY DEFINER 関数で提供する。
-- =============================================================================

alter table profiles add column if not exists is_suspended boolean not null default false;
alter table profiles add column if not exists suspension_reason text;
alter table profiles add column if not exists suspended_at timestamptz;

-- ---- 検索（ハンドル/表示名の部分一致）＋ user 宛通報件数 --------------------
create or replace function admin_search_profiles(p_query text, p_limit int default 20)
returns table (
  id                uuid,
  handle            text,
  display_name      text,
  avatar_url        text,
  is_verified       boolean,
  is_admin          boolean,
  is_suspended      boolean,
  suspension_reason text,
  suspended_at      timestamptz,
  report_count      bigint
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
    select
      p.id, p.handle, p.display_name, p.avatar_url,
      p.is_verified, p.is_admin, p.is_suspended, p.suspension_reason, p.suspended_at,
      coalesce((select count(*) from reports r where r.target_type = 'user' and r.target_id = p.id), 0) as report_count
    from profiles p
    where p.handle ilike '%' || p_query || '%' or p.display_name ilike '%' || p_query || '%'
    order by report_count desc, p.created_at desc
    limit p_limit;
end;
$$;

-- ---- 指定ユーザー宛の通報一覧（通報者名つき） ------------------------------
create or replace function admin_list_user_reports(p_user_id uuid)
returns table (
  id           uuid,
  reporter_id  uuid,
  reporter_name text,
  reason       text,
  detail       text,
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
    select r.id, r.reporter_id, p.display_name, r.reason, r.detail, r.created_at
    from reports r
    join profiles p on p.id = r.reporter_id
    where r.target_type = 'user' and r.target_id = p_user_id
    order by r.created_at desc;
end;
$$;

-- ---- 停止 / 解除 ------------------------------------------------------------
create or replace function admin_suspend_user(p_user_id uuid, p_reason text)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not is_admin() then
    raise exception 'not authorized';
  end if;
  if p_user_id = auth.uid() then
    raise exception 'cannot suspend yourself';
  end if;
  update profiles
  set is_suspended = true,
      suspension_reason = p_reason,
      suspended_at = now()
  where id = p_user_id;
end;
$$;

create or replace function admin_reinstate_user(p_user_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not is_admin() then
    raise exception 'not authorized';
  end if;
  update profiles
  set is_suspended = false,
      suspension_reason = null,
      suspended_at = null
  where id = p_user_id;
end;
$$;

revoke all on function admin_search_profiles(text, int) from public;
revoke all on function admin_list_user_reports(uuid) from public;
revoke all on function admin_suspend_user(uuid, text) from public;
revoke all on function admin_reinstate_user(uuid) from public;
grant execute on function admin_search_profiles(text, int) to authenticated;
grant execute on function admin_list_user_reports(uuid) to authenticated;
grant execute on function admin_suspend_user(uuid, text) to authenticated;
grant execute on function admin_reinstate_user(uuid) to authenticated;
