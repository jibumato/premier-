-- =============================================================================
-- プルミエ！ Phase 4 (P3) — 知恵袋 (Q&A)
--   質問・回答・「役に立った」いいね。ベストアンサーは質問の投稿者のみが選べる
--   （SECURITY DEFINER 関数でチェック、手動モデレーションなしの自動運営方針に準拠）。
--   「解決済み」はベストアンサーの有無から導出し、専用カラムは持たない。
-- =============================================================================

create table qa_questions (
  id          uuid primary key default gen_random_uuid(),
  author_id   uuid not null references profiles (id) on delete cascade,
  title       text not null,
  body        text not null,
  tag         text not null default '',
  created_at  timestamptz not null default now()
);
create index qa_questions_created_idx on qa_questions (created_at desc);

create table qa_answers (
  id          uuid primary key default gen_random_uuid(),
  question_id uuid not null references qa_questions (id) on delete cascade,
  author_id   uuid not null references profiles (id) on delete cascade,
  body        text not null,
  is_best     boolean not null default false,
  created_at  timestamptz not null default now()
);
create index qa_answers_question_idx on qa_answers (question_id, created_at);

create table qa_answer_likes (
  answer_id uuid not null references qa_answers (id) on delete cascade,
  user_id   uuid not null references profiles (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (answer_id, user_id)
);

-- ---- Only the question's author may mark an answer to their own question as
-- best (and only one at a time) — done server-side rather than via a general
-- UPDATE policy, since "which single row" is a business rule, not a row check.
create function mark_best_answer(p_answer_id uuid)
returns void
language plpgsql
security definer set search_path = public
as $$
declare
  v_question_id uuid;
  v_owner uuid;
begin
  select question_id into v_question_id from qa_answers where id = p_answer_id;
  if v_question_id is null then
    raise exception 'answer not found';
  end if;
  select author_id into v_owner from qa_questions where id = v_question_id;
  if v_owner is null or v_owner <> auth.uid() then
    raise exception 'not authorized';
  end if;
  update qa_answers set is_best = false where question_id = v_question_id and is_best;
  update qa_answers set is_best = true where id = p_answer_id;
end;
$$;

-- =============================================================================
-- Row Level Security
-- =============================================================================
alter table qa_questions    enable row level security;
alter table qa_answers      enable row level security;
alter table qa_answer_likes enable row level security;

create policy qa_questions_select on qa_questions for select using (true);
create policy qa_questions_insert on qa_questions for insert to authenticated with check (author_id = auth.uid());
create policy qa_questions_delete on qa_questions for delete using (author_id = auth.uid());

create policy qa_answers_select on qa_answers for select using (true);
create policy qa_answers_insert on qa_answers for insert to authenticated with check (author_id = auth.uid());
create policy qa_answers_delete on qa_answers for delete using (author_id = auth.uid());

create policy qa_answer_likes_select on qa_answer_likes for select using (true);
create policy qa_answer_likes_insert on qa_answer_likes for insert to authenticated with check (user_id = auth.uid());
create policy qa_answer_likes_delete on qa_answer_likes for delete using (user_id = auth.uid());
