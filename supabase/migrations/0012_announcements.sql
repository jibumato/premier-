-- =============================================================================
-- プルミエ！ — 運営お知らせ / 更新履歴 (announcements)
--   運営（＝サービス側）が投稿する「お知らせ・更新履歴」。ユーザーは閲覧のみ。
--   投稿・編集・削除は運営が Supabase ダッシュボード（service_role）から行う想定
--   なので、authenticated 向けの insert/update/delete ポリシーは意図的に作らない。
--   （KYC 承認と同じく、デプロイなしで運用できるように DB 直投稿とする。）
-- =============================================================================

create table announcements (
  id           uuid primary key default gen_random_uuid(),
  category     text not null default 'update',   -- 'update' | 'news' | 'maintenance'
  title        text not null,
  body         text not null default '',
  published_at timestamptz not null default now()
);
create index announcements_published_idx on announcements (published_at desc);

-- =============================================================================
-- Row Level Security
--   全員が閲覧可能。書き込みポリシーは無し（＝一般ユーザーは書き込み不可）。
--   運営は service_role キーで RLS を迂回して投稿する。
-- =============================================================================
alter table announcements enable row level security;

create policy announcements_select on announcements for select using (true);

-- ---- 初期のお知らせ（呼び水）。運営が後から編集・追加できる。
insert into announcements (category, title, body, published_at) values
  (
    'news',
    'プルミエ！を公開しました🎉',
    'コスプレの「併せ（合わせ）」を安心してつくれるサービス、プルミエ！を公開しました。作品・キャラクターから仲間を探して、募集・応募・メッセージのやり取りができます。まずはプロフィールを整えて、気になる募集に参加してみてください。',
    now() - interval '2 days'
  ),
  (
    'update',
    'PC（パソコン）表示に対応しました',
    'パソコンのブラウザでも見やすいレイアウトに対応しました。スマートフォンと同じアカウントで、どちらからでもご利用いただけます。',
    now() - interval '1 day'
  ),
  (
    'update',
    '本人確認バッジを導入しました',
    '本人確認（任意）を行うと、プロフィールに確認済みバッジが表示されるようになりました。安心して交流していただくための機能です。設定 →「本人確認」からお手続きいただけます。',
    now()
  );
