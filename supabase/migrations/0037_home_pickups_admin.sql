-- =============================================================================
-- プルミエ！ 0037 — ピックアップを運営画面から管理できるように
--   0036 では書き込みを SQL Editor（サービスロール）に限定していたが、運営
--   （is_admin）がアプリ内の管理画面から追加・編集・削除・公開切替できるよう、
--   is_admin() を条件にした書き込みポリシーを追加する。
--   併せて、無効(is_active=false)な行も運営には一覧で見えるよう select を拡張。
-- =============================================================================

-- 運営は非公開(is_active=false)の行も管理画面で確認できるようにする。
drop policy if exists home_pickups_select on home_pickups;
create policy home_pickups_select on home_pickups for select
  using (is_active or is_admin());

-- 追加・編集・削除は運営のみ（is_admin() は 0023 の SECURITY DEFINER 関数）。
create policy home_pickups_admin_insert on home_pickups for insert
  to authenticated with check (is_admin());
create policy home_pickups_admin_update on home_pickups for update
  to authenticated using (is_admin()) with check (is_admin());
create policy home_pickups_admin_delete on home_pickups for delete
  to authenticated using (is_admin());
