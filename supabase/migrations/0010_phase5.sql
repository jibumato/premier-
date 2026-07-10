-- =============================================================================
-- プルミエ！ Phase 5 (P4) — 通報自動処理・自動バッジ・法人掲載
--   運営はワンオペ前提のため「人手の審査キュー」を作らない。通報は闾値到達で
--   自動的にコンテンツを非表示化し（content_flags）、バッジは実績から自動付与、
--   法人掲載は自動審査（ここではリード受付のみ）とする。
-- =============================================================================

-- ---- 通報 -------------------------------------------------------------------
create table reports (
  id           uuid primary key default gen_random_uuid(),
  reporter_id  uuid not null references profiles (id) on delete cascade,
  target_type  text not null check (target_type in ('user', 'awase', 'market', 'qa')),
  target_id    uuid not null,
  reason       text not null,
  detail       text,
  created_at   timestamptz not null default now(),
  -- 同じ人が同じ対象を二重通報しても闾値を水増ししない
  unique (reporter_id, target_type, target_id)
);
create index reports_target_idx on reports (target_type, target_id);

-- ---- ブロック ---------------------------------------------------------------
create table blocks (
  blocker_id  uuid not null references profiles (id) on delete cascade,
  blocked_id  uuid not null references profiles (id) on delete cascade,
  created_at  timestamptz not null default now(),
  check (blocker_id <> blocked_id),
  primary key (blocker_id, blocked_id)
);

-- ---- 自動非表示フラグ（通報闾値で自動生成）---------------------------------
create table content_flags (
  target_type  text not null check (target_type in ('user', 'awase', 'market', 'qa')),
  target_id    uuid not null,
  auto_hidden  boolean not null default true,
  report_count integer not null default 0,
  flagged_at   timestamptz not null default now(),
  primary key (target_type, target_id)
);

-- 通報が入るたびに distinct な通報者数を数え、闾値(3)到達で content_flags を
-- 立てる。人手の承認は挟まない（Constraints: 自動処理）。
create function process_report_threshold()
returns trigger
language plpgsql
security definer set search_path = public
as $$
declare
  v_count integer;
begin
  select count(distinct reporter_id) into v_count
  from reports
  where target_type = new.target_type and target_id = new.target_id;

  if v_count >= 3 then
    insert into content_flags (target_type, target_id, auto_hidden, report_count)
    values (new.target_type, new.target_id, true, v_count)
    on conflict (target_type, target_id)
    do update set auto_hidden = true, report_count = excluded.report_count, flagged_at = now();
  end if;
  return new;
end;
$$;

create trigger reports_threshold_trg
  after insert on reports
  for each row execute function process_report_threshold();

-- ---- 自動バッジ（併せマイスター）------------------------------------------
-- 実績 = 主催した awase 数 ＋ accepted/done で参加した応募数。闾値(5)到達で
-- profiles.meister_title を自動付与する。
create function refresh_meister_badge(p_user uuid)
returns void
language plpgsql
security definer set search_path = public
as $$
declare
  v_total integer;
begin
  select
    (select count(*) from awase where host_id = p_user)
    + (select count(*) from awase_applications where applicant_id = p_user and status in ('accepted', 'done'))
  into v_total;

  if v_total >= 5 then
    update profiles set meister_title = '併せマイスター'
    where id = p_user and (meister_title is null or meister_title = '');
  end if;
end;
$$;

create function trg_meister_on_awase()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  perform refresh_meister_badge(new.host_id);
  return new;
end;
$$;

create function trg_meister_on_application()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  if new.status in ('accepted', 'done') then
    perform refresh_meister_badge(new.applicant_id);
  end if;
  return new;
end;
$$;

create trigger meister_on_awase_trg
  after insert on awase
  for each row execute function trg_meister_on_awase();

create trigger meister_on_application_trg
  after insert or update of status on awase_applications
  for each row execute function trg_meister_on_application();

-- ---- 法人掲載リード ---------------------------------------------------------
create table corporate_leads (
  id         uuid primary key default gen_random_uuid(),
  company    text not null,
  email      text not null,
  plan       text,
  message    text,
  created_at timestamptz not null default now()
);

-- =============================================================================
-- Row Level Security
-- =============================================================================
alter table reports         enable row level security;
alter table blocks          enable row level security;
alter table content_flags   enable row level security;
alter table corporate_leads enable row level security;

-- 通報は本人が作成、閲覧は本人分のみ（運営の可視性はサービスロールで担保）
create policy reports_insert on reports for insert to authenticated with check (reporter_id = auth.uid());
create policy reports_select on reports for select using (reporter_id = auth.uid());

-- ブロックは本人が作成・閲覧・解除
create policy blocks_insert on blocks for insert to authenticated with check (blocker_id = auth.uid());
create policy blocks_select on blocks for select using (blocker_id = auth.uid());
create policy blocks_delete on blocks for delete using (blocker_id = auth.uid());

-- 自動非表示フラグは全員が読める（クライアントのフィード除外に使う）。書込は
-- トリガー(SECURITY DEFINER)のみ＝一般ポリシーは付与しない。
create policy content_flags_select on content_flags for select using (true);

-- 法人リードは誰でも送信可（未ログインの検討中企業も含む）。閲覧はサービスロールのみ。
create policy corporate_leads_insert on corporate_leads for insert with check (true);
