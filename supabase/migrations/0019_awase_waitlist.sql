-- =============================================================================
-- プルミエ！ — 主催者向け「手間削減」第3弾: キャンセル待ち受付
--   awase.accept_waitlist … true のとき、定員に達しても募集を自動締切せず
--   「キャンセル待ち」として応募を受け付け続ける。主催は空きが出たら承認して繰上げ。
--   第1弾の自動締切トリガー close_awase_when_full() を、accept_waitlist の併せでは
--   締め切らないよう更新する（それ以外は従来どおり定員到達で closed）。
--   冪等（add column if not exists / create or replace）。
-- =============================================================================

alter table awase add column if not exists accept_waitlist boolean not null default false;

create or replace function close_awase_when_full()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  target_awase uuid;
  cap          int;
  wl           boolean;
  accepted     int;
begin
  target_awase := coalesce(new.awase_id, old.awase_id);

  select capacity, accept_waitlist into cap, wl from awase where id = target_awase;
  -- 定員未設定、またはキャンセル待ちを受け付ける併せは自動締切しない
  if cap is null or wl then
    return coalesce(new, old);
  end if;

  select count(*) into accepted
  from awase_applications
  where awase_id = target_awase and status = 'accepted';

  if accepted >= cap then
    update awase set status = 'closed'
    where id = target_awase and status = 'open';
  end if;

  return coalesce(new, old);
end;
$$;

-- トリガー自体は 0017 で作成済み（after insert/update/delete）。関数の差し替えのみ。
