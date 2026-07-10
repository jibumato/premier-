-- =============================================================================
-- プルミエ！ Phase 4 (P3) — フリマ（衣装・小道具の個人間売買）
--   ワンオペ制約によりアプリ内決済は実装しない（Constraints）。取引は出品者と
--   購入希望者が直接メッセージで行う想定なので、ここは「出品情報の掲載」だけを
--   担う。売れたら status を 'sold' にして SOLD 表示に切り替える。
-- =============================================================================

create table market_items (
  id             uuid primary key default gen_random_uuid(),
  seller_id      uuid not null references profiles (id) on delete cascade,
  title          text not null,
  work_id        uuid references works (id) on delete set null,
  price          integer not null check (price >= 0),
  size           text not null default '',
  item_condition text not null default '',
  shipping       text,
  body           text,
  image_url      text,
  status         text not null default 'open' check (status in ('open', 'sold')),
  created_at     timestamptz not null default now()
);
create index market_items_created_idx on market_items (created_at desc);
create index market_items_seller_idx on market_items (seller_id, created_at desc);

alter table market_items enable row level security;

create policy market_items_select on market_items for select using (true);
create policy market_items_insert on market_items for insert to authenticated with check (seller_id = auth.uid());
create policy market_items_update on market_items for update
  using (seller_id = auth.uid()) with check (seller_id = auth.uid());
create policy market_items_delete on market_items for delete using (seller_id = auth.uid());
