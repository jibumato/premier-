-- =============================================================================
-- プルミエ！ Phase 2 (P1) — メッセージ・通知
--   conversations + conversation_members + messages + notifications
-- Realtime: enable replication on messages/notifications so clients can
-- subscribe (postgres_changes) without polling.
-- =============================================================================

create type notification_type as enum ('application', 'follow', 'like', 'badge', 'message');

-- ---- conversations -----------------------------------------------------------
create table conversations (
  id         uuid primary key default gen_random_uuid(),
  awase_id   uuid references awase (id) on delete set null,
  created_at timestamptz not null default now()
);

create table conversation_members (
  conversation_id uuid not null references conversations (id) on delete cascade,
  user_id         uuid not null references profiles (id) on delete cascade,
  last_read_at    timestamptz not null default now(),
  primary key (conversation_id, user_id)
);

create table messages (
  id              uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references conversations (id) on delete cascade,
  sender_id       uuid not null references profiles (id) on delete cascade,
  body            text not null check (char_length(body) between 1 and 2000),
  created_at      timestamptz not null default now()
);
create index messages_conversation_idx on messages (conversation_id, created_at);

-- ---- notifications ------------------------------------------------------------
create table notifications (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references profiles (id) on delete cascade,
  type       notification_type not null,
  actor_id   uuid references profiles (id) on delete set null,
  entity_id  uuid, -- awase_id / conversation_id / etc., depending on `type`
  body       text not null,
  is_read    boolean not null default false,
  created_at timestamptz not null default now()
);
create index notifications_user_idx on notifications (user_id, created_at desc);

-- ---- helper: find (or signal absence of) a 1:1 conversation between two users
-- Used by the client before creating a new conversation, so applying twice or
-- messaging from multiple entry points doesn't fork into duplicate threads.
create function find_direct_conversation(user_a uuid, user_b uuid)
returns uuid
language sql
stable
security definer set search_path = public
as $$
  select cm1.conversation_id
  from conversation_members cm1
  join conversation_members cm2
    on cm2.conversation_id = cm1.conversation_id and cm2.user_id = user_b
  where cm1.user_id = user_a
  limit 1;
$$;

-- ---- auto-notify on new application (mirrors the automated-processing
-- Constraints: no manual moderation step, notifications are system-generated)
create function notify_on_application()
returns trigger
language plpgsql
security definer set search_path = public
as $$
declare
  v_host_id uuid;
  v_title   text;
begin
  select host_id, title into v_host_id, v_title from awase where id = new.awase_id;
  insert into notifications (user_id, type, actor_id, entity_id, body)
  values (v_host_id, 'application', new.applicant_id, new.awase_id, '「' || v_title || '」に応募がありました');
  return new;
end;
$$;

create trigger on_application_created
  after insert on awase_applications
  for each row execute function notify_on_application();

-- =============================================================================
-- Row Level Security
-- =============================================================================
alter table conversations         enable row level security;
alter table conversation_members  enable row level security;
alter table messages              enable row level security;
alter table notifications         enable row level security;

-- conversations/members: only visible to their members. Creation is open to
-- any authenticated user (the client enforces "just me + one other person"
-- via conversation_members inserts in the same transaction).
create policy conversations_select on conversations for select using (
  exists (select 1 from conversation_members m where m.conversation_id = id and m.user_id = auth.uid())
);
create policy conversations_insert on conversations for insert to authenticated with check (true);

create policy conversation_members_select on conversation_members for select using (
  exists (select 1 from conversation_members m2 where m2.conversation_id = conversation_id and m2.user_id = auth.uid())
);
create policy conversation_members_insert on conversation_members for insert to authenticated with check (
  user_id = auth.uid()
  or exists (select 1 from conversation_members m2 where m2.conversation_id = conversation_id and m2.user_id = auth.uid())
);
create policy conversation_members_update on conversation_members for update
  using (user_id = auth.uid()) with check (user_id = auth.uid());

-- messages: only conversation members can read; only members can send, as themselves.
create policy messages_select on messages for select using (
  exists (select 1 from conversation_members m where m.conversation_id = conversation_id and m.user_id = auth.uid())
);
create policy messages_insert on messages for insert to authenticated with check (
  sender_id = auth.uid()
  and exists (select 1 from conversation_members m where m.conversation_id = conversation_id and m.user_id = auth.uid())
);

-- notifications: strictly own-row. is_read update only.
create policy notifications_select on notifications for select using (user_id = auth.uid());
create policy notifications_update on notifications for update
  using (user_id = auth.uid()) with check (user_id = auth.uid());
-- inserts happen via SECURITY DEFINER triggers only (no direct client insert policy).

-- Realtime: broadcast row changes on these tables to subscribed clients.
alter publication supabase_realtime add table messages;
alter publication supabase_realtime add table notifications;
