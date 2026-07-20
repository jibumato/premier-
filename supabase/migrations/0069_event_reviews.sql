-- =============================================================================
-- プルミエ！ 0069 — イベント・会場の参加後レビュー
--   参加表明（event_rsvps）した本人が、開催後に会場・イベントの体験
--   （混雑・撮影環境・アクセス・更衣室など）を一言＋5段階で残せる。
--   凍結した老舗DBが持てない「今のリアルな会場情報」を自動で積み上げ、
--   初参加者が「安心して行けるか」を事前に判断できるようにする（鮮度×信頼）。
--
--   信頼担保: insert は「その本人＝auth.uid()」かつ「そのイベントに参加表明
--   している（event_rsvps に行がある）」ときだけ許可する。＝行った人しか
--   書けない。編集・削除は本人のみ。
-- =============================================================================

create table event_reviews (
  event_id   uuid not null references events (id) on delete cascade,
  user_id    uuid not null references profiles (id) on delete cascade,
  rating     smallint not null check (rating between 1 and 5),
  comment    text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (event_id, user_id)
);
create index event_reviews_event_idx on event_reviews (event_id, created_at desc);

alter table event_reviews enable row level security;

create policy event_reviews_select on event_reviews for select using (true);

-- 参加表明済みの本人だけが投稿できる（＝行った人しか書けない）。
create policy event_reviews_insert on event_reviews for insert to authenticated
  with check (
    user_id = auth.uid()
    and exists (
      select 1 from event_rsvps r
      where r.event_id = event_reviews.event_id and r.user_id = auth.uid()
    )
  );

create policy event_reviews_update on event_reviews for update
  using (user_id = auth.uid()) with check (user_id = auth.uid());

create policy event_reviews_delete on event_reviews for delete using (user_id = auth.uid());
