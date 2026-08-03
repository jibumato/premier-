-- =============================================================================
-- プルミエ！ 0078 — 出席実績の改ざん防止（0077 の穴を塞ぐ）
--
--   0077 は「出欠の記録は set_attendance（SECURITY DEFINER）だけ」という前提で
--   設計したが、awase_applications の UPDATE ポリシー applications_update は
--   応募者本人にも
--       applicant_id = auth.uid() and status in ('done','rejected')
--   の範囲で更新を許している（自分で辞退・完了にできる正規の導線）。
--   このため応募者は
--       update awase_applications set status = 'done', attended = true where ...
--   と attended を混ぜ込むことができ、自分の出席率を自演で盛れてしまう。
--   出席率は「ドタキャンしない人」を示す信頼シグナルなので、自己申告で
--   書けてしまうと指標の意味が失われる。
--
--   対策: attended 列の変更を BEFORE UPDATE トリガで拒否し、set_attendance が
--   立てたトランザクションローカルのフラグがあるときだけ通す。
--   ・フラグは set_config(..., is_local => true) なのでトランザクション内のみ有効。
--   ・PostgREST は public スキーマの関数しか公開しないため、クライアントから
--     set_config（pg_catalog）を直接呼んでフラグを立てることはできない。
--   ・列単位 GRANT ではなくトリガにしたのは、Supabase の既定権限
--     （anon/authenticated への grant all）に後から上書きされないため。
-- =============================================================================

create or replace function guard_attendance_write()
returns trigger
language plpgsql
as $$
begin
  if new.attended is distinct from old.attended
     and coalesce(current_setting('app.attendance_write', true), '') <> '1' then
    raise exception
      'attended は主催者のみ set_attendance() 経由で更新できます'
      using errcode = '42501';
  end if;
  return new;
end;
$$;

drop trigger if exists awase_applications_guard_attendance on awase_applications;
create trigger awase_applications_guard_attendance
  before update on awase_applications
  for each row execute function guard_attendance_write();

-- set_attendance だけがフラグを立てられる（トランザクションローカル）。
create or replace function set_attendance(p_application uuid, p_attended boolean)
returns void
language plpgsql
security definer set search_path = public
as $$
begin
  perform set_config('app.attendance_write', '1', true);
  update awase_applications ap
     set attended = p_attended
   where ap.id = p_application
     and ap.status in ('accepted', 'done')
     and exists (select 1 from awase a where a.id = ap.awase_id and a.host_id = auth.uid());
  if not found then
    perform set_config('app.attendance_write', '', true);
    raise exception 'set_attendance: not host of this awase, or application not accepted';
  end if;
  -- 同一トランザクション内で以降の UPDATE がすり抜けないよう必ず降ろす。
  perform set_config('app.attendance_write', '', true);
end;
$$;
revoke execute on function set_attendance(uuid, boolean) from public;
grant execute on function set_attendance(uuid, boolean) to authenticated;
