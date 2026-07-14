-- 0034_chat_images.sql
-- メッセージ（DM・グループチャット共通）で画像を送れるようにする
--
-- messages に image_url を追加し、「画像だけの送信」（本文なし）を許可するよう
-- body の制約を緩和する。アップロードは既存の R2 基盤（/api/upload, kind='chat'）
-- を利用。閲覧/送信の RLS は既存の is_conversation_member() がそのまま効く。

alter table messages add column if not exists image_url text;

-- 旧: body は 1〜2000 文字必須 → 新: 2000 文字以内で、本文が空なら画像必須
alter table messages drop constraint if exists messages_body_check;
alter table messages add constraint messages_body_check
  check (char_length(body) <= 2000 and (char_length(body) >= 1 or image_url is not null));
