-- 0026_create_direct_conversation.sql
-- メッセージ開始（1:1会話の find-or-create）をサーバー側に一本化
--
-- 背景: クライアントが「会話を作成 → 自分＋相手の2行を conversation_members に
--   INSERT」していたが、RLS の WITH CHECK は行ごとに評価され、2行目（相手）の
--   評価時点では1行目（自分）の membership がまだ可視でないため
--   「is_conversation_member(conv, me) = false」となり insert が落ちる、という
--   多行 INSERT 特有の不安定さがあった（プロフィールの「メッセージ」が無反応）。
--
-- 対策: find-or-create を SECURITY DEFINER 関数にまとめ、定義者権限で RLS を
--   迂回して原子的に作成する。クライアントはこの RPC を1回呼ぶだけ。

create or replace function create_direct_conversation(p_other uuid, p_awase uuid default null)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  me   uuid := auth.uid();
  conv uuid;
begin
  if me is null then
    raise exception 'not authenticated';
  end if;
  if p_other is null or p_other = me then
    raise exception 'invalid target';
  end if;

  -- 既存の1:1会話があれば再利用（複数エントリポイントからのスレッド分裂を防止）
  select cm1.conversation_id
    into conv
  from conversation_members cm1
  join conversation_members cm2
    on cm2.conversation_id = cm1.conversation_id
   and cm2.user_id = p_other
  where cm1.user_id = me
  limit 1;

  if conv is not null then
    return conv;
  end if;

  insert into conversations (awase_id) values (p_awase) returning id into conv;
  insert into conversation_members (conversation_id, user_id)
    values (conv, me), (conv, p_other);

  return conv;
end;
$$;

revoke all on function create_direct_conversation(uuid, uuid) from public;
grant execute on function create_direct_conversation(uuid, uuid) to authenticated;
