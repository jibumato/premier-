-- 0030_applications_update_guard.sql
-- 応募ステータス更新の権限を厳格化（自己承認の防止）
--
-- これまでの applications_update ポリシーは USING のみで WITH CHECK が無く、
-- 「applicant_id = auth.uid() or 主催」であれば更新後の値を検査していなかった。
-- そのため応募者が自分の行を status='accepted'（承認）に書き換える“自己承認”が
-- 技術的に可能だった。承認/却下は主催のみ、応募者は自分の行を 'done'（参加済み）に
-- するかキャンセル相当の 'rejected' にできる範囲に限定する。

drop policy if exists applications_update on awase_applications;
create policy applications_update on awase_applications for update
  using (
    applicant_id = auth.uid()
    or exists (select 1 from awase a where a.id = awase_id and a.host_id = auth.uid())
  )
  with check (
    -- 主催者はどのステータスにも変更可（承認/却下/完了/差し戻し）
    exists (select 1 from awase a where a.id = awase_id and a.host_id = auth.uid())
    -- 応募者は自分の行のみ、かつ 'done'（参加済み）/ 'rejected'（辞退）に限る
    or (applicant_id = auth.uid() and status in ('done', 'rejected'))
  );
