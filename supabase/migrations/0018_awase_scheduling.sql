-- =============================================================================
-- プルミエ！ — 主催者向け「手間削減」第2弾:
--   ① 公開予約   awase.publish_at            … 未来日時なら、その時刻まで一般には非表示
--   ② 応募締切   awase.application_deadline  … 過ぎたら応募を受け付けない
--   ③ 募集テンプレ awase_templates            … 主催が定型の募集内容を保存して使い回す
--   すべて任意項目。NULL は従来どおり（即時公開／締切なし）。
--   冪等（add column if not exists / drop policy if exists / create table if not exists）。
-- =============================================================================

-- ① / ② 併せに予約公開・応募締切の列を追加 ---------------------------------
alter table awase add column if not exists publish_at           timestamptz;
alter table awase add column if not exists application_deadline  timestamptz;

-- 一覧の絞り込みを速くするための部分インデックス（公開予約ありのみ）
create index if not exists awase_publish_at_idx on awase (publish_at) where publish_at is not null;

-- 閲覧ポリシー: 公開予約の時刻前は主催以外に見せない ------------------------
drop policy if exists awase_select on awase;
create policy awase_select on awase for select using (
  (status = 'open' and (publish_at is null or publish_at <= now()))
  or host_id = auth.uid()
);

-- 応募ポリシー: 公開前・締切後は応募不可（女性限定は本人確認済のみ） ---------
drop policy if exists applications_insert on awase_applications;
create policy applications_insert on awase_applications for insert to authenticated with check (
  applicant_id = auth.uid()
  and exists (
    select 1 from awase a where a.id = awase_id and a.status = 'open'
      and (a.publish_at is null or a.publish_at <= now())
      and (a.application_deadline is null or a.application_deadline >= now())
      and (
        not a.women_only
        or exists (select 1 from profiles p where p.id = auth.uid() and p.is_verified)
      )
  )
);

-- ③ 募集テンプレート ---------------------------------------------------------
create table if not exists awase_templates (
  id           uuid primary key default gen_random_uuid(),
  host_id      uuid not null references profiles (id) on delete cascade,
  name         text not null,                       -- テンプレ名（主催が識別用に付ける）
  title        text not null default '',
  work_id      uuid references works (id) on delete set null,
  region       text not null default '',
  place        text,
  fee_text     text,
  body         text,
  capacity     int,
  women_only   boolean not null default false,
  beginner_ok  boolean not null default false,
  world_tags   text[]  not null default '{}',
  created_at   timestamptz not null default now()
);

create index if not exists awase_templates_host_idx on awase_templates (host_id, created_at desc);

alter table awase_templates enable row level security;

drop policy if exists awase_templates_all on awase_templates;
create policy awase_templates_all on awase_templates for all
  using (host_id = auth.uid()) with check (host_id = auth.uid());
