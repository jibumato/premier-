-- =============================================================================
-- プルミエ！ Phase 3 (P2) — 本人確認（手動運用の先行版）
--   eKYC ベンダー導入前の暫定として、身分証画像を受け取り運営が目視確認する。
--   承認時に運営(service role)が profiles.is_verified / is_age_verified を true に
--   更新し、確認済みの身分証画像は速やかに削除する運用（docs/SETUP.md 参照）。
--   スケール時（本人確認が手動で捌けなくなったら）eKYC へ移行する。
-- =============================================================================

create table verification_requests (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references profiles (id) on delete cascade,
  doc_url     text not null,             -- R2 に置いた身分証画像（確認後に削除）
  status      text not null default 'pending' check (status in ('pending', 'approved', 'rejected')),
  note        text,                      -- 運営メモ（却下理由など）
  created_at  timestamptz not null default now(),
  reviewed_at timestamptz
);
create index verification_requests_user_idx on verification_requests (user_id, created_at desc);
-- 1 ユーザーにつき保留中の申請は 1 件まで（二重申請を防ぐ）
create unique index verification_one_pending on verification_requests (user_id) where status = 'pending';

alter table verification_requests enable row level security;

-- 申請は本人が作成・自分の分だけ閲覧。承認/却下は運営が service role で行う
-- （一般ユーザー向けの update/delete ポリシーはあえて付与しない）。
create policy verification_insert on verification_requests
  for insert to authenticated with check (user_id = auth.uid());
create policy verification_select on verification_requests
  for select using (user_id = auth.uid());
