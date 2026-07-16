-- =============================================================================
-- プルミエ！ 0056 — 投稿写真の作品タグ（みんなの投稿フィードの下ごしらえ）
--   ユーザーが投稿した写真（posts）を、プロフィールのギャラリー以外の場所
--   （ホームの「みんなの投稿」・検索の「写真」タブ）でも表示できるようにする。
--   表示の軸は「新着（デフォルト）」＋「任意の作品・キャラタグでの絞り込み」。
--   タグは投稿者が任意で付ける（既存の awase.work_id と同じ works 参照）。
--   RLS（0005 posts_select）は既存のまま変更不要 — 非公開/ブロック等の除外は
--   既にそこで担保されているため、新しいフィード用クエリもそのまま安全に使える。
--   冪等（add column if not exists、再実行安全）。
-- =============================================================================

alter table posts add column if not exists work_id uuid references works (id) on delete set null;
create index if not exists posts_work_idx on posts (work_id) where work_id is not null;
