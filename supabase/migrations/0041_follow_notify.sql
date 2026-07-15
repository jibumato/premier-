-- =============================================================================
-- プルミエ！ 0041 — フォロー通知
--   フォロー機能のUI実装（プロフィールのフォローボタン）に合わせて、
--   フォローされたら相手におしらせ通知を入れる。follows テーブル・RLSは
--   0001 で実装済みのため、このマイグレーションはトリガーのみ。
-- =============================================================================

create function notify_on_follow()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_name text;
begin
  select display_name into v_name from profiles where id = new.follower_id;
  insert into notifications (user_id, type, actor_id, entity_id, body)
  values (new.followee_id, 'follow', new.follower_id, new.follower_id,
          coalesce(v_name, '誰か') || 'さんがあなたをフォローしました');
  return new;
end;
$$;

create trigger on_follow_created
  after insert on follows
  for each row execute function notify_on_follow();
