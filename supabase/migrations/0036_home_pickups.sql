-- =============================================================================
-- プルミエ！ 0036 — トップの「プルミエ！ピックアップ」コーナー
--   運営がキュレーションするレイヤーさん写真のショーケース（タップ導線なし）。
--   本人の同意を得た写真だけを運営が登録する運用（著作権・肖像権対策）。
--   画像は image_url（R2 の公開URL 等）で持ち、並び順は sort、is_active で出し分け。
-- =============================================================================

create table home_pickups (
  id         uuid primary key default gen_random_uuid(),
  image_url  text not null,             -- 表示する画像の公開URL（R2 等）
  caption    text,                       -- 任意のキャプション（レイヤー名/作品名など）
  sort       int not null default 0,     -- 小さいほど先に表示
  is_active  boolean not null default true,
  created_at timestamptz not null default now()
);
create index home_pickups_active_idx on home_pickups (is_active, sort);

-- 誰でも閲覧可（有効なものだけ）。ホームは要ログインだが匿名selectも許可しておく。
alter table home_pickups enable row level security;
create policy home_pickups_select on home_pickups for select using (is_active);

-- 書き込みは運営のみ。RLS の書き込みポリシーは付けず、SQL Editor（サービスロール＝
-- RLS バイパス）からの登録・更新・削除に限定する。アプリ側からは書き込めない。
