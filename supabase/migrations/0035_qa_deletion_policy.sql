-- =============================================================================
-- プルミエ！ 0035 — 知恵袋の削除方針（ハイブリッド）
--   質問: 回答が付くまでは投稿者本人が削除可。回答が付いたら運営のみ。
--   回答: ベストアンサー確定前なら回答者本人が削除可。ベストアンサーは運営のみ。
--   運営向けに SECURITY DEFINER の削除RPCを用意（is_admin() チェック）。
-- =============================================================================

-- ---- 質問の削除ポリシーを差し替え（従来: 本人なら無条件で削除可）
drop policy if exists qa_questions_delete on qa_questions;
create policy qa_questions_delete on qa_questions for delete
  using (
    author_id = auth.uid()
    and not exists (select 1 from qa_answers a where a.question_id = qa_questions.id)
  );

-- ---- 回答の削除ポリシーを差し替え（従来: 本人なら無条件で削除可）
--   ベストアンサーは質問者の「解決済み」状態を支えるため本人でも消せない。
drop policy if exists qa_answers_delete on qa_answers;
create policy qa_answers_delete on qa_answers for delete
  using (author_id = auth.uid() and not is_best);

-- ---- 運営用: 質問を削除（回答・いいねは FK cascade で一緒に消える）
create or replace function admin_delete_qa_question(p_question_id uuid)
returns void
language plpgsql
security definer set search_path = public
as $$
begin
  if not is_admin() then
    raise exception 'not authorized';
  end if;
  delete from qa_questions where id = p_question_id;
end;
$$;

-- ---- 運営用: 回答を削除（ベストアンサー含む。いいねは cascade）
create or replace function admin_delete_qa_answer(p_answer_id uuid)
returns void
language plpgsql
security definer set search_path = public
as $$
begin
  if not is_admin() then
    raise exception 'not authorized';
  end if;
  delete from qa_answers where id = p_answer_id;
end;
$$;

revoke all on function admin_delete_qa_question(uuid) from public;
revoke all on function admin_delete_qa_answer(uuid) from public;
grant execute on function admin_delete_qa_question(uuid) to authenticated;
grant execute on function admin_delete_qa_answer(uuid) to authenticated;
