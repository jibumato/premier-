-- =============================================================================
-- プルミエ！ 0060 — 投稿写真へのいいね
--   設計方針（Instagram のいいね非表示・0022/0058 の「ゼロを目立たせない」方針）:
--     ・いいね数は原則「投稿者本人にだけ」見せる。ただし 5件を超えたら公開する
--       （表示ロジックはクライアント側。ここでは like_count を保持するだけ）。
--     ・いいねされたら投稿者へおしらせ。最初の1件は特別に「初いいね」を祝う。
--     ・新しい写真を投稿したら「併せ仲間」（同じ併せで accepted/done だった人・
--       主催者）へおしらせして、最初の反応が付きやすくする。
--   'post' 通知種別は 0059 で追加済み。冪等（if not exists / create or replace）。
-- =============================================================================

-- ---- いいね本体 -------------------------------------------------------------
create table if not exists post_likes (
  post_id    uuid not null references posts (id) on delete cascade,
  user_id    uuid not null references profiles (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (post_id, user_id)
);
create index if not exists post_likes_post_idx on post_likes (post_id);

-- 表示用のカウンター（公開の 5件超判定・本人向け表示に使う）。真実は post_likes 側。
alter table posts add column if not exists like_count int not null default 0;

alter table post_likes enable row level security;

-- 自分のいいねだけ読める（ハートの押下状態の判定用）。他人のいいね一覧は見せない
-- （公開カウントは posts.like_count 経由）。
drop policy if exists post_likes_select on post_likes;
create policy post_likes_select on post_likes for select using (user_id = auth.uid());

-- いいねは本人としてのみ、かつ「自分の投稿以外」に対して付けられる（自作自演の
-- 水増し防止）。見えない投稿にも付けられない（サブクエリが RLS で null になり弾かれる）。
drop policy if exists post_likes_insert on post_likes;
create policy post_likes_insert on post_likes for insert to authenticated
  with check (
    user_id = auth.uid()
    and user_id <> (select p.author_id from posts p where p.id = post_id)
  );

-- いいね解除は本人のみ
drop policy if exists post_likes_delete on post_likes;
create policy post_likes_delete on post_likes for delete using (user_id = auth.uid());

-- ---- カウンター維持 ＋ いいね通知（初いいねのお祝い） ----------------------
create or replace function on_post_like()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_author uuid;
  v_count  int;
  v_name   text;
begin
  update posts set like_count = like_count + 1
    where id = new.post_id
    returning author_id, like_count into v_author, v_count;

  -- 自分のいいね・投稿が消えている場合は通知しない（カウントのみ）
  if v_author is null or v_author = new.user_id then
    return new;
  end if;

  select display_name into v_name from profiles where id = new.user_id;
  insert into notifications (user_id, type, actor_id, entity_id, body)
  values (
    v_author, 'like', new.user_id, new.post_id,
    coalesce(v_name, '誰か') || 'さんがあなたの写真に'
      || case when v_count = 1 then '最初のいいねをつけました🎉' else 'いいねしました' end
  );
  return new;
end;
$$;

drop trigger if exists on_post_like_trg on post_likes;
create trigger on_post_like_trg
  after insert on post_likes
  for each row execute function on_post_like();

create or replace function on_post_unlike()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  update posts set like_count = greatest(like_count - 1, 0) where id = old.post_id;
  return old;
end;
$$;

drop trigger if exists on_post_unlike_trg on post_likes;
create trigger on_post_unlike_trg
  after delete on post_likes
  for each row execute function on_post_unlike();

-- ---- 新規投稿を「併せ仲間」へおしらせ ---------------------------------------
-- 併せ仲間 = 投稿者が関わった併せ（主催 or accepted/done で参加）における、
-- 主催者＋ accepted/done の参加者（本人を除く）。一緒に活動した人は最も反応を
-- くれやすい層なので、初動のいいねが付きやすくなる。
create or replace function notify_companions_on_post()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_name text;
begin
  select display_name into v_name from profiles where id = new.author_id;

  with my_awase as (
    select id from awase where host_id = new.author_id
    union
    select awase_id as id from awase_applications
      where applicant_id = new.author_id and status in ('accepted', 'done')
  ),
  companions as (
    select host_id as uid from awase where id in (select id from my_awase)
    union
    select applicant_id as uid from awase_applications
      where awase_id in (select id from my_awase) and status in ('accepted', 'done')
  )
  insert into notifications (user_id, type, actor_id, entity_id, body)
  select distinct c.uid, 'post', new.author_id, new.author_id,
         coalesce(v_name, '併せ仲間') || 'さんが新しい写真を投稿しました'
  from companions c
  where c.uid is not null and c.uid <> new.author_id;

  return new;
end;
$$;

drop trigger if exists on_post_created_notify_companions on posts;
create trigger on_post_created_notify_companions
  after insert on posts
  for each row execute function notify_companions_on_post();
