-- =============================================================================
-- プルミエ！ 0048 — お知らせを運営画面から管理できるようにする
--   announcements（0012）は select(true) のみで書き込みポリシーが無く、
--   投稿・編集・削除は SQL Editor（service_role）からしか行えなかった。
--   運営（is_admin）がアプリの「お知らせ管理」画面から投稿・編集・削除できるよう、
--   is_admin() に限定した insert/update/delete ポリシーを追加する。
--   閲覧は従来どおり全員可（announcements_select）。
-- =============================================================================

-- is_admin() は 0023 で定義済み（SECURITY DEFINER）。
create policy announcements_admin_insert on announcements
  for insert to authenticated
  with check (is_admin());

create policy announcements_admin_update on announcements
  for update to authenticated
  using (is_admin())
  with check (is_admin());

create policy announcements_admin_delete on announcements
  for delete to authenticated
  using (is_admin());
