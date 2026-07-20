-- =============================================================================
-- プルミエ！ 0070 — 参加表明したイベントの開催前リマインダー（通知）
--   通知方針「重要な通知＋自分のアクションのリマインド」の後者。
--   参加表明（event_rsvps）した本人に、開催の前日（既定）に「まもなく開催」の
--   アプリ内通知を作る。アプリ側の常駐cronは無いため、Supabase の pg_cron で
--   日次実行する想定（関数＝ここで用意、スケジュール登録＝運用側）。
--
--   将来 PWA プッシュを入れたら、この通知INSERTをそのままプッシュ配信の起点に
--   流用できる（notifications への INSERT を購読して送る設計）。
--
--   冪等: 同じ (user_id, event) の event_reminder が既にあれば作らない。
--   ＝cronが1日に複数回動いても二重送信されない。
-- =============================================================================

alter type notification_type add value if not exists 'event_reminder';

-- 開催 days_ahead 日前のイベントについて、参加表明者へリマインド通知を作る。
-- 返り値＝作成した通知件数。security definer（cronのpostgresロールから実行）。
create or replace function create_event_reminders(days_ahead integer default 1)
returns integer
language plpgsql
security definer set search_path = public
as $$
declare
  n_inserted integer;
begin
  insert into notifications (user_id, type, entity_id, body)
  select r.user_id,
         'event_reminder'::notification_type,
         e.id,
         'まもなく開催！「' || e.name || '」（' || to_char(e.starts_on, 'MM/DD') ||
           '）が近づいています。持ち物・集合の確認をしておきましょう。'
  from events e
  join event_rsvps r on r.event_id = e.id
  where e.starts_on = current_date + days_ahead
    and not exists (
      select 1 from notifications n
      where n.user_id = r.user_id
        and n.entity_id = e.id
        and n.type = 'event_reminder'
    );
  get diagnostics n_inserted = row_count;
  return n_inserted;
end;
$$;

-- 一般ユーザーからは呼べないようにする（cron／サービスロール専用）。
revoke execute on function create_event_reminders(integer) from public;

-- -----------------------------------------------------------------------------
-- 運用: 日次スケジュール登録（Supabase の pg_cron を有効化して SQL Editor で実行）
--   毎日 09:00(UTC) に「翌日開催」の参加者へリマインドを作る例:
--
--     select cron.schedule(
--       'event-reminders-daily', '0 9 * * *',
--       $$ select create_event_reminders(1); $$
--     );
--
--   前日だけでなく数日前にも送りたい場合は days_ahead を変えたジョブを追加。
--   手動テスト: select create_event_reminders(1);
-- -----------------------------------------------------------------------------
