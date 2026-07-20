-- =============================================================================
-- プルミエ！ 0073 — 常設グループ（サークル）
--   併せ（1回の集まり）と談話室（全体）の中間。作品・地域別の“常設サークル”で、
--   繰り返し一緒に活動する仲間の受け皿になる。cosp.jp の「同盟」に相当し、
--   プルミエに唯一足りていなかった機能ギャップを埋める（移住の受け皿）。
--   V1: 作成・検索・参加/退会・メンバー一覧まで。グループ内の投稿はV2で追加予定。
-- =============================================================================

create table groups (
  id          uuid primary key default gen_random_uuid(),
  owner_id    uuid not null references profiles (id) on delete cascade,
  name        text not null check (char_length(name) between 1 and 40),
  description text not null default '' check (char_length(description) <= 500),
  work_id     uuid references works (id) on delete set null,
  region      text not null default '',   -- 活動エリア（検索の地域フィルタと同じキー、任意）
  created_at  timestamptz not null default now()
);
create index groups_created_idx on groups (created_at desc);
create index groups_work_idx    on groups (work_id);

create table group_members (
  group_id  uuid not null references groups (id) on delete cascade,
  user_id   uuid not null references profiles (id) on delete cascade,
  role      text not null default 'member',   -- 'owner' | 'member'
  joined_at timestamptz not null default now(),
  primary key (group_id, user_id)
);
create index group_members_user_idx on group_members (user_id);

-- 作成者は自動的に owner として参加する（security definer で RLS を跨いで挿入）。
create function add_group_owner()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into group_members (group_id, user_id, role)
  values (new.id, new.owner_id, 'owner')
  on conflict do nothing;
  return new;
end;
$$;

create trigger on_group_created
  after insert on groups
  for each row execute function add_group_owner();

-- =============================================================================
-- Row Level Security
-- =============================================================================
alter table groups        enable row level security;
alter table group_members enable row level security;

create policy groups_select on groups for select using (true);
create policy groups_insert on groups for insert to authenticated with check (owner_id = auth.uid());
create policy groups_update on groups for update using (owner_id = auth.uid()) with check (owner_id = auth.uid());
create policy groups_delete on groups for delete using (owner_id = auth.uid());

create policy group_members_select on group_members for select using (true);
create policy group_members_insert on group_members for insert to authenticated with check (user_id = auth.uid());
create policy group_members_delete on group_members for delete using (user_id = auth.uid());
