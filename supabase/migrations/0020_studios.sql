-- =============================================================================
-- プルミエ！ — 撮影スタジオ・データベース（運営キュレーション型）
--   コスプレ界隈の老舗SNSで最後まで使われ続けた「スタジオ検索」を新設。
--   events と同じく運営が投入・更新する前提（一般ユーザーの書込みポリシーは無し）。
--   シードは公式サイトで確認できた有名どころ。料金・シチュエーションの詳細は
--   運営が各公式サイトで確認のうえ適宜更新してください。
--   冪等（create table if not exists / on conflict do nothing）。
-- =============================================================================

create table if not exists studios (
  id          uuid primary key default gen_random_uuid(),
  name        text not null unique,
  region      text not null,                 -- 関東/関西 など（検索の地域と同じ語彙）
  area_text   text not null default '',      -- 「東京・池袋」など表示用
  tags        text[] not null default '{}',  -- シチュエーション（白ホリ/和風/学校 等）
  price_text  text,                          -- 料金の目安（自由記述）
  url         text,                          -- 公式サイト
  description text,
  created_at  timestamptz not null default now()
);

alter table studios enable row level security;

drop policy if exists studios_select on studios;
create policy studios_select on studios for select using (true);

insert into studios (name, region, area_text, tags, price_text, url, description) values
  ('ハコスタジアム東京 池袋', '関東', '東京・池袋',
   array['シェア型','多シチュエーション','白ホリ'],
   '時間制（公式サイト参照）', 'https://hacostadium.com/',
   'シェア型のコスプレ撮影スタジアム。多彩なセットを1施設で回れる定番スポット。'),
  ('ハコスタジアム東京 四谷', '関東', '東京・四谷',
   array['シェア型','多シチュエーション'],
   '時間制（公式サイト参照）', 'https://hacostadium.com/',
   'ハコスタジアム系列の東京・四谷スタジオ。'),
  ('ハコスタジアム大阪', '関西', '大阪・弁天町',
   array['シェア型','多シチュエーション','50種以上のセット'],
   '時間制（公式サイト参照）', 'https://hacostadium.com/osaka/',
   '50種以上のシチュエーションから選べる大型シェアスタジオ。'),
  ('HACOSTUDIO LUX', '関西', '大阪・弁天町',
   array['貸切','洋風','ゴージャス'],
   '貸切・時間制（公式サイト参照）', 'https://hacostudio.com/',
   'ハコスタジオ系列の貸切型。洋風のラグジュアリーなセットが中心。'),
  ('LANスタジオ', '関西', '大阪・弁天町',
   array['貸切','多シチュエーション'],
   '貸切・時間制（公式サイト参照）', 'https://hacostudio.com/studio/lan/price/',
   'ハコスタジオ系列の貸切型スタジオ。'),
  ('FORスタジオ', '関西', '大阪・弁天町',
   array['貸切','多シチュエーション'],
   '貸切・時間制（公式サイト参照）', 'https://hacostudio.com/studio/for/price/',
   'ハコスタジオ系列の貸切型スタジオ。'),
  ('LUZZ STUDIO', '関西', '大阪',
   array['貸切','ベッドあり','商用可'],
   '1時間単位・商用/個人同一料金（公式サイト参照）', 'https://luzz-studio.com/',
   '商用・個人とも同一料金の時間貸しレンタルスタジオ。5時間以上でベッドレンタル可。')
on conflict (name) do nothing;
