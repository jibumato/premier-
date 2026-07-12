-- =============================================================================
-- プルミエ！ — 主催者向け「手間削減」第1弾: 定員到達で自動締切
--   応募（awase_applications）の accepted 数が併せの capacity に達したら、
--   awase.status を 'closed' にして募集を自動的に締め切る。
--   ・capacity が NULL（定員未設定）の併せは対象外。
--   ・自動での再オープンはしない（主催が手動で status を戻せる）。
--   冪等（or replace / drop trigger if exists、再実行安全）。
-- =============================================================================

create or replace function close_awase_when_full()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  target_awase uuid;
  cap          int;
  accepted     int;
begin
  -- INSERT/UPDATE/DELETE いずれでも対象併せを特定する
  target_awase := coalesce(new.awase_id, old.awase_id);

  select capacity into cap from awase where id = target_awase;
  if cap is null then
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

drop trigger if exists trg_close_awase_when_full on awase_applications;
create trigger trg_close_awase_when_full
  after insert or update or delete on awase_applications
  for each row execute function close_awase_when_full();
