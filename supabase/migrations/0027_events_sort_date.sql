-- 0027_events_sort_date.sql
-- イベントを「近日順」に並べるためのソート用日付列
--
-- events.event_date は「8/15(土)〜16(日)」のような表示用の文字列で日付順に
-- 並べられない。そのため useEvents は created_at（登録順）で並べており、
-- トップの「近日開催」も登録順の先頭3件になっていた。
-- 開始日を表す date 型の starts_on を追加し、これで並べ替える。

alter table events add column if not exists starts_on date;

-- 既存キュレーションイベント（0013 / 0014）の開始日をバックフィル
update events set starts_on = date '2026-07-31' where name = '世界コスプレサミット2026';
update events set starts_on = date '2026-08-15' where name = 'コミックマーケット108（夏コミ）';
update events set starts_on = date '2026-09-04' where name = 'Ultra acosta! 2026';
update events set starts_on = date '2026-10-30' where name = '池袋ハロウィンコスプレフェス2026';
update events set starts_on = date '2026-12-29' where name = 'コミックマーケット109（冬コミ）';
update events set starts_on = date '2027-01-24' where name = 'コスブー2nd（東京）';
update events set starts_on = date '2027-11-12' where name = '世界コスプレサミット2027';

create index if not exists events_starts_on_idx on events (starts_on);

-- 以後イベントを追加するときは starts_on（開始日）も入れてください。
-- 未設定（null）のイベントは並び順で末尾に回ります。
