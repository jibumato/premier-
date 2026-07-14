-- 0033_awase_group_chat.sql
-- 併せの承認メンバー全員で相談できるグループチャット
--
-- 既存のDM基盤（conversations / conversation_members / messages）は複数人でも
-- 動く構造なので、①グループ識別用の列、②「主催＋承認済み応募者」を集めて
-- 会話を作る RPC、③承認/取り消しに追従してメンバーを自動同期するトリガー、
-- の3点を足すだけで実現する。メッセージの閲覧/送信 RLS は既存の
-- is_conversation_member() がそのまま効く。

-- ① グループ識別・表示名
alter table conversations add column if not exists is_group boolean not null default false;
alter table conversations add column if not exists title    text;

-- ② グループチャットの取得/作成（主催者 or 承認済み応募者のみ呼べる）
create or replace function get_or_create_awase_group_chat(p_awase uuid)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  me      uuid := auth.uid();
  v_host  uuid;
  v_title text;
  conv    uuid;
begin
  if me is null then
    raise exception 'not authenticated';
  end if;
  select host_id, title into v_host, v_title from awase where id = p_awase;
  if v_host is null then
    raise exception 'awase not found';
  end if;
  -- 主催者か、承認済み(accepted/done)の応募者だけがグループを開ける
  if me <> v_host and not exists (
    select 1 from awase_applications
    where awase_id = p_awase and applicant_id = me and status in ('accepted', 'done')
  ) then
    raise exception 'not authorized';
  end if;

  select id into conv from conversations where awase_id = p_awase and is_group limit 1;
  if conv is null then
    insert into conversations (awase_id, is_group, title)
      values (p_awase, true, coalesce(v_title, '併せグループ'))
      returning id into conv;
  end if;

  -- 主催＋承認済みメンバーを追加（既にいる人はそのまま）
  insert into conversation_members (conversation_id, user_id)
    select conv, v_host
    on conflict do nothing;
  insert into conversation_members (conversation_id, user_id)
    select conv, applicant_id from awase_applications
    where awase_id = p_awase and status in ('accepted', 'done')
    on conflict do nothing;

  return conv;
end;
$$;

revoke all on function get_or_create_awase_group_chat(uuid) from public;
grant execute on function get_or_create_awase_group_chat(uuid) to authenticated;

-- ③ 承認/取り消しに追従してグループメンバーを自動同期
--    （グループが未作成の併せでは何もしない）
create or replace function sync_awase_group_membership()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  conv   uuid;
  v_host uuid;
begin
  select id into conv from conversations
    where awase_id = coalesce(new.awase_id, old.awase_id) and is_group limit 1;
  if conv is null then
    return coalesce(new, old);
  end if;

  if tg_op = 'DELETE' then
    -- 応募自体が消えたら（退会など）メンバーからも外す（主催者は残す）
    select host_id into v_host from awase where id = old.awase_id;
    if old.applicant_id <> v_host then
      delete from conversation_members
        where conversation_id = conv and user_id = old.applicant_id;
    end if;
    return old;
  end if;

  if new.status in ('accepted', 'done') then
    insert into conversation_members (conversation_id, user_id)
      values (conv, new.applicant_id)
      on conflict do nothing;
  elsif old.status in ('accepted', 'done') and new.status not in ('accepted', 'done') then
    -- 承認取り消し/見送りに変わったらグループから外す
    delete from conversation_members
      where conversation_id = conv and user_id = new.applicant_id;
  end if;
  return new;
end;
$$;

drop trigger if exists on_application_group_sync on awase_applications;
create trigger on_application_group_sync
  after update or delete on awase_applications
  for each row execute function sync_awase_group_membership();
