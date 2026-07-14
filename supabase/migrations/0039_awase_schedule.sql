-- =============================================================================
-- プルミエ！ 0039 — 併せの日程調整（調整さん風の○△×投票）
--   併せ詳細ページに組み込む日程調整。ホストが候補日を登録し、
--   ホスト＋承認済みメンバー（accepted/done）が ○/△/× で回答する。
--   候補・回答は併せが見える人なら誰でも閲覧できる（回答者は承認済み
--   メンバーのみなので、応募者の身元が漏れることはない）。
-- =============================================================================

create table awase_schedule_options (
  id         uuid primary key default gen_random_uuid(),
  awase_id   uuid not null references awase (id) on delete cascade,
  label      text not null check (char_length(label) between 1 and 60),  -- 例: 8/9(土) 午後
  is_decided boolean not null default false,   -- ホストが「この日に確定」を付ける
  created_at timestamptz not null default now()
);
create index awase_schedule_options_awase_idx on awase_schedule_options (awase_id, created_at);

create table awase_schedule_votes (
  option_id  uuid not null references awase_schedule_options (id) on delete cascade,
  user_id    uuid not null references profiles (id) on delete cascade,
  mark       text not null check (mark in ('yes', 'maybe', 'no')),  -- ○ / △ / ×
  updated_at timestamptz not null default now(),
  primary key (option_id, user_id)
);

-- ---- 投票資格: ホスト or 承認済み（accepted/done）の応募者 -------------------
--   ポリシー内のサブクエリは呼び出しユーザー権限で走るが、応募者は自分の
--   応募行を必ず見られる（applications の select ポリシー）ため判定できる。
create function can_vote_awase_schedule(p_awase uuid)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1 from awase a
    where a.id = p_awase
      and (a.host_id = auth.uid()
           or exists (select 1 from awase_applications ap
                      where ap.awase_id = a.id
                        and ap.applicant_id = auth.uid()
                        and ap.status in ('accepted', 'done')))
  );
$$;

-- =============================================================================
-- Row Level Security
-- =============================================================================
alter table awase_schedule_options enable row level security;
alter table awase_schedule_votes   enable row level security;

-- 候補・回答の閲覧は誰でも（併せ自体が公開のため。回答者は承認済みのみ）
create policy schedule_options_select on awase_schedule_options for select using (true);
create policy schedule_votes_select   on awase_schedule_votes   for select using (true);

-- 候補日の管理はホストのみ
create policy schedule_options_insert on awase_schedule_options for insert to authenticated
  with check (exists (select 1 from awase a where a.id = awase_id and a.host_id = auth.uid()));
create policy schedule_options_update on awase_schedule_options for update to authenticated
  using (exists (select 1 from awase a where a.id = awase_id and a.host_id = auth.uid()));
create policy schedule_options_delete on awase_schedule_options for delete to authenticated
  using (exists (select 1 from awase a where a.id = awase_id and a.host_id = auth.uid()));

-- 回答は本人のみ・資格はホスト or 承認済みメンバー
create policy schedule_votes_insert on awase_schedule_votes for insert to authenticated
  with check (
    user_id = auth.uid()
    and exists (select 1 from awase_schedule_options o
                where o.id = option_id and can_vote_awase_schedule(o.awase_id))
  );
create policy schedule_votes_update on awase_schedule_votes for update to authenticated
  using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy schedule_votes_delete on awase_schedule_votes for delete to authenticated
  using (user_id = auth.uid());

-- ---- 新しい回答をホストへ通知（初回回答時のみ。変更では通知しない） ---------
create function notify_on_schedule_vote()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_awase uuid;
  v_host uuid;
  v_title text;
begin
  select o.awase_id into v_awase from awase_schedule_options o where o.id = new.option_id;
  select a.host_id, a.title into v_host, v_title from awase a where a.id = v_awase;
  -- 自分の併せへの自分の回答（ホスト本人）には通知しない
  if v_host is not null and v_host <> new.user_id then
    insert into notifications (user_id, type, actor_id, entity_id, body)
    values (v_host, 'application', new.user_id, v_awase,
            '「' || coalesce(v_title, '併せ') || '」の日程調整に回答がありました');
  end if;
  return new;
end;
$$;

create trigger on_schedule_vote_created
  after insert on awase_schedule_votes
  for each row execute function notify_on_schedule_vote();

-- ---- リアルタイム反映（他メンバーの回答が即時に画面へ） ----------------------
alter table awase_schedule_options replica identity full;
alter table awase_schedule_votes   replica identity full;
do $$
begin
  alter publication supabase_realtime add table awase_schedule_options;
exception when duplicate_object then null;
end $$;
do $$
begin
  alter publication supabase_realtime add table awase_schedule_votes;
exception when duplicate_object then null;
end $$;
