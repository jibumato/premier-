-- =============================================================================
-- プルミエ！ 0058 — 投稿写真の閲覧数（本人にだけ見せる手応え指標）
--   0022（併せの閲覧数）と同じ方針: いいね等の「ゼロが目立つ」公開カウンターは
--   置かず、閲覧数は投稿者本人にだけ表示する。閲覧者側・第三者には一切見せない。
--   加算は SECURITY DEFINER の RPC 経由（RLS で posts の update は本人限定のため）。
--   冪等（add column if not exists / create or replace）。
-- =============================================================================

alter table posts add column if not exists view_count int not null default 0;

create or replace function increment_post_view(target uuid)
returns void
language sql
security definer
set search_path = public
as $$
  update posts set view_count = view_count + 1 where id = target;
$$;

-- ログインユーザーの閲覧のみカウント（匿名閲覧は現状ログインゲートで到達しない）
revoke all on function increment_post_view(uuid) from public;
grant execute on function increment_post_view(uuid) to authenticated;
