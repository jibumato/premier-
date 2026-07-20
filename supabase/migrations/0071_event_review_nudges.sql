-- =============================================================================
-- プルミエ！ 0071 — 開催後の「レビュー催促」通知
--   0069(開催後レビュー) × 0070(開催前リマインド) を繋ぐピース。開催「後」に、
--   参加表明したのにまだレビューを書いていない人へ「レビューしませんか？」を
--   通知する。前日リマインドで人を集め、事後催促でレビューを書かせることで、
--   会場レビュー（凍結した老舗DBが持てない鮮度資産）を自動で積み上げる。
--
--   対象: 開催 days_after 日前に終わったイベントの参加表明者のうち、
--     ・まだ event_reviews にレビューが無い人
--     ・まだ同じ review_nudge 通知を受け取っていない人（冪等・二重送信なし）
--   通知方針「自分のアクションのリマインド」に該当。
-- =============================================================================

alter type notification_type add value if not exists 'review_nudge';

create or replace function create_review_nudges(days_after integer default 2)
returns integer
language plpgsql
security definer set search_path = public
as $$
declare
  n_inserted integer;
begin
  insert into notifications (user_id, type, entity_id, body)
  select r.user_id,
         'review_nudge'::notification_type,
         e.id,
         'お疲れさまでした！「' || e.name ||
           '」はいかがでしたか？会場のレビューを残すと、これから行く人の参考になります。'
  from events e
  join event_rsvps r on r.event_id = e.id
  where e.starts_on = current_date - days_after
    and not exists (
      select 1 from event_reviews rv
      where rv.event_id = e.id and rv.user_id = r.user_id
    )
    and not exists (
      select 1 from notifications n
      where n.user_id = r.user_id and n.entity_id = e.id and n.type = 'review_nudge'
    );
  get diagnostics n_inserted = row_count;
  return n_inserted;
end;
$$;

revoke execute on function create_review_nudges(integer) from public;

-- -----------------------------------------------------------------------------
-- 運用: 日次スケジュール登録（pg_cron）。開催の2日後に未レビューの参加者へ催促する例:
--
--     select cron.schedule(
--       'event-review-nudges-daily', '0 10 * * *',
--       $$ select create_review_nudges(2); $$
--     );
--
--   手動テスト: select create_review_nudges(2);
--   未登録でも通知が作られないだけで、他機能への影響はありません。
-- -----------------------------------------------------------------------------
