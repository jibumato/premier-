-- =============================================================================
-- プルミエ！ 0042 — 応募の希望キャラ → 承認で担当キャラを自動確定
--   応募時に希望キャラ（awase_applications.role_id）を選べるようにしたのに合わせ、
--   主催が承認(accepted)したら、その希望キャラを本人に確定（awase_roles の
--   assignee_id / status='confirmed'）する。承認が外れたら枠を解放する。
--   role_id・awase_roles は 0001 実装済みのため、本マイグレーションはトリガーのみ。
--   トリガーは SECURITY DEFINER（応募者本人の done 更新でも発火し得るが、
--   awase_roles は主催しか書けないため、権限を跨いで整合させる必要がある）。
-- =============================================================================

create function sync_role_assignment()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.role_id is null then
    return new;
  end if;

  -- 承認された → 希望キャラを本人に確定（未割当、または既に本人の枠のときだけ）
  if new.status = 'accepted' and old.status is distinct from 'accepted' then
    update awase_roles
      set assignee_id = new.applicant_id, status = 'confirmed'
      where id = new.role_id and awase_id = new.awase_id
        and (assignee_id is null or assignee_id = new.applicant_id);

  -- 承認が外れた（辞退/差し戻し） → 本人に割り当てられていた枠を解放
  elsif old.status = 'accepted' and new.status in ('rejected', 'applied') then
    update awase_roles
      set assignee_id = null, status = 'open'
      where id = new.role_id and awase_id = new.awase_id
        and assignee_id = new.applicant_id;
  end if;

  return new;
end;
$$;

create trigger on_application_role_sync
  after update on awase_applications
  for each row execute function sync_role_assignment();
