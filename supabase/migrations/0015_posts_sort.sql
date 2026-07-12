-- =============================================================================
-- プルミエ！ — 投稿ギャラリーの並び替え対応
--   posts に手動並び順の列 sort を追加し、本人が並び替え（UPDATE）できるように
--   する。既存行は created_at をもとに初期値を振る（新しいものほど大きい）。
--   表示は sort 降順（＝先頭が並びの先頭）。冪等（再実行可）。
-- =============================================================================

alter table posts add column if not exists sort bigint not null default 0;

-- 既存行の初期並び順を created_at から採番（まだ 0 のものだけ）。
update posts
set sort = (extract(epoch from created_at) * 1000)::bigint
where sort = 0;

create index if not exists posts_author_sort_idx on posts (author_id, sort desc);

-- 本人だけが自分の投稿を更新（並び替え）できるポリシー（無ければ作成）。
do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'posts' and policyname = 'posts_update'
  ) then
    create policy posts_update on posts
      for update to authenticated
      using (author_id = auth.uid())
      with check (author_id = auth.uid());
  end if;
end $$;
