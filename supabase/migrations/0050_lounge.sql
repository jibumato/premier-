-- =============================================================================
-- プルミエ！ 0050 — 談話室（トップページで誰でも気軽に投稿できる掲示板）
--   短文（最大300字）を誰でも投稿できるオープンな場。荒らし対策として:
--     ① 連投防止のクールダウン（20秒に1件まで）
--     ② 24時間あたりの投稿数上限（30件）
--     ③ 簡易NGワード・スパムパターン判定（リンク・同一文字の異常な連続・
--        最低限の暴言ワード）を check 制約で拒否
--     ④ 既存の通報しきい値による自動非表示（content_flags、0010と同じ仕組み）
--     ⑤ ブロックしたユーザーの投稿はフィードから除外（既存の blocks を流用）
--     ⑥ 運営はいつでも強制削除できる（is_admin() 限定 RPC）
--   ①②③はいずれもDBの制約・RLSで強制するため、クライアントの実装に関わらず
--   常に効く。
-- =============================================================================

create table lounge_posts (
  id         uuid primary key default gen_random_uuid(),
  author_id  uuid not null references profiles (id) on delete cascade,
  body       text not null check (char_length(body) between 1 and 300),
  created_at timestamptz not null default now()
);
create index lounge_posts_created_idx on lounge_posts (created_at desc);

-- ③ 簡易NGワード・スパムパターン判定。運営が語彙を増やしたい場合は
-- この関数を create or replace function で更新すればよい（アプリの再デプロイ不要）。
create or replace function lounge_is_spammy(p_body text)
returns boolean
language sql
immutable
as $$
  select
    p_body ~* '(https?://|www\.)'                    -- リンク投稿を禁止（外部誘導・スパム対策）
    or p_body ~ '(.)\1{9,}'                           -- 同一文字の10連続以上（荒らしの連打対策）
    or p_body ~* '(死ね|殺す|きえろ|うざい|きもい)'    -- 最低限の暴言ワード（随時追加）
$$;

alter table lounge_posts
  add constraint lounge_posts_not_spammy check (not lounge_is_spammy(body));

alter table lounge_posts enable row level security;

-- 閲覧は誰でも可（非表示は通報しきい値＝content_flags とブロックでクライアント側が制御）
create policy lounge_posts_select on lounge_posts for select using (true);

-- ①② 投稿は本人のみ・クールダウン・日次上限を with check で強制する。
-- RLS の with check は「この文が始まった時点で確定している行」だけを見るため、
-- 投稿しようとしている行自体はこのサブクエリには含まれない（＝自分の直前の
-- 投稿だけを見て連投を判定できる）。
create policy lounge_posts_insert on lounge_posts
  for insert to authenticated
  with check (
    author_id = auth.uid()
    and not exists (
      select 1 from lounge_posts p
      where p.author_id = auth.uid() and p.created_at > now() - interval '20 seconds'
    )
    and (
      select count(*) from lounge_posts p
      where p.author_id = auth.uid() and p.created_at > now() - interval '24 hours'
    ) < 30
  );

create policy lounge_posts_delete on lounge_posts for delete using (author_id = auth.uid());

-- ⑥ 運営による強制削除（0035の知恵袋削除と同じ方針）。
create or replace function admin_delete_lounge_post(p_post_id uuid)
returns void
language plpgsql
security definer set search_path = public
as $$
begin
  if not is_admin() then
    raise exception 'not authorized';
  end if;
  delete from lounge_posts where id = p_post_id;
end;
$$;
revoke all on function admin_delete_lounge_post(uuid) from public;
grant execute on function admin_delete_lounge_post(uuid) to authenticated;

-- ④ 通報・自動非表示の対象に 'lounge' を追加（0010 の check 制約を作り直す。
-- 制約名は Postgres のデフォルト命名規則 <table>_<column>_check）。
alter table reports drop constraint if exists reports_target_type_check;
alter table reports add constraint reports_target_type_check
  check (target_type in ('user', 'awase', 'market', 'qa', 'lounge'));

alter table content_flags drop constraint if exists content_flags_target_type_check;
alter table content_flags add constraint content_flags_target_type_check
  check (target_type in ('user', 'awase', 'market', 'qa', 'lounge'));
