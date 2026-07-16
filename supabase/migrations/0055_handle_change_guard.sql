-- =============================================================================
-- プルミエ！ 0055 — @ユーザーネーム変更のなりすまし・乱用対策
--   0054 で @ユーザーネームの本人編集を解禁したことに伴い、以下をDBトリガーで
--   強制する（クライアントを経由しないAPI直叩きでも回避できないように）。
--     ① 予約語ブロック: admin/official/staff など運営を騙る文字列を含む
--        ユーザーネームへの変更を拒否（随時語彙を追加できるよう関数化）。
--     ② 変更クールダウン: 一度変更したら次の変更まで14日空ける（高速な
--        乗り換え・なりすまし切替を抑止）。サインアップ時の自動採番
--        （user_xxxxxxxx）から最初の実名変更をする分にはクールダウン対象外
--        （handle_changed_at が未設定＝初回のため）。
--   冪等（create or replace function / drop + create trigger、再実行安全）。
-- =============================================================================

alter table profiles add column if not exists handle_changed_at timestamptz;

create or replace function handle_is_reserved(p_handle text)
returns boolean
language sql
immutable
as $$
  select p_handle ~ '(admin|official|staff|support|premier|moderator|operator|unei|verified|security)'
$$;

create or replace function profiles_guard_handle_change()
returns trigger
language plpgsql
as $$
begin
  if new.handle is distinct from old.handle then
    if handle_is_reserved(new.handle) then
      raise exception 'handle is reserved';
    end if;
    if old.handle_changed_at is not null and now() - old.handle_changed_at < interval '14 days' then
      raise exception 'handle change cooldown active';
    end if;
    new.handle_changed_at := now();
  end if;
  return new;
end;
$$;

drop trigger if exists profiles_guard_handle_change_trigger on profiles;
create trigger profiles_guard_handle_change_trigger
  before update on profiles
  for each row
  execute function profiles_guard_handle_change();
