-- =============================================================================
-- プルミエ！ 0066 — 関東・東海・北海道・北関東の追加未開催イベント
--   コスコン（cos-compass.com）の全国コスプレイベント一覧ページから、
--   2026-07-19以降でまだ開催されていないもの（0061/0062/0064と重複しない分）
--   を抽出して登録する。会場名の明記がない形式のため、イベント名からの
--   推測 or 運営元名をvenueとして代用した行が多い。詳細は body 内の
--   参照URLで各自ご確認を。同一イベントが複数日程に渡る場合は「・」区切り/
--   範囲表記で1行にまとめた。ページソースを確認した限り不審な仕込みは
--   見当たらなかった。北海道の一部イベントは市区町村が特定できず
--   region="北海道"（都道府県レベル）とした。冪等（on conflict do nothing）。
-- =============================================================================

insert into events (name, event_date, venue, region, tag, fee_text, body) values
  (
    'ラッパーよ集え！',
    '7/25(土)',
    'COSNAVI',
    '東京',
    '撮影イベント',
    '主催者の告知を確認（SNS等）',
    'COSNAVI（東京）で開催されるコスプレイベント。開催時間は9:30~20:30。詳細: https://cosnavi.biz/mtssb_article/rapper-off/'
  ),
  (
    'TRCオンリーライブ2026 Jul.26',
    '7/26(日)',
    'スタジオYOU',
    '東京',
    '撮影イベント',
    '主催者の告知を確認（SNS等）',
    'スタジオYOU（東京）で開催されるコスプレイベント。詳細: https://www.youyou.co.jp/index.html'
  ),
  (
    'COS-MIX! in 立川',
    '8/8(土)〜8/9(日)',
    '立川',
    '東京',
    '撮影イベント',
    '主催者の告知を確認（SNS等）',
    '立川（東京）で開催されるコスプレイベント。主催: COS-MIX！。開催時間は9:45~16:00。詳細: https://cos-mix.jimdofree.com/%E7%AB%8B%E5%B7%9D/'
  ),
  (
    'Wiz at みらい館',
    '8/9(日)・8/11(火)・8/22(土)・8/29(土)',
    'みらい館',
    '東京',
    '撮影イベント',
    '主催者の告知を確認（SNS等）',
    'みらい館（東京）で開催されるコスプレイベント。主催: Wizard Wand。詳細: http://www.wizardwand.co.jp/event/event_mirai.html'
  ),
  (
    'club本丸',
    '8/22(土)',
    'COSNAVI',
    '東京',
    '撮影イベント',
    '主催者の告知を確認（SNS等）',
    'COSNAVI（東京）で開催されるコスプレイベント。開催時間は10:00~20:00。詳細: https://cosnavi.biz/8ruh'
  ),
  (
    'COSSAN at アクアシティお台場',
    '8/30(日)',
    'アクアシティお台場',
    '東京',
    '撮影イベント',
    '主催者の告知を確認（SNS等）',
    'アクアシティお台場（東京）で開催されるコスプレイベント。主催: COSSAN。詳細: https://x.com/COSPLAYCOSSAN/status/2065014784689639475'
  ),
  (
    'ココフリin川崎大師風鈴市',
    '7/17(金)〜7/19(日)',
    'COCOFURI',
    '神奈川',
    '撮影イベント',
    '主催者の告知を確認（SNS等）',
    'COCOFURI（神奈川）で開催されるコスプレイベント。開催時間は10:30~15:15。詳細: https://cocofuri.net/basic11/fuurinichi/index.html'
  ),
  (
    '元祖・CNSコスプレイベント 復刻版企画（CNSひまわりの収穫祭）',
    '7/25(土)',
    'CNS produce',
    '神奈川',
    '撮影イベント',
    '主催者の告知を確認（SNS等）',
    'CNS produce（神奈川）で開催されるコスプレイベント。開催時間は10:00~17:00。詳細: https://www.cns-produce.com/event-details/ganso-cnskosupureibento-fukkokubankikaku-cnshimawarinoshukakusai'
  ),
  (
    '旧篠原小学校 夜遊び企画 花火',
    '8/2(日)・8/29(土)',
    'CNS produce',
    '神奈川',
    '撮影イベント',
    '主催者の告知を確認（SNS等）',
    'CNS produce（神奈川）で開催されるコスプレイベント。開催時間は14:00~20:00。詳細: https://www.cns-produce.com/event-details/kyushinoharashogakko-yoasobikikaku-hanabi-2'
  ),
  (
    'CNS交流会（CNSひまわりの収穫祭＋）',
    '8/8(土)',
    'CNS produce',
    '神奈川',
    '撮影イベント',
    '主催者の告知を確認（SNS等）',
    'CNS produce（神奈川）で開催されるコスプレイベント。開催時間は10:00~17:00。詳細: https://www.cns-produce.com/event-details/cnskoryukai-cnshimawarinoshukakusaitasu'
  ),
  (
    '江ノ島コスプレ祭（えのこす）',
    '8/29(土)〜8/30(日)',
    'Cosplay Blue',
    '神奈川',
    '撮影イベント',
    '主催者の告知を確認（SNS等）',
    'Cosplay Blue（神奈川）で開催されるコスプレイベント。詳細: http://cosblue.net/'
  ),
  (
    '稲毛海浜公園',
    '7/4(土)・7/5(日)・7/26(日)・8/1(土)・8/8(土)・8/15(土)・8/22(土)・8/23(日)・8/30(日)',
    'えざき舎',
    '千葉',
    '撮影イベント',
    '主催者の告知を確認（SNS等）',
    'えざき舎（千葉）で開催されるコスプレイベント。開催時間は10:00~16:15。詳細: https://ezakisya.web.fc2.com/inageevent.html'
  ),
  (
    '稲毛海浜公園 コスプレイベント',
    '9/6(日)・9/13(日)・9/19(土)・9/20(日)',
    '稲毛海浜公園',
    '千葉',
    '撮影イベント',
    '主催者の告知を確認（SNS等）',
    '稲毛海浜公園（千葉）で開催されるコスプレイベント。主催: えざき舎。詳細: https://ezakisya.web.fc2.com/inageevent.html'
  ),
  (
    '和風の会 in 愛宕',
    '7/12(日)・7/19(日)・7/20(月)・7/26(日)・8/23(日)・8/29(土)・8/30(日)',
    '愛宕',
    '埼玉',
    '撮影イベント',
    '主催者の告知を確認（SNS等）',
    '愛宕（埼玉）で開催されるコスプレイベント。主催: COS-MIX！。開催時間は9:45~16:30。詳細: https://cos-mix.jimdofree.com/%E5%92%8C%E9%A2%A8%E3%81%AE%E4%BC%9A-%E6%84%9B%E5%AE%95/'
  ),
  (
    'COS-MIX! in 進修館',
    '7/12(日)・7/19(日)・8/2(日)',
    '進修館',
    '埼玉',
    '撮影イベント',
    '主催者の告知を確認（SNS等）',
    '進修館（埼玉）で開催されるコスプレイベント。主催: COS-MIX！。開催時間は10:15~16:30。詳細: https://cos-mix.jimdofree.com/%E9%80%B2%E4%BF%AE%E9%A4%A8/'
  ),
  (
    '和風の会 in 産業',
    '7/20(月)',
    '産業',
    '埼玉',
    '撮影イベント',
    '主催者の告知を確認（SNS等）',
    '産業（埼玉）で開催されるコスプレイベント。主催: COS-MIX！。開催時間は10:30~16:30。詳細: https://cos-mix.jimdofree.com/%E5%92%8C%E9%A2%A8%E3%81%AE%E4%BC%9A-%E7%94%A3%E6%A5%AD/'
  ),
  (
    '渋ビルコスプレDAY',
    '7/20(月)・8/30(日)',
    '中産連ビルディング株式会社',
    '愛知',
    '撮影イベント',
    '主催者の告知を確認（SNS等）',
    '中産連ビルディング株式会社（愛知）で開催されるコスプレイベント。開催時間は9:00～17:00。詳細: https://chusanrenbldg.co.jp/info/pg1530.html'
  ),
  (
    'もりコス',
    '8/15(土)〜8/16(日)',
    'まにコス',
    '愛知',
    '撮影イベント',
    '主催者の告知を確認（SNS等）',
    'まにコス（愛知）で開催されるコスプレイベント。詳細: https://x.com/maniadocosplay/status/2052840535648530805?s=20'
  ),
  (
    '豪邸と温泉とプール(熱海市)',
    '8/23(日)・8/30(日)',
    'コスナビ',
    '静岡',
    '撮影イベント',
    '主催者の告知を確認（SNS等）',
    'コスナビ（静岡）で開催されるコスプレイベント。詳細: https://cosnavi.biz/mtssb_article/goutei-atami-pool/'
  ),
  (
    '豪邸と温泉とプール（熱海市）',
    '9/13(日)',
    'コスナビ',
    '静岡',
    '撮影イベント',
    '主催者の告知を確認（SNS等）',
    'コスナビ（静岡）で開催されるコスプレイベント。詳細: https://cosnavi.biz/'
  ),
  (
    'ウイングベイコスプレフェスウイコス16',
    '8/1(土)〜8/2(日)',
    'あめいず村',
    '北海道',
    '撮影イベント',
    '主催者の告知を確認（SNS等）',
    'あめいず村（北海道）で開催されるコスプレイベント。開催時間は10:30~18:30。詳細: https://x.com/ameizumura/status/2044097916210721177?s=20'
  ),
  (
    '中島公園コスプレイベント ジマコス',
    '8/11(火)',
    'あめいず村',
    '北海道',
    '撮影イベント',
    '主催者の告知を確認（SNS等）',
    'あめいず村（北海道）で開催されるコスプレイベント。詳細: https://x.com/ameizumura/status/2044097916210721177?s=20'
  ),
  (
    'コスプレ大海水浴',
    '8/23(日)',
    'あめいず村',
    '北海道',
    '撮影イベント',
    '主催者の告知を確認（SNS等）',
    'あめいず村（北海道）で開催されるコスプレイベント。詳細: https://x.com/ameizumura/status/2044097916210721177?s=20'
  ),
  (
    'トカコス4',
    '9/5(土)〜9/6(日)',
    'トカコス実行委員会',
    '北海道',
    '撮影イベント',
    '主催者の告知を確認（SNS等）',
    'トカコス実行委員会（北海道）で開催されるコスプレイベント。詳細: https://x.com/Toka_cos_akanko/status/2025843348905533687?s=20'
  ),
  (
    '小樽アニメパーティー2026',
    '9/5(土)〜9/6(日)',
    '小樽アニメパーティー実行委員会',
    '北海道',
    '撮影イベント',
    '主催者の告知を確認（SNS等）',
    '小樽アニメパーティー実行委員会（北海道）で開催されるコスプレイベント。詳細: https://otaru-anime.com/'
  ),
  (
    '新さっぽろコスプレフェスタ４',
    '9/12(土)〜9/13(日)',
    '新さっぽろコスプレフェスタ',
    '北海道',
    '撮影イベント',
    '主催者の告知を確認（SNS等）',
    '新さっぽろコスプレフェスタ（北海道）で開催されるコスプレイベント。詳細: https://x.com/shinsatsucos/status/2019806494049624517?s=20'
  ),
  (
    '第14幕 「とまこまいコスプレフェスタ」',
    '11/7(土)〜11/8(日)',
    'とまこまいコスプレフェスタ実行委員会',
    '北海道',
    '撮影イベント',
    '主催者の告知を確認（SNS等）',
    'とまこまいコスプレフェスタ実行委員会（北海道）で開催されるコスプレイベント。詳細: https://tomakomai-cos-fes.com/'
  ),
  (
    'きらこす(夏)',
    '8/8(土)〜8/9(日)',
    'きらこす',
    '茨城',
    '撮影イベント',
    '主催者の告知を確認（SNS等）',
    'きらこす（茨城）で開催されるコスプレイベント。詳細: https://x.com/__kiracos__/status/2061414523840709111?s=20'
  )
on conflict (name) do nothing;

update events set starts_on = date '2026-07-25' where name = 'ラッパーよ集え！';
update events set starts_on = date '2026-07-26' where name = 'TRCオンリーライブ2026 Jul.26';
update events set starts_on = date '2026-08-08' where name = 'COS-MIX! in 立川';
update events set starts_on = date '2026-08-09' where name = 'Wiz at みらい館';
update events set starts_on = date '2026-08-22' where name = 'club本丸';
update events set starts_on = date '2026-08-30' where name = 'COSSAN at アクアシティお台場';
update events set starts_on = date '2026-07-17' where name = 'ココフリin川崎大師風鈴市';
update events set starts_on = date '2026-07-25' where name = '元祖・CNSコスプレイベント 復刻版企画（CNSひまわりの収穫祭）';
update events set starts_on = date '2026-08-02' where name = '旧篠原小学校 夜遊び企画 花火';
update events set starts_on = date '2026-08-08' where name = 'CNS交流会（CNSひまわりの収穫祭＋）';
update events set starts_on = date '2026-08-29' where name = '江ノ島コスプレ祭（えのこす）';
update events set starts_on = date '2026-07-04' where name = '稲毛海浜公園';
update events set starts_on = date '2026-09-06' where name = '稲毛海浜公園 コスプレイベント';
update events set starts_on = date '2026-07-12' where name = '和風の会 in 愛宕';
update events set starts_on = date '2026-07-12' where name = 'COS-MIX! in 進修館';
update events set starts_on = date '2026-07-20' where name = '和風の会 in 産業';
update events set starts_on = date '2026-07-20' where name = '渋ビルコスプレDAY';
update events set starts_on = date '2026-08-15' where name = 'もりコス';
update events set starts_on = date '2026-08-23' where name = '豪邸と温泉とプール(熱海市)';
update events set starts_on = date '2026-09-13' where name = '豪邸と温泉とプール（熱海市）';
update events set starts_on = date '2026-08-01' where name = 'ウイングベイコスプレフェスウイコス16';
update events set starts_on = date '2026-08-11' where name = '中島公園コスプレイベント ジマコス';
update events set starts_on = date '2026-08-23' where name = 'コスプレ大海水浴';
update events set starts_on = date '2026-09-05' where name = 'トカコス4';
update events set starts_on = date '2026-09-05' where name = '小樽アニメパーティー2026';
update events set starts_on = date '2026-09-12' where name = '新さっぽろコスプレフェスタ４';
update events set starts_on = date '2026-11-07' where name = '第14幕 「とまこまいコスプレフェスタ」';
update events set starts_on = date '2026-08-08' where name = 'きらこす(夏)';
