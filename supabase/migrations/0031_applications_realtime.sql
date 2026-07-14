-- 0031_applications_realtime.sql
-- 応募ステータスの変更をリアルタイムに反映する
--
-- 主催者が承認/却下/「応募中に戻す」等でステータスを変えたとき、応募者側の
-- 詳細表示（応募済み／承認待ち／承認済み／見送り）と、主催者側の応募者一覧を
-- 即時に更新できるよう、awase_applications を Realtime パブリケーションに追加する。
-- フィルタ購読（awase_id で絞り込み）が効くよう replica identity full にする。
--
-- 閲覧は applications_select（応募者本人 or 主催者）に従うため、他人の応募状態が
-- 漏れることはない。

alter table awase_applications replica identity full;

do $$
begin
  alter publication supabase_realtime add table awase_applications;
exception
  when duplicate_object then null;  -- 既に追加済みなら無視
end $$;
