-- 0025_fix_messaging_rls_recursion.sql
-- メッセージ機能が動かない不具合の修正（RLS 無限再帰）
--
-- 症状: プロフィールの「メッセージ」ボタンが無反応。会話一覧が実データにならない。
-- 原因: conversation_members / messages の RLS ポリシーが、その USING / WITH CHECK
--   句の中で conversation_members を直接 SELECT していた。ポリシー評価のために
--   同じテーブルへ RLS 付きで再クエリするため Postgres が
--   「infinite recursion detected in policy for relation "conversation_members"」
--   （42P17）を投げ、会話作成 insert・会話一覧 select が失敗していた。
--   （クライアント側に onError が無く、失敗が「無反応」に見えていた。）
--
-- 対策: メンバー判定を SECURITY DEFINER 関数に切り出す。定義者権限で実行される
--   関数内の SELECT は RLS を再帰的に発火させないため、再帰が断ち切れる。

-- ---- helper: 指定ユーザーがその会話のメンバーか（RLS を発火させずに判定）----
create or replace function is_conversation_member(p_conversation uuid, p_user uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from conversation_members
    where conversation_id = p_conversation and user_id = p_user
  );
$$;

revoke all on function is_conversation_member(uuid, uuid) from public;
grant execute on function is_conversation_member(uuid, uuid) to authenticated;

-- ---- 再帰していたポリシーを貼り替え ----
-- conversations: メンバーだけ閲覧可（関数経由で再帰回避）
drop policy if exists conversations_select on conversations;
create policy conversations_select on conversations for select using (
  is_conversation_member(id, auth.uid())
);

-- conversation_members: 同じ会話のメンバーだけが行を閲覧可
drop policy if exists conversation_members_select on conversation_members;
create policy conversation_members_select on conversation_members for select using (
  is_conversation_member(conversation_id, auth.uid())
);

-- conversation_members insert: 自分自身の行、または既に自分がメンバーの会話へ
-- 相手の行を追加できる（1:1 会話作成時に 2 行 insert する運用）
drop policy if exists conversation_members_insert on conversation_members;
create policy conversation_members_insert on conversation_members for insert to authenticated with check (
  user_id = auth.uid()
  or is_conversation_member(conversation_id, auth.uid())
);

-- messages: メンバーだけ閲覧、メンバーが本人として送信
drop policy if exists messages_select on messages;
create policy messages_select on messages for select using (
  is_conversation_member(conversation_id, auth.uid())
);

drop policy if exists messages_insert on messages;
create policy messages_insert on messages for insert to authenticated with check (
  sender_id = auth.uid()
  and is_conversation_member(conversation_id, auth.uid())
);
