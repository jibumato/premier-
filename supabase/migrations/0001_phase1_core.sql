-- =============================================================================
-- プルミエ！ Phase 1 (P0) — コア基盤スキーマ
--   Auth + profiles + works + follows + awase + applications
-- Target: Supabase (Postgres 15) / RLS-first authorization
-- ADR: 認可はアプリではなく DB(RLS) に寄せる。全クライアント(Web/将来のRN)に
--      自動で効き、ワンオペ運営の目視確認を減らす。
-- =============================================================================

-- ---- enums ------------------------------------------------------------------
create type user_role        as enum ('layer', 'photographer', 'both');
create type awase_status      as enum ('open', 'closed');
create type awase_role_status as enum ('confirmed', 'open');
create type application_status as enum ('applied', 'accepted', 'rejected', 'done');

-- ---- profiles (extends auth.users) -----------------------------------------
create table profiles (
  id             uuid primary key references auth.users (id) on delete cascade,
  handle         text unique not null check (handle ~ '^[a-z0-9_]{3,20}$'),
  display_name   text not null,
  role           user_role not null default 'layer',
  bio            text default '',
  avatar_url     text,
  cover_url      text,
  meister_title  text,                       -- 自動付与の称号（Phase 5で集計）
  is_verified    boolean not null default false,  -- 本人確認済 (eKYC / Phase 3)
  is_age_verified boolean not null default false, -- 年齢確認済 (応援リンクのゾーニング)
  is_private     boolean not null default false,  -- 設定「非公開アカウント」
  created_at     timestamptz not null default now()
);

-- ---- works & follows --------------------------------------------------------
create table works (
  id         uuid primary key default gen_random_uuid(),
  name       text unique not null,
  created_at timestamptz not null default now()
);

create table work_follows (            -- 好きな作品フォロー (オンボ 8b)
  user_id uuid not null references profiles (id) on delete cascade,
  work_id uuid not null references works (id) on delete cascade,
  primary key (user_id, work_id)
);

create table follows (                 -- ユーザーフォロー
  follower_id uuid not null references profiles (id) on delete cascade,
  followee_id uuid not null references profiles (id) on delete cascade,
  created_at  timestamptz not null default now(),
  primary key (follower_id, followee_id),
  check (follower_id <> followee_id)
);

-- ---- awase (併せ募集) -------------------------------------------------------
create table awase (
  id          uuid primary key default gen_random_uuid(),
  host_id     uuid not null references profiles (id) on delete cascade,
  title       text not null check (char_length(title) between 1 and 60),
  work_id     uuid references works (id) on delete set null,
  world_tags  text[] not null default '{}',
  event_date  text not null,          -- 表示優先(「8月上旬」等の曖昧表現も許容)
  place       text,
  region      text not null,          -- 検索の地域フィルタキー
  fee_text    text,
  body        text default '',
  women_only  boolean not null default false,
  beginner_ok boolean not null default false,
  capacity    int check (capacity is null or capacity > 0),
  status      awase_status not null default 'open',
  created_at  timestamptz not null default now()
);
create index awase_region_idx  on awase (region) where status = 'open';
create index awase_work_idx    on awase (work_id);
create index awase_created_idx on awase (created_at desc);

create table awase_images (
  id         uuid primary key default gen_random_uuid(),
  awase_id   uuid not null references awase (id) on delete cascade,
  storage_path text not null,          -- Storage キー (Phase 2 で本格運用)
  sort       int not null default 0
);

create table awase_roles (             -- 募集キャラ (detail の一覧)
  id          uuid primary key default gen_random_uuid(),
  awase_id    uuid not null references awase (id) on delete cascade,
  char_name   text not null,
  assignee_id uuid references profiles (id) on delete set null,
  status      awase_role_status not null default 'open',
  sort        int not null default 0
);

create table awase_applications (      -- 応募 (applied 画面)
  id           uuid primary key default gen_random_uuid(),
  awase_id     uuid not null references awase (id) on delete cascade,
  applicant_id uuid not null references profiles (id) on delete cascade,
  role_id      uuid references awase_roles (id) on delete set null,
  message      text default '',
  status       application_status not null default 'applied',
  created_at   timestamptz not null default now(),
  unique (awase_id, applicant_id)      -- 二重応募を防止
);
create index applications_awase_idx     on awase_applications (awase_id);
create index applications_applicant_idx on awase_applications (applicant_id);

-- ---- auth bootstrap: サインアップ時に profiles を自動作成 -------------------
create function handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, handle, display_name, role)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'handle', 'user_' || substr(new.id::text, 1, 8)),
    coalesce(new.raw_user_meta_data->>'display_name', 'ゲスト'),
    coalesce((new.raw_user_meta_data->>'role')::user_role, 'layer')
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function handle_new_user();

-- =============================================================================
-- Row Level Security
-- =============================================================================
alter table profiles           enable row level security;
alter table works              enable row level security;
alter table work_follows       enable row level security;
alter table follows            enable row level security;
alter table awase              enable row level security;
alter table awase_images       enable row level security;
alter table awase_roles        enable row level security;
alter table awase_applications enable row level security;

-- profiles: 公開。非公開アカウントは本人＋フォロワーのみ閲覧。更新は本人のみ。
create policy profiles_select on profiles for select using (
  not is_private
  or id = auth.uid()
  or exists (select 1 from follows f where f.followee_id = profiles.id and f.follower_id = auth.uid())
);
create policy profiles_update on profiles for update using (id = auth.uid()) with check (id = auth.uid());

-- works: 全員読める。作成は認証ユーザー（自動収集/自己申告、審査なし）。
create policy works_select on works for select using (true);
create policy works_insert on works for insert to authenticated with check (true);

-- work_follows / follows: 本人の行のみ操作。閲覧は公開。
create policy work_follows_select on work_follows for select using (true);
create policy work_follows_write  on work_follows for all
  using (user_id = auth.uid()) with check (user_id = auth.uid());

create policy follows_select on follows for select using (true);
create policy follows_write  on follows for all
  using (follower_id = auth.uid()) with check (follower_id = auth.uid());

-- awase: open は公開閲覧。作成/更新/削除は主催のみ。
create policy awase_select on awase for select using (status = 'open' or host_id = auth.uid());
create policy awase_insert on awase for insert to authenticated with check (host_id = auth.uid());
create policy awase_update on awase for update using (host_id = auth.uid()) with check (host_id = auth.uid());
create policy awase_delete on awase for delete using (host_id = auth.uid());

-- awase 従属テーブル: 親の閲覧可否に追従。書込みは主催のみ。
create policy awase_images_select on awase_images for select
  using (exists (select 1 from awase a where a.id = awase_id and (a.status = 'open' or a.host_id = auth.uid())));
create policy awase_images_write on awase_images for all
  using (exists (select 1 from awase a where a.id = awase_id and a.host_id = auth.uid()))
  with check (exists (select 1 from awase a where a.id = awase_id and a.host_id = auth.uid()));

create policy awase_roles_select on awase_roles for select
  using (exists (select 1 from awase a where a.id = awase_id and (a.status = 'open' or a.host_id = auth.uid())));
create policy awase_roles_write on awase_roles for all
  using (exists (select 1 from awase a where a.id = awase_id and a.host_id = auth.uid()))
  with check (exists (select 1 from awase a where a.id = awase_id and a.host_id = auth.uid()));

-- 応募: 本人 or 主催が閲覧。応募作成は本人。女性限定は本人確認済のみ許可
--       （※ 性別属性は Phase 3 で eKYC 連携時に確定。当面は is_verified で代替）。
create policy applications_select on awase_applications for select using (
  applicant_id = auth.uid()
  or exists (select 1 from awase a where a.id = awase_id and a.host_id = auth.uid())
);
create policy applications_insert on awase_applications for insert to authenticated with check (
  applicant_id = auth.uid()
  and exists (
    select 1 from awase a where a.id = awase_id and a.status = 'open'
      and (
        not a.women_only
        or exists (select 1 from profiles p where p.id = auth.uid() and p.is_verified)
      )
  )
);
-- ステータス更新（accept/reject）は主催、done は当事者いずれか。
create policy applications_update on awase_applications for update using (
  applicant_id = auth.uid()
  or exists (select 1 from awase a where a.id = awase_id and a.host_id = auth.uid())
);
