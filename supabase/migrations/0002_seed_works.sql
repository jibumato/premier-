-- Seed the initial `works` catalogue (mirrors src/lib/data.ts `works`).
-- Idempotent: safe to re-run.
insert into works (name) values
  ('葬送のフリーレン'),
  ('鬼滅の刃'),
  ('SPY×FAMILY'),
  ('呪術廻戦'),
  ('原神'),
  ('ブルーアーカイブ')
on conflict (name) do nothing;
