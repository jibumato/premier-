-- =============================================================================
-- プルミエ！ 0045 — 運営へ要望フォーム
--   サイドバー最下部（モバイルは設定内）から、ユーザーが運営へ要望・不具合報告を
--   送れるようにする。運営は管理画面（設定 → 運営 → 要望の管理）で一覧し、
--   ステータス（未対応 → 対応中 → 完了）で消し込む。
--   ・送信はログインユーザー本人のみ（user_id = auth.uid() を強制）
--   ・閲覧・ステータス更新は is_admin() のみ ＝ 他ユーザーには一切見えない
--   ・退会してもフィードバック自体は残す（user_id は null になる）
-- =============================================================================

create table feedback (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid references profiles (id) on delete set null,
  category   text not null check (category in ('request', 'bug', 'other')),
  body       text not null check (char_length(body) between 1 and 2000),
  status     text not null default 'open' check (status in ('open', 'in_progress', 'done')),
  created_at timestamptz not null default now()
);
create index feedback_created_idx on feedback (created_at desc);

alter table feedback enable row level security;

-- 送信: 本人としてのみ insert できる（なりすまし・匿名投稿は不可）
create policy feedback_insert on feedback
  for insert to authenticated
  with check (user_id = auth.uid());

-- 閲覧・更新: 運営のみ（is_admin() は 0023 で定義済み・SECURITY DEFINER）
create policy feedback_admin_select on feedback
  for select to authenticated
  using (is_admin());

create policy feedback_admin_update on feedback
  for update to authenticated
  using (is_admin())
  with check (is_admin());
