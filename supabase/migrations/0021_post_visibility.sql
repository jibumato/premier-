-- =============================================================================
-- プルミエ！ — ギャラリーの公開範囲（ゾーニング強化）
--   老舗コスプレSNSの核だった「身内にだけ見せる」をプルミエ！流に。
--   posts.visibility:
--     'public' … 従来どおり（非公開アカウント設定には引き続き追従）
--     'awase'  … 併せ仲間のみ（同じ併せで承認済み/完了になったことがある相手、
--                 またはその併せの主催⇄参加者の関係にある相手）＋本人
--   冪等（add column if not exists / create or replace / drop policy if exists）。
-- =============================================================================

alter table posts add column if not exists visibility text not null default 'public'
  check (visibility in ('public', 'awase'));

-- 「併せ仲間」判定: a と b が同じ併せに関わったことがあるか。
--   ・a が主催した併せに b が accepted/done で参加（または逆）
--   ・同じ併せに両者が accepted/done で参加
create or replace function has_shared_awase(a uuid, b uuid)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1
    from awase_applications ap
    join awase aw on aw.id = ap.awase_id
    where ap.status in ('accepted', 'done')
      and (
        (aw.host_id = a and ap.applicant_id = b)
        or (aw.host_id = b and ap.applicant_id = a)
      )
  )
  or exists (
    select 1
    from awase_applications ap1
    join awase_applications ap2 on ap1.awase_id = ap2.awase_id
    where ap1.applicant_id = a and ap2.applicant_id = b
      and ap1.status in ('accepted', 'done')
      and ap2.status in ('accepted', 'done')
  );
$$;

drop policy if exists posts_select on posts;
create policy posts_select on posts for select using (
  -- 従来の非公開アカウント制御（プロフィール単位）
  exists (
    select 1 from profiles p
    where p.id = posts.author_id
      and (
        not p.is_private
        or p.id = auth.uid()
        or exists (select 1 from follows f where f.followee_id = p.id and f.follower_id = auth.uid())
      )
  )
  -- 投稿単位の公開範囲
  and (
    posts.visibility = 'public'
    or posts.author_id = auth.uid()
    or (posts.visibility = 'awase' and has_shared_awase(posts.author_id, auth.uid()))
  )
);
