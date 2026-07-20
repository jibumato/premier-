-- =============================================================================
-- プルミエ！ 0076 — 出演イベント（プロフィールに掲示する「次に会える場所」）
--   参加表明（event_rsvps）は、つきまとい対策で他人のプロフィールには出さない。
--   一方で「本人が“出演します”と自分で公開宣言する」のは宣伝行為であり、
--   ファンに「次どこで会えるか」を伝える価値がある（Fantia等が構造上持てない
--   リアル導線）。そこで RSVP とは別に、本人が明示的に opt-in する
--   event_appearances を用意し、プロフィール（本人・他人どちらでも）に掲示する。
--
--   ・掲示は本人の意思による公開宣言（select true）。
--   ・登録/編集/削除は本人のみ（RLSで auth.uid() を強制）。
--   ・追加時はフォロワーに「◯◯さんが【イベント】に出演します」を通知し、
--     ファン→リアル活動への橋渡し（送客の循環）を作る。
-- =============================================================================

-- フォロワー通知の種別（0070/0071 と同じく既存 enum に追記）。
alter type notification_type add value if not exists 'event_appearance';

create table event_appearances (
  event_id   uuid not null references events (id) on delete cascade,
  user_id    uuid not null references profiles (id) on delete cascade,
  note       text not null default '' check (char_length(note) <= 60),  -- スペース番号など任意
  created_at timestamptz not null default now(),
  primary key (event_id, user_id)
);
create index event_appearances_user_idx  on event_appearances (user_id);
create index event_appearances_event_idx on event_appearances (event_id);

alter table event_appearances enable row level security;

-- 本人が公開宣言したものなので閲覧は誰でも可。
create policy event_appearances_select on event_appearances for select using (true);
create policy event_appearances_insert on event_appearances for insert to authenticated
  with check (user_id = auth.uid());
create policy event_appearances_update on event_appearances for update
  using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy event_appearances_delete on event_appearances for delete using (user_id = auth.uid());

-- 追加時にフォロワーへ通知（宣伝＝送客の橋渡し）。security definer で RLS を跨ぐ。
-- 同じ (event_id, user_id) の重複登録は主キーで弾かれるため、再追加で通知が
-- 二重に飛ぶことはない。イベントが過去日でも「出演します」宣言は本人の任意。
create function notify_followers_on_appearance()
returns trigger
language plpgsql
security definer set search_path = public
as $$
declare
  v_name  text;
  v_event text;
begin
  select display_name into v_name  from profiles where id = new.user_id;
  select name         into v_event from events   where id = new.event_id;
  insert into notifications (user_id, type, actor_id, entity_id, body)
  select f.follower_id, 'event_appearance', new.user_id, new.event_id,
         coalesce(v_name, '誰か') || 'さんが「' || coalesce(v_event, 'イベント') || '」に出演します'
  from follows f
  where f.followee_id = new.user_id;
  return new;
end;
$$;

create trigger on_appearance_created
  after insert on event_appearances
  for each row execute function notify_followers_on_appearance();
