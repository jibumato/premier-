-- =============================================================================
-- プルミエ！ 0046 — ホームに「にぎわい」を出す
--   ① activity_events: 併せの新規募集・レビュー投稿・イベント参加表明を軽量な
--      一行テキストとして記録し、ホームのティッカーにリアルタイム表示する。
--      個人情報を増やさないよう、見出し文はトリガーが生成する固定文言のみ
--      （応募者名や投稿者IDは含めない）。予約公開（publish_at 未到来）の併せは
--      公開されるまで記録しない（awase_select の可視条件と揃える）。
--   ② trending_works(): 直近7日で新規募集が多い作品を集計するRPC（急上昇作品）。
--   ③④ 同時接続人数・今日の新着件数はクライアント側の Realtime Presence /
--      既存テーブルの集計クエリで賄うため、追加のスキーマ変更は不要。
-- =============================================================================

create table activity_events (
  id         uuid primary key default gen_random_uuid(),
  kind       text not null check (kind in ('awase_created', 'review_posted', 'event_rsvp')),
  headline   text not null,
  created_at timestamptz not null default now()
);
create index activity_events_created_idx on activity_events (created_at desc);

alter table activity_events enable row level security;
-- 誰でも閲覧可（見出し文にPIIを含めていないため）。書き込みは下のトリガー
-- （SECURITY DEFINER）経由のみ — authenticated 向けの insert/update/delete
-- ポリシーはあえて用意しない。
create policy activity_events_select on activity_events for select using (true);

alter table activity_events replica identity full;
do $$
begin
  alter publication supabase_realtime add table activity_events;
exception
  when duplicate_object then null;  -- 既に追加済みなら無視
end $$;

-- 併せの新規募集
create function log_activity_awase_created() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if new.status = 'open' and (new.publish_at is null or new.publish_at <= now()) then
    insert into activity_events (kind, headline)
    values ('awase_created', '「' || new.title || '」の併せ募集がはじまりました');
  end if;
  return new;
end;
$$;
create trigger trg_activity_awase_created
  after insert on awase
  for each row execute function log_activity_awase_created();

-- レビュー投稿（reviews は元々全公開のため常に記録してよい）
create function log_activity_review_posted() returns trigger
language plpgsql security definer set search_path = public as $$
declare
  target_name text;
begin
  select display_name into target_name from profiles where id = new.target_id;
  if target_name is not null then
    insert into activity_events (kind, headline)
    values ('review_posted', target_name || 'さんに新しいレビューが届きました');
  end if;
  return new;
end;
$$;
create trigger trg_activity_review_posted
  after insert on reviews
  for each row execute function log_activity_review_posted();

-- イベント参加表明（events は元々全公開のため常に記録してよい）
create function log_activity_event_rsvp() returns trigger
language plpgsql security definer set search_path = public as $$
declare
  ev_name text;
begin
  select name into ev_name from events where id = new.event_id;
  if ev_name is not null then
    insert into activity_events (kind, headline)
    values ('event_rsvp', ev_name || 'に参加希望が増えました');
  end if;
  return new;
end;
$$;
create trigger trg_activity_event_rsvp
  after insert on event_rsvps
  for each row execute function log_activity_event_rsvp();

-- 急上昇作品: 直近7日で新規募集が多い作品（オリジナル = work_id null は対象外）
create or replace function trending_works(p_days int default 7, p_limit int default 6)
returns table(work_id uuid, name text, awase_count bigint)
language sql stable security definer set search_path = public as $$
  select w.id, w.name, count(a.id) as awase_count
  from awase a
  join works w on w.id = a.work_id
  where a.created_at >= now() - (p_days || ' days')::interval
    and (a.publish_at is null or a.publish_at <= now())
  group by w.id, w.name
  order by awase_count desc, w.name
  limit p_limit;
$$;
revoke all on function trending_works(int, int) from public;
grant execute on function trending_works(int, int) to authenticated;
