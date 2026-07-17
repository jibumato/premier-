-- =============================================================================
-- プルミエ！ 0057 — 通報対応のための運営メッセージ確認（監査ログ付き）
--   運営（is_admin）が「通報対応のため」に限り、通報されたユーザーの会話を
--   確認できるようにする。通信の秘密・プライバシーへの配慮として:
--
--   ・messages への is_admin 用 RLS ポリシーは追加しない。
--     ＝運営でもクライアントから messages を直接 select することはできない。
--     閲覧は必ず下記 SECURITY DEFINER 関数経由にし、関数内で is_admin() を確認する。
--   ・閲覧できるのは「通報されたユーザーが参加している会話」だけ。
--     通報が1件も無いユーザーの会話は列挙も閲覧もできない（無差別閲覧の防止＝
--     "通報・フラグ起点でのみ" という原則をDB側で強制する）。
--   ・会話本文を取得するたびに admin_message_access_log へ監査ログを残す
--     （誰が・いつ・どの会話を・なぜ見たか）。閲覧理由の入力は必須。
--   ・「読む」ことと「ログを残す」ことは同一関数内で行うため、ログを残さずに
--     本文だけを読むことはできない。
--
--   ⚠️ 本機能を実際に運用する前に、プライバシーポリシー/規約での開示と同意取得
--      （「通報対応・安全確保のため、必要な範囲で運営がメッセージを確認する場合が
--      あります」等）が必要。実装だけでは法的根拠は満たされない点に注意。
--   is_admin() は 0023 で定義済み（SECURITY DEFINER）。
-- =============================================================================

-- ---- 監査ログ ---------------------------------------------------------------
create table if not exists admin_message_access_log (
  id              uuid primary key default gen_random_uuid(),
  admin_id        uuid not null references profiles (id) on delete cascade,
  target_user_id  uuid references profiles (id) on delete set null,
  conversation_id uuid references conversations (id) on delete set null,
  reason          text not null,
  accessed_at     timestamptz not null default now()
);
create index if not exists admin_message_access_log_idx on admin_message_access_log (accessed_at desc);

alter table admin_message_access_log enable row level security;

-- 監査ログの閲覧は運営のみ（運営間の相互監視のため運営には見える）。
-- 書き込みは下記 SECURITY DEFINER 関数からのみ（一般の insert/update/delete
-- ポリシーは付与しない＝運営でもログの改ざん・削除はできない）。
drop policy if exists admin_message_access_log_select on admin_message_access_log;
create policy admin_message_access_log_select on admin_message_access_log
  for select to authenticated using (is_admin());

-- ---- 通報されたユーザーの会話一覧（メタ情報のみ・本文は含めない）-----------
create or replace function admin_list_user_conversations(p_user_id uuid)
returns table (
  conversation_id uuid,
  other_user_id   uuid,
  other_user_name text,
  message_count   bigint,
  last_message_at timestamptz
)
language plpgsql
security definer
set search_path = public
as $$
begin
  if not is_admin() then
    raise exception 'not authorized';
  end if;
  -- トリガー要件: 対象ユーザーに通報が1件以上あること
  if not exists (
    select 1 from reports r where r.target_type = 'user' and r.target_id = p_user_id
  ) then
    raise exception 'target user has no reports';
  end if;
  return query
    select
      c.id as conversation_id,
      other.user_id as other_user_id,
      op.display_name as other_user_name,
      (select count(*) from messages m where m.conversation_id = c.id) as message_count,
      (select max(m.created_at) from messages m where m.conversation_id = c.id) as last_message_at
    from conversation_members cm
    join conversations c on c.id = cm.conversation_id
    left join lateral (
      select cm2.user_id
      from conversation_members cm2
      where cm2.conversation_id = c.id and cm2.user_id <> p_user_id
      order by cm2.user_id
      limit 1
    ) other on true
    left join profiles op on op.id = other.user_id
    where cm.user_id = p_user_id
    order by last_message_at desc nulls last;
end;
$$;

-- ---- 会話本文の取得（＝監査ログを残す・理由必須）---------------------------
create or replace function admin_get_conversation_messages(p_conversation_id uuid, p_reason text)
returns table (
  message_id  uuid,
  sender_id   uuid,
  sender_name text,
  body        text,
  image_url   text,
  created_at  timestamptz
)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_target uuid;
begin
  if not is_admin() then
    raise exception 'not authorized';
  end if;
  if p_reason is null or char_length(btrim(p_reason)) < 3 then
    raise exception 'reason required';
  end if;
  -- この会話に「通報されたメンバー」がいることを確認（無差別閲覧の防止）。
  -- 併せてログの target_user_id に使う。
  select cm.user_id into v_target
  from conversation_members cm
  where cm.conversation_id = p_conversation_id
    and exists (
      select 1 from reports r where r.target_type = 'user' and r.target_id = cm.user_id
    )
  limit 1;
  if v_target is null then
    raise exception 'conversation has no reported member';
  end if;
  -- 監査ログ（本文取得のたびに1行。読むこととログは不可分）
  insert into admin_message_access_log (admin_id, target_user_id, conversation_id, reason)
  values (auth.uid(), v_target, p_conversation_id, btrim(p_reason));
  -- 本文
  return query
    select m.id, m.sender_id, p.display_name, m.body, m.image_url, m.created_at
    from messages m
    join profiles p on p.id = m.sender_id
    where m.conversation_id = p_conversation_id
    order by m.created_at asc;
end;
$$;

-- ---- 監査ログの一覧（運営が自分たちの閲覧履歴を確認する）--------------------
create or replace function admin_list_message_access_log(p_limit int default 50)
returns table (
  id              uuid,
  admin_name      text,
  target_name     text,
  conversation_id uuid,
  reason          text,
  accessed_at     timestamptz
)
language plpgsql
security definer
set search_path = public
as $$
begin
  if not is_admin() then
    raise exception 'not authorized';
  end if;
  return query
    select l.id, ap.display_name, tp.display_name, l.conversation_id, l.reason, l.accessed_at
    from admin_message_access_log l
    left join profiles ap on ap.id = l.admin_id
    left join profiles tp on tp.id = l.target_user_id
    order by l.accessed_at desc
    limit p_limit;
end;
$$;

-- 実行権限: 認証ユーザーに付与するが、関数内 is_admin() で運営以外は弾かれる。
revoke all on function admin_list_user_conversations(uuid) from public;
revoke all on function admin_get_conversation_messages(uuid, text) from public;
revoke all on function admin_list_message_access_log(int) from public;
grant execute on function admin_list_user_conversations(uuid) to authenticated;
grant execute on function admin_get_conversation_messages(uuid, text) to authenticated;
grant execute on function admin_list_message_access_log(int) to authenticated;
