-- =============================================================================
-- プルミエ！ Phase 2 フォローアップ — 投稿ギャラリー
--   マイページの「投稿」統計・ギャラリーグリッド用。可視性ルールは profiles と
--   同じ（非公開アカウントは本人＋フォロワーのみ）。
-- =============================================================================

create table posts (
  id          uuid primary key default gen_random_uuid(),
  author_id   uuid not null references profiles (id) on delete cascade,
  image_url   text not null,
  caption     text,
  created_at  timestamptz not null default now()
);
create index posts_author_idx on posts (author_id, created_at desc);

alter table posts enable row level security;

create policy posts_select on posts for select using (
  exists (
    select 1 from profiles p
    where p.id = posts.author_id
      and (
        not p.is_private
        or p.id = auth.uid()
        or exists (select 1 from follows f where f.followee_id = p.id and f.follower_id = auth.uid())
      )
  )
);
create policy posts_insert on posts for insert to authenticated with check (author_id = auth.uid());
create policy posts_delete on posts for delete using (author_id = auth.uid());
