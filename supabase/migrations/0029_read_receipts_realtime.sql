-- 0029_read_receipts_realtime.sql
-- 既読表示（read receipt）をリアルタイム化する
--
-- チャットの「既読」は conversation_members.last_read_at を使う。相手がスレッドを
-- 開くと last_read_at が更新されるので、その UPDATE をリアルタイムで受け取れれば
-- 自分の画面の「既読」が即座に付く。そのために conversation_members を Realtime
-- パブリケーションに追加し、フィルタ購読が効くよう replica identity full にする。
--
-- 閲覧は RLS（is_conversation_member）で自分が参加する会話の行に限定されるため、
-- 他人の会話の既読状態が漏れることはない。

alter table conversation_members replica identity full;

do $$
begin
  alter publication supabase_realtime add table conversation_members;
exception
  when duplicate_object then null;  -- 既に追加済みなら無視
end $$;
