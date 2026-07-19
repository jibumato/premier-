-- =============================================================================
-- プルミエ！ 0067 — イベントの「行ってみたい」（興味表明）
--   「参加表明」（event_rsvps）よりも軽い「気になる・行ってみたいかも」の
--   意思表示を追加する。event_rsvps と同じ設計方針: イベント自体はキュレー
--   ション前提のコンテンツで書き込みUIは無いが、この意思表示だけは本人の
--   行動なので専用テーブルを分離して自由に書ける。
-- =============================================================================

create table event_interests (
  event_id   uuid not null references events (id) on delete cascade,
  user_id    uuid not null references profiles (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (event_id, user_id)
);

alter table event_interests enable row level security;

create policy event_interests_select on event_interests for select using (true);
create policy event_interests_insert on event_interests for insert to authenticated with check (user_id = auth.uid());
create policy event_interests_delete on event_interests for delete using (user_id = auth.uid());
