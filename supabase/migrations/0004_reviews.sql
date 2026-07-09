-- =============================================================================
-- プルミエ！ Phase 3 (P2) — レビュー
--   Gated on a confirmed participation relationship (an accepted/done
--   application to a shared awase) so reviews can't be left for strangers.
--   No manual moderation step for posting itself — abusive content goes
--   through the existing report/block flow (Constraints: automate, don't gate).
-- =============================================================================

create table reviews (
  id          uuid primary key default gen_random_uuid(),
  author_id   uuid not null references profiles (id) on delete cascade,
  target_id   uuid not null references profiles (id) on delete cascade,
  awase_id    uuid references awase (id) on delete set null,
  rating      smallint not null check (rating between 1 and 5),
  good_points text[] not null default '{}',
  comment     text default '',
  created_at  timestamptz not null default now(),
  check (author_id <> target_id),
  -- one review per (author, target, awase) — re-submitting just edits, it
  -- doesn't pad the count.
  unique (author_id, target_id, awase_id)
);
create index reviews_target_idx on reviews (target_id, created_at desc);

-- ---- helper: is there a confirmed participation link between the two users
-- on this awase (either direction: reviewing the host, or the host reviewing
-- a confirmed participant)? Used by the insert policy below.
create function has_confirmed_participation(p_author uuid, p_target uuid, p_awase uuid)
returns boolean
language sql
stable
security definer set search_path = public
as $$
  select
    p_awase is not null
    and (
      -- author participated (accepted/done) in target's awase
      exists (
        select 1 from awase a
        join awase_applications ap on ap.awase_id = a.id
        where a.id = p_awase and a.host_id = p_target
          and ap.applicant_id = p_author and ap.status in ('accepted', 'done')
      )
      -- or target participated (accepted/done) in author's awase
      or exists (
        select 1 from awase a
        join awase_applications ap on ap.awase_id = a.id
        where a.id = p_awase and a.host_id = p_author
          and ap.applicant_id = p_target and ap.status in ('accepted', 'done')
      )
    );
$$;

-- =============================================================================
-- Row Level Security
-- =============================================================================
alter table reviews enable row level security;

-- Reviews are public (shown on profiles), like the design's photographer
-- profile review list.
create policy reviews_select on reviews for select using (true);

create policy reviews_insert on reviews for insert to authenticated with check (
  author_id = auth.uid()
  and has_confirmed_participation(author_id, target_id, awase_id)
);

create policy reviews_update on reviews for update
  using (author_id = auth.uid())
  with check (author_id = auth.uid() and has_confirmed_participation(author_id, target_id, awase_id));

create policy reviews_delete on reviews for delete using (author_id = auth.uid());
