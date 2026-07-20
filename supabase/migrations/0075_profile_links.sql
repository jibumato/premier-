-- =============================================================================
-- プルミエ！ 0075 — プロフィールの外部リンク集約（活動ホーム化）
--   レイヤーが SNS・支援サービス（X/pixiv/Fantia/BOOTH 等）のリンクを
--   1枚のプロフィールにまとめられるようにする。プルミエを「活動の名刺／
--   ホーム」にし、収益は各自の好きな出口（Fantia 等）へ送客する方針の土台。
--
--   形式は JSONB 配列（notification_prefs と同じく profiles に持たせる）:
--     [{ "type": "fantia", "url": "https://fantia.jp/..." }, ...]
--   ・type はクライアント側の既知サービスキー、url は http(s) のみ（整形は
--     クライアントで実施）。配列であること・件数上限だけ DB でも担保する。
--   ・支援（Fantia/FANBOX/BOOTH/Skeb）系リンクは、閲覧者が年齢確認済みの
--     ときだけ表示する（既存のゾーニング方針を踏襲。表示制御はクライアント）。
-- =============================================================================

-- 冪等化: 既に links カラムが存在する環境でも再実行できるようにする
-- （add column if not exists＋check制約は名前を付けて条件付きで追加）。
alter table profiles add column if not exists links jsonb not null default '[]'::jsonb;

do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'profiles_links_check') then
    alter table profiles
      add constraint profiles_links_check
      check (jsonb_typeof(links) = 'array' and jsonb_array_length(links) <= 12);
  end if;
end $$;
