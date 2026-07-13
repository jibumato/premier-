-- 0028_notifications_fixes.sql
-- 通知まわりの改善
--
-- (1) Realtime のライブ配信を確実にする
--     notifications / messages のフィルタ購読は user_id / conversation_id など
--     主キー以外の列で絞り込むため、REPLICA IDENTITY FULL でないと
--     postgres_changes のフィルタが働かず、ベルのバッジや新着メッセージが
--     リアルタイムに届かないことがある。FULL にして確実に配信する。
--
-- (2) 応募のステータス変更（承認/却下）を応募者に通知する
--     これまで通知トリガーは「応募が入った時（主催者向け）」だけで、
--     承認・却下しても応募者には通知が飛ばなかった。UPDATE 用トリガーを追加。

-- (1) Realtime を確実に届ける -------------------------------------------------
alter table notifications replica identity full;
alter table messages      replica identity full;

-- (2) 承認/却下を応募者へ通知 -------------------------------------------------
create or replace function notify_on_application_status()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_title text;
begin
  if new.status is distinct from old.status
     and new.status in ('accepted', 'rejected') then
    select title into v_title from awase where id = new.awase_id;
    insert into notifications (user_id, type, actor_id, entity_id, body)
    values (
      new.applicant_id,
      'application',
      null,
      new.awase_id,
      case new.status
        when 'accepted' then '「' || coalesce(v_title, '併せ') || '」への参加が承認されました🎉'
        else '「' || coalesce(v_title, '併せ') || '」の応募結果について主催者から連絡がありました'
      end
    );
  end if;
  return new;
end;
$$;

drop trigger if exists on_application_status_changed on awase_applications;
create trigger on_application_status_changed
  after update on awase_applications
  for each row execute function notify_on_application_status();
