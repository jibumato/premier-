-- =============================================================================
-- プルミエ！ 0074 — 常設グループの掲示板（グループV2）
--   0073のサークルに「グループ内の投稿（掲示板）」を追加。メンバーだけが投稿でき、
--   荒らし対策は談話室（0050）と同じ仕組みを流用する:
--     ① そのグループのメンバー本人だけが投稿できる
--     ② 連投防止クールダウン（同一グループに15秒に1件まで）
--     ③ 24時間あたりの投稿数上限（50件／全グループ合計）
--     ④ 簡易NGワード・スパム判定（0050の lounge_is_spammy を再利用）
--     ⑤ 削除は投稿者本人 or そのグループのオーナー（モデレーション）
--   ①〜④はDBの制約・RLSで強制するため、クライアントに関わらず常に効く。
-- =============================================================================

create table group_posts (
  id         uuid primary key default gen_random_uuid(),
  group_id   uuid not null references groups (id) on delete cascade,
  author_id  uuid not null references profiles (id) on delete cascade,
  body       text not null check (char_length(body) between 1 and 500),
  created_at timestamptz not null default now()
);
create index group_posts_group_idx on group_posts (group_id, created_at desc);

-- ④ 談話室と同じスパム判定を再利用（リンク・異常な連続・暴言ワード）。
alter table group_posts
  add constraint group_posts_not_spammy check (not lounge_is_spammy(body));

alter table group_posts enable row level security;

-- 閲覧は誰でも可（サークル自体が公開。ブロック相手はクライアント側で除外）。
create policy group_posts_select on group_posts for select using (true);

-- ①②③ 投稿はそのグループのメンバー本人のみ・連投クールダウン・日次上限。
create policy group_posts_insert on group_posts
  for insert to authenticated
  with check (
    author_id = auth.uid()
    and exists (
      select 1 from group_members m
      where m.group_id = group_posts.group_id and m.user_id = auth.uid()
    )
    and not exists (
      select 1 from group_posts p
      where p.author_id = auth.uid()
        and p.group_id = group_posts.group_id
        and p.created_at > now() - interval '15 seconds'
    )
    and (
      select count(*) from group_posts p
      where p.author_id = auth.uid() and p.created_at > now() - interval '24 hours'
    ) < 50
  );

-- ⑤ 削除は投稿者本人 or そのグループのオーナー。
create policy group_posts_delete on group_posts
  for delete using (
    author_id = auth.uid()
    or exists (select 1 from groups g where g.id = group_posts.group_id and g.owner_id = auth.uid())
  );
