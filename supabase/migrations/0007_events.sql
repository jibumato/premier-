-- =============================================================================
-- プルミエ！ Phase 4 (P3) — イベントカレンダー
--   大型コスプレイベントのカレンダー。イベント自体はキュレーション前提の
--   コンテンツのため、一般ユーザーからの新規作成 UI は無い（Phase 0 のデザイン
--   通り）— INSERT/UPDATE は管理者がダッシュボード/マイグレーションから直接
--   行う想定で、authenticated 向けの書き込みポリシーはあえて用意しない。
--   「参加表明」だけは本人の行動なので event_rsvps を分離して自由に書ける。
-- =============================================================================

create table events (
  id          uuid primary key default gen_random_uuid(),
  name        text not null unique,
  event_date  text not null,   -- 表示用の日程文字列（例: "8/17(日) 10:00〜16:00"）
  venue       text not null,
  region      text not null,
  tag         text not null default '',
  fee_text    text,
  body        text,
  created_at  timestamptz not null default now()
);
create index events_created_idx on events (created_at desc);

create table event_rsvps (
  event_id   uuid not null references events (id) on delete cascade,
  user_id    uuid not null references profiles (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (event_id, user_id)
);

-- =============================================================================
-- Row Level Security
-- =============================================================================
alter table events       enable row level security;
alter table event_rsvps  enable row level security;

create policy events_select on events for select using (true);

create policy event_rsvps_select on event_rsvps for select using (true);
create policy event_rsvps_insert on event_rsvps for insert to authenticated with check (user_id = auth.uid());
create policy event_rsvps_delete on event_rsvps for delete using (user_id = auth.uid());
