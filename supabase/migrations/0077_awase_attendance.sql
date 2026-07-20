-- =============================================================================
-- プルミエ！ 0077 — 出席実績（ドタキャン対策 / 併せ信頼スコアの本体）
--   併せの主催者が開催後に「参加者が実際に来たか」を記録できるようにする。
--   record: awase_applications.attended（null=未確認 / true=出席 / false=欠席）。
--   これを集計した「出席率」を、参加者を選ぶときの安心材料（ポジティブな信頼
--   シグナル）として使う。晒し上げにならないよう、欠席の生数は公開せず、
--   クライアントは出席率が十分・良好なときだけバッジ表示する。
--
--   安全設計:
--   ・記録は「そのグループのホスト本人」だけ（set_attendance RPC で強制）。
--     RLSの更新ポリシーを広げず、SECURITY DEFINER 関数に閉じ込める。
--   ・対象は accepted / done の応募のみ（承認された参加者だけ）。
--   ・出席率は集計値のみ返す（個別イベントの出欠は返さない）。
-- =============================================================================

alter table awase_applications add column attended boolean;  -- null=未確認, true=出席, false=欠席

-- ホスト本人だけが、自分の併せの承認済み参加者の出欠を記録できる。
create function set_attendance(p_application uuid, p_attended boolean)
returns void
language plpgsql
security definer set search_path = public
as $$
begin
  update awase_applications ap
     set attended = p_attended
   where ap.id = p_application
     and ap.status in ('accepted', 'done')
     and exists (select 1 from awase a where a.id = ap.awase_id and a.host_id = auth.uid());
  if not found then
    raise exception 'set_attendance: not host of this awase, or application not accepted';
  end if;
end;
$$;
revoke execute on function set_attendance(uuid, boolean) from public;
grant execute on function set_attendance(uuid, boolean) to authenticated;

-- ある参加者の出席実績（集計のみ）。attended=true の数と、記録済み（null以外）の数。
-- 出席率＝attended / marked はクライアント側で算出し、表示可否も判断する。
create function user_attendance_stats(p_user uuid)
returns table (attended_count integer, marked_count integer)
language sql
stable
security definer set search_path = public
as $$
  select
    count(*) filter (where attended is true)::integer,
    count(*) filter (where attended is not null)::integer
  from awase_applications
  where applicant_id = p_user;
$$;
revoke execute on function user_attendance_stats(uuid) from public;
grant execute on function user_attendance_stats(uuid) to anon, authenticated;
