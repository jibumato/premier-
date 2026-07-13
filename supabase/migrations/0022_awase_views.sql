-- =============================================================================
-- プルミエ！ — 併せの閲覧数（主催にだけ見せる手応え指標）
--   いいね等の「ゼロが目立つ」公開カウンターは置かず、閲覧数を主催者だけに表示
--   して「見られている」手応えを返す。閲覧者側には一切表示しない。
--   加算は SECURITY DEFINER の RPC 経由（RLS で awase の update は主催限定のため）。
--   冪等（add column if not exists / create or replace）。
-- =============================================================================

alter table awase add column if not exists view_count int not null default 0;

create or replace function increment_awase_view(target uuid)
returns void
language sql
security definer
set search_path = public
as $$
  update awase set view_count = view_count + 1 where id = target;
$$;

-- ログインユーザーの閲覧のみカウント（匿名閲覧は現状ログインゲートで到達しない）
revoke all on function increment_awase_view(uuid) from public;
grant execute on function increment_awase_view(uuid) to authenticated;
