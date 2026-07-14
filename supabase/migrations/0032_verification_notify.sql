-- 0032_verification_notify.sql
-- 本人確認の承認/却下を「おしらせ」に通知する
--
-- これまで admin_approve_verification / admin_reject_verification は
-- profiles.is_verified 等を更新するだけで、申請者への通知が無かった。
-- 承認/却下いずれの場合も notifications に1件挿入し、「おしらせ」から
-- 結果が分かるようにする。

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
  insert into notifications (user_id, type, actor_id, entity_id, body)
    values (v_user, 'badge', null, p_request_id, '本人確認が承認されました。プロフィールに確認済みバッジが表示されます🎉');
end;
$$;

-- 却下（運営のみ）: 理由を添えて rejected に。バッジは変更しない。申請者へ通知。
create or replace function admin_reject_verification(p_request_id uuid, p_note text default null)
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
  update verification_requests
    set status = 'rejected', note = p_note, reviewed_at = now()
    where id = p_request_id
    returning user_id into v_user;
  if v_user is null then
    raise exception 'request not found';
  end if;
  insert into notifications (user_id, type, actor_id, entity_id, body)
    values (
      v_user,
      'badge',
      null,
      p_request_id,
      case when p_note is not null and length(trim(p_note)) > 0
        then '本人確認の申請は承認されませんでした（' || p_note || '）。再度ご申請いただけます。'
        else '本人確認の申請は承認されませんでした。再度ご申請いただけます。'
      end
    );
end;
$$;
