-- =============================================================================
-- プルミエ！ 0065 — 関西・東北・中国四国・九州沖縄の未開催イベントを追加
--   コスコン（cos-compass.com）の全国コスプレイベント一覧ページから、
--   2026-07-19以降でまだ開催されていないものを抽出して登録する。
--   このページ形式は会場名の明記がなく、イベント名からの推測 or 運営元名を
--   venueとして代用した行が多い。詳細は body 内の参照URLで各自ご確認を。
--   既存DBのacosta!系・コミックマーケット108・世界コスプレサミット2026・
--   COMIC CITY VEGA 2026・ラブスピ安城とは重複除外済み。
--   同一イベントが複数日程に渡る場合は「・」区切り/範囲表記で1行にまとめた。
--   ページソースを確認した限り不審な仕込みは見当たらなかった。
--   region未登録だった東北6県（青森・岩手・宮城・秋田・山形・福島）・
--   長崎・沖縄・山口・香川・徳島・和歌山をREGION_TO_AREAに追加する想定。
--   冪等（on conflict do nothing）。
-- =============================================================================

insert into events (name, event_date, venue, region, tag, fee_text, body) values
  (
    'コスメルinコスモタワー',
    '7/5(日)・7/20(月)・8/2(日)・8/11(火)・8/30(日)',
    'コスメル',
    '大阪',
    '撮影イベント',
    '主催者の告知を確認（SNS等）',
    'コスメル（大阪）で開催されるコスプレイベント。詳細: https://cosmel.link/csm.html'
  ),
  (
    'おどつなげーみんぐ４',
    '7/20(月)',
    'おどつな！',
    '大阪',
    '撮影イベント',
    '主催者の告知を確認（SNS等）',
    'おどつな！（大阪）で開催されるコスプレイベント。詳細: https://www.odotsuna.com/game'
  ),
  (
    '【コスパフォ募集あり！】アニメメメステージ7',
    '7/25(土)',
    'アニメメメ／株式会社アブストリームクリエイション',
    '大阪',
    '撮影イベント',
    '主催者の告知を確認（SNS等）',
    'アニメメメ／株式会社アブストリームクリエイション（大阪）で開催されるコスプレイベント。開催時間は11:30～21:00（更衣室利用可能時間：10:00～22:00）。詳細: https://www.animememe.net/st7'
  ),
  (
    '関西オンリーフェスタ2026 Jul.25',
    '7/25(土)',
    'スタジオYOU',
    '大阪',
    '撮影イベント',
    '主催者の告知を確認（SNS等）',
    'スタジオYOU（大阪）で開催されるコスプレイベント。詳細: https://www.youyou.co.jp/index.html'
  ),
  (
    'COSJOY大阪 ハーベストの丘',
    '7/25(土)〜7/26(日)',
    'COSJOY',
    '大阪',
    '撮影イベント',
    '主催者の告知を確認（SNS等）',
    'COSJOY（大阪）で開催されるコスプレイベント。詳細: https://cos-cam.work/?page_id=2&eventid=4352'
  ),
  (
    'アニメメメオーサカ 9 夏祭り編',
    '8/8(土)',
    'アニメメメ',
    '大阪',
    '撮影イベント',
    '主催者の告知を確認（SNS等）',
    'アニメメメ（大阪）で開催されるコスプレイベント。詳細: https://www.animememe.net/os9'
  ),
  (
    'おどつな！Vol.86',
    '8/11(火)',
    'おどつな！',
    '大阪',
    '撮影イベント',
    '主催者の告知を確認（SNS等）',
    'おどつな！（大阪）で開催されるコスプレイベント。詳細: https://www.odotsuna.com/vol86'
  ),
  (
    'GOOD COMIC CITY 大阪32 夏のオールジャンル 同人誌即売会',
    '8/23(日)',
    '赤ブーブー通信社',
    '大阪',
    '大型',
    '公式サイトを確認',
    '赤ブーブー通信社（大阪）で開催されるコスプレイベント。詳細: https://www.akaboo.jp/event/item/20204841.html'
  ),
  (
    '住之江公園プールイベント',
    '8/26(水)〜8/31(月)',
    '住之江公園プール',
    '大阪',
    '撮影イベント',
    '主催者の告知を確認（SNS等）',
    '住之江公園プール（大阪）で開催されるコスプレイベント。主催: ラコロール。開催時間は10:00~17:00。詳細: https://lacorolle2000.wixsite.com/lacorolle-web/suminoe-5'
  ),
  (
    '住之江プールイベント',
    '9/1(火)',
    '住之江プール',
    '大阪',
    '撮影イベント',
    '主催者の告知を確認（SNS等）',
    '住之江プール（大阪）で開催されるコスプレイベント。主催: ラコロール。詳細: https://lacorolle2000.wixsite.com/lacorolle-web/suminoe-5'
  ),
  (
    'こみっく★トレジャー48',
    '9/6(日)',
    '青ブーブー通信社',
    '大阪',
    '大型',
    '公式サイトを確認',
    '青ブーブー通信社（大阪）で開催されるコスプレイベント。詳細: https://www.aoboo.jp/'
  ),
  (
    'プール潜水撮影イベント',
    '9/19(土)',
    'プール潜水',
    '大阪',
    '撮影イベント',
    '主催者の告知を確認（SNS等）',
    'プール潜水（大阪）で開催されるコスプレイベント。主催: ラコロール。詳細: https://lacorolle2000.wixsite.com/lacorolle-web'
  ),
  (
    '穂谷里山ロケ 彼岸花',
    '9/23(水)・9/26(土)',
    'ラコロール',
    '大阪',
    '撮影イベント',
    '主催者の告知を確認（SNS等）',
    'ラコロール（大阪）で開催されるコスプレイベント。詳細: https://lacorolle2000.wixsite.com/lacorolle-web'
  ),
  (
    '住之江公園 彼岸花',
    '9/27(日)',
    'ラコロール',
    '大阪',
    '撮影イベント',
    '主催者の告知を確認（SNS等）',
    'ラコロール（大阪）で開催されるコスプレイベント。詳細: https://lacorolle2000.wixsite.com/lacorolle-web'
  ),
  (
    'JPCC寝屋川公園',
    '9/27(日)',
    '一般社団法人日本コスプレ委員会',
    '大阪',
    '撮影イベント',
    '主催者の告知を確認（SNS等）',
    '一般社団法人日本コスプレ委員会（大阪）で開催されるコスプレイベント。詳細: https://jpcc.or.jp/event/neyagawa_park/'
  ),
  (
    'コスメルin淡路夢舞台',
    '7/19(日)',
    'コスメル',
    '兵庫',
    '撮影イベント',
    '主催者の告知を確認（SNS等）',
    'コスメル（兵庫）で開催されるコスプレイベント。開催時間は10:30~17:00。詳細: https://cosmel.link/awajiyumebutai.html'
  ),
  (
    'コスメル in 旧二葉小学校',
    '7/25(土)・7/26(日)・8/23(日)',
    '旧二葉小学校',
    '兵庫',
    '撮影イベント',
    '主催者の告知を確認（SNS等）',
    '旧二葉小学校（兵庫）で開催されるコスプレイベント。主催: コスメル。開催時間は10:00~16:30。詳細: https://cosmel.link/ftb.html'
  ),
  (
    'あぼしまち交流館 With キッズフェスティバル',
    '7/26(日)',
    'color party',
    '兵庫',
    '撮影イベント',
    '主催者の告知を確認（SNS等）',
    'color party（兵庫）で開催されるコスプレイベント。開催時間は10:00~17:00。詳細: https://cp.piece-zero.com/abosi_s.html'
  ),
  (
    '明石公園コスプレイベント',
    '7/26(日)・8/16(日)',
    '明石公園',
    '兵庫',
    '撮影イベント',
    '主催者の告知を確認（SNS等）',
    '明石公園（兵庫）で開催されるコスプレイベント。主催: BeeCoss。開催時間は10:00〜16:00。詳細: https://x.com/event_SIN/status/2050380078899696008#m'
  ),
  (
    'かみこす! at アミュスタ神戸',
    '8/2(日)',
    'アミュスタ神戸',
    '兵庫',
    '撮影イベント',
    '主催者の告知を確認（SNS等）',
    'アミュスタ神戸（兵庫）で開催されるコスプレイベント。主催: かみこす！。詳細: https://x.com/kobekamicos/status/2052604961922695387?s=20'
  ),
  (
    '夏の淡路島洲本撮影会海ロケ',
    '8/11(火)',
    'ラコロール',
    '兵庫',
    '撮影イベント',
    '主催者の告知を確認（SNS等）',
    'ラコロール（兵庫）で開催されるコスプレイベント。開催時間は12:00～18:00。詳細: https://lacorolle2000.wixsite.com/lacorolle-web/sumoto15'
  ),
  (
    'コスメル in 淡路夢舞台',
    '8/29(土)',
    '淡路夢舞台',
    '兵庫',
    '撮影イベント',
    '主催者の告知を確認（SNS等）',
    '淡路夢舞台（兵庫）で開催されるコスプレイベント。主催: コスメル。開催時間は10:30~17:00。詳細: https://cosmel.link/awajiyumebutai.html'
  ),
  (
    '京都 舞鶴赤れんがパーク',
    '7/19(日)',
    'COSJOY',
    '京都',
    '撮影イベント',
    '主催者の告知を確認（SNS等）',
    'COSJOY（京都）で開催されるコスプレイベント。詳細: http://www.comicon.co.jp/cosjoy/akarengaindex.html'
  ),
  (
    'ラコロール 京都府庁旧本館',
    '9/21(月)',
    'ラコロール',
    '京都',
    '撮影イベント',
    '主催者の告知を確認（SNS等）',
    'ラコロール（京都）で開催されるコスプレイベント。詳細: https://lacorolle2000.wixsite.com/lacorolle-web'
  ),
  (
    '余呉の集落 紫陽花',
    '7/19(日)',
    'ラコロール',
    '滋賀',
    '撮影イベント',
    '主催者の告知を確認（SNS等）',
    'ラコロール（滋賀）で開催されるコスプレイベント。詳細: https://lacorolle2000.wixsite.com/lacorolle-web/nakanokawachi2'
  ),
  (
    'コスメル in大津街中',
    '8/8(土)',
    'コスメル',
    '滋賀',
    '撮影イベント',
    '主催者の告知を確認（SNS等）',
    'コスメル（滋賀）で開催されるコスプレイベント。開催時間は10:00~17:00。詳細: https://cosmel.link/ootu.html'
  ),
  (
    '南紀白浜プール&海ロケイベント',
    '7/25(土)',
    '南紀白浜プール&海ロケ',
    '和歌山',
    '撮影イベント',
    '主催者の告知を確認（SNS等）',
    '南紀白浜プール&海ロケ（和歌山）で開催されるコスプレイベント。主催: ラコロール。開催時間は15:00～翌9:00。詳細: https://x.com/family_auto_ky/status/2043915057994838154?s=20'
  ),
  (
    '加太海水浴場',
    '9/5(土)',
    'ラコロール',
    '和歌山',
    '撮影イベント',
    '主催者の告知を確認（SNS等）',
    'ラコロール（和歌山）で開催されるコスプレイベント。詳細: https://lacorolle2000.wixsite.com/lacorolle-web'
  ),
  (
    '白野江廃校コスプレ部',
    '7/13(月)・7/16(木)・7/27(月)',
    '白野江廃校コスプレ部',
    '福岡',
    '撮影イベント',
    '主催者の告知を確認（SNS等）',
    '白野江廃校コスプレ部（福岡）で開催されるコスプレイベント。開催時間は11:00~18:00。詳細: https://x.com/shiranoe_haiko/status/1933488058885943696'
  ),
  (
    'BeeRUSH 大名店コスプレイベント',
    '8/15(土)',
    'BeeRUSH 大名店',
    '福岡',
    '撮影イベント',
    '主催者の告知を確認（SNS等）',
    'BeeRUSH 大名店（福岡）で開催されるコスプレイベント。主催: コスミクCosMix。詳細: https://x.com/CosMix_Event/status/2063214835714883902'
  ),
  (
    'USAGI BOMB-BA-YE',
    '8/1(土)〜8/2(日)',
    'コスプレ御免',
    '熊本',
    '撮影イベント',
    '主催者の告知を確認（SNS等）',
    'コスプレ御免（熊本）で開催されるコスプレイベント。詳細: https://x.com/cosplaygomen/status/2064319829629362520'
  ),
  (
    'コストラチャペルin森の教会 CandleNight',
    '8/1(土)',
    'PopTownProject',
    '熊本',
    '撮影イベント',
    '主催者の告知を確認（SNS等）',
    'PopTownProject（熊本）で開催されるコスプレイベント。詳細: https://ptp.fun/'
  ),
  (
    'アミュコス',
    '8/22(土)〜8/23(日)',
    'PopTownProject',
    '熊本',
    '撮影イベント',
    '主催者の告知を確認（SNS等）',
    'PopTownProject（熊本）で開催されるコスプレイベント。詳細: https://x.com/ptp1631/status/2058157278029881744'
  ),
  (
    '長崎新聞社アストピア',
    '7/19(日)',
    'JACS',
    '長崎',
    '撮影イベント',
    '主催者の告知を確認（SNS等）',
    'JACS（長崎）で開催されるコスプレイベント。開催時間は13:00~19:00。詳細: https://jacs-cos.jimdofree.com/%E4%BC%9A%E5%A0%B4%E5%86%99%E7%9C%9F/%E9%95%B7%E5%B4%8E%E6%96%B0%E8%81%9E%E7%A4%BE%E3%82%A2%E3%82%B9%E3%83%88%E3%83%94%E3%82%A2/'
  ),
  (
    '気分は上々 同人誌即売会&コスプレイベント',
    '8/2(日)',
    '気分は上々',
    '長崎',
    '撮影イベント',
    '主催者の告知を確認（SNS等）',
    '気分は上々（長崎）で開催されるコスプレイベント。開催時間は11:00~15:00。詳細: https://kibunha-jj.net/'
  ),
  (
    '佐伯コスプレフェスタ',
    '8/29(土)',
    '佐伯コスプレフェスタ',
    '大分',
    '撮影イベント',
    '主催者の告知を確認（SNS等）',
    '佐伯コスプレフェスタ（大分）で開催されるコスプレイベント。詳細: https://x.com/saiki_cosfes/status/2062394468922446329'
  ),
  (
    'LTCコスプレボウリング',
    '7/25(土)',
    'ちゅらコス?',
    '沖縄',
    '撮影イベント',
    '主催者の告知を確認（SNS等）',
    'ちゅらコス?（沖縄）で開催されるコスプレイベント。開催時間は10:30～14:00。詳細: https://x.com/chura_cos/status/2057029783662567884?s=20'
  ),
  (
    '道の駅 ゆ〜さ浅虫',
    '8/14(金)',
    'マグコス',
    '青森',
    '撮影イベント',
    '主催者の告知を確認（SNS等）',
    'マグコス（青森）で開催されるコスプレイベント。詳細: https://x.com/mag_cos/status/2063885538428657998'
  ),
  (
    'CRUSH!75（奥州市）',
    '7/19(日)',
    'CRUSH!実行委員会',
    '岩手',
    '撮影イベント',
    '主催者の告知を確認（SNS等）',
    'CRUSH!実行委員会（岩手）で開催されるコスプレイベント。詳細: http://staff.cmcrush.net/'
  ),
  (
    'ぱれくら（コスプレ撮影会）',
    '8/22(土)',
    'CRUSH!実行委員会',
    '岩手',
    '撮影イベント',
    '主催者の告知を確認（SNS等）',
    'CRUSH!実行委員会（岩手）で開催されるコスプレイベント。詳細: http://staff.cmcrush.net/'
  ),
  (
    'コスプレGIG in イオンスーパーセンター一関',
    '9/20(日)・9/27(日)',
    'イオンスーパーセンター一関',
    '岩手',
    '撮影イベント',
    '主催者の告知を確認（SNS等）',
    'イオンスーパーセンター一関（岩手）で開催されるコスプレイベント。主催: ADVENTURES Project。詳細: https://adv-kikaku.com/'
  ),
  (
    '八木山ベニーランド',
    '7/26(日)',
    '仙台コスプレフェスティバル',
    '宮城',
    '撮影イベント',
    '主催者の告知を確認（SNS等）',
    '仙台コスプレフェスティバル（宮城）で開催されるコスプレイベント。詳細: https://cosfes.enjoy-cosplay.com/'
  ),
  (
    '秋田コス港 in 秋田市文化創造館',
    '8/29(土)',
    '秋田市文化創造館',
    '秋田',
    '撮影イベント',
    '主催者の告知を確認（SNS等）',
    '秋田市文化創造館（秋田）で開催されるコスプレイベント。主催: 秋田コス港。詳細: https://x.com/akitacosminato/status/2065278444553052333'
  ),
  (
    'おでかけライブin山形141',
    '8/2(日)',
    'スタジオYOU',
    '山形',
    '撮影イベント',
    '主催者の告知を確認（SNS等）',
    'スタジオYOU（山形）で開催されるコスプレイベント。開催時間は11:30~15:30。詳細: https://www.youyou.co.jp/allgenre/yamagata/20260802/'
  ),
  (
    '甑葉プラザ コスプレ祭',
    '8/9(日)',
    'NPO法人甑葉プラザネット',
    '山形',
    '撮影イベント',
    '主催者の告知を確認（SNS等）',
    'NPO法人甑葉プラザネット（山形）で開催されるコスプレイベント。詳細: https://x.com/shoyoplazanet/status/2023309785349955985'
  ),
  (
    'チェリーランドコスプレ 6th',
    '8/23(日)',
    'BLACK MOON',
    '山形',
    '撮影イベント',
    '主催者の告知を確認（SNS等）',
    'BLACK MOON（山形）で開催されるコスプレイベント。詳細: https://x.com/blaccck_Moon/status/2053385571993862278'
  ),
  (
    'やままるコスプレ in 東の杜',
    '8/29(土)',
    '東の杜',
    '山形',
    '撮影イベント',
    '主催者の告知を確認（SNS等）',
    '東の杜（山形）で開催されるコスプレイベント。主催: やままるコスプレ企画。詳細: https://yamamarumaru.base.shop/'
  ),
  (
    'コスプレGIGinカルチャーパーク123',
    '7/19(日)',
    'ADVENTURES Project',
    '福島',
    '撮影イベント',
    '主催者の告知を確認（SNS等）',
    'ADVENTURES Project（福島）で開催されるコスプレイベント。開催時間は9:30~16:00。詳細: https://adv-kikaku.com/archives/cosplays/gig260719'
  ),
  (
    'ＡＺＵＭＡキャラクターフェス',
    '8/1(土)',
    '福兎会',
    '福島',
    '撮影イベント',
    '主催者の告知を確認（SNS等）',
    '福兎会（福島）で開催されるコスプレイベント。詳細: https://x.com/fukutokai/status/2056307218879013184?s=20'
  ),
  (
    'コスビート国見',
    '8/8(土)',
    'コスビート国見',
    '福島',
    '撮影イベント',
    '主催者の告知を確認（SNS等）',
    'コスビート国見（福島）で開催されるコスプレイベント。詳細: https://x.com/cosbeatkunimi/status/2058474186767818940'
  ),
  (
    'みゆコス 夏ノ宵',
    '8/15(土)',
    '福兎会',
    '福島',
    '撮影イベント',
    '主催者の告知を確認（SNS等）',
    '福兎会（福島）で開催されるコスプレイベント。詳細: https://x.com/fukutokai/status/2061376211625103795'
  ),
  (
    '福兎会ＡＯＺ',
    '8/23(日)',
    '福兎会',
    '福島',
    '撮影イベント',
    '主催者の告知を確認（SNS等）',
    '福兎会（福島）で開催されるコスプレイベント。開催時間は12:00~16:00。詳細: https://orangecanvas.jp/fukutoaoz/'
  ),
  (
    'おのみち☆コスパルーザ2',
    '7/20(月)',
    'コスパルーザ実行委員会',
    '広島',
    '撮影イベント',
    '主催者の告知を確認（SNS等）',
    'コスパルーザ実行委員会（広島）で開催されるコスプレイベント。開催時間は10:00~17:00。詳細: https://x.com/cospalooza/status/2041022654854095096'
  ),
  (
    '広島コミケ264',
    '8/9(日)',
    'スタジオYOU',
    '広島',
    '撮影イベント',
    '主催者の告知を確認（SNS等）',
    'スタジオYOU（広島）で開催されるコスプレイベント。開催時間は11:30~15:30。詳細: https://www.youyou.co.jp/allgenre/hirosima/20260809/'
  ),
  (
    'はれコス ｉｎ 青佐鼻海岸 ２０２６Ｓｕｍｍｅｒ',
    '8/2(日)',
    'はれコス',
    '岡山',
    '撮影イベント',
    '主催者の告知を確認（SNS等）',
    'はれコス（岡山）で開催されるコスプレイベント。開催時間は9:00～20:00。詳細: https://harecos.jp/event-aosabana-beach'
  ),
  (
    '夏の星＆炎＆BBQ撮影イベント',
    '8/15(土)',
    '夏の星＆炎＆BBQ',
    '岡山',
    '撮影イベント',
    '主催者の告知を確認（SNS等）',
    '夏の星＆炎＆BBQ（岡山）で開催されるコスプレイベント。主催: 美作コスプレロケ撮事業部。詳細: https://x.com/bell_peal/status/2051662574685761779'
  ),
  (
    'はれステPremium2026Ultra',
    '8/29(土)〜8/30(日)',
    'はれコス',
    '岡山',
    '撮影イベント',
    '主催者の告知を確認（SNS等）',
    'はれコス（岡山）で開催されるコスプレイベント。詳細: https://x.com/harecos/status/2060733958279790661'
  ),
  (
    'こすおん！ @ フラワーランド',
    '7/19(日)',
    'フラワーランド',
    '山口',
    '撮影イベント',
    '主催者の告知を確認（SNS等）',
    'フラワーランド（山口）で開催されるコスプレイベント。主催: こすおん！。詳細: https://x.com/go5cafe/status/2054089766585725056'
  ),
  (
    'コスチャinイオンモール高松Vol.4.0',
    '7/19(日)',
    'cos-cha',
    '香川',
    '撮影イベント',
    '主催者の告知を確認（SNS等）',
    'cos-cha（香川）で開催されるコスプレイベント。開催時間は10:30～17:00。詳細: https://x.gd/3vg3z'
  ),
  (
    'こすぴっぴ',
    '7/25(土)',
    'こすぴっぴ',
    '香川',
    '撮影イベント',
    '主催者の告知を確認（SNS等）',
    'こすぴっぴ（香川）で開催されるコスプレイベント。開催時間は9:15~17:00。詳細: https://docs.google.com/forms/d/e/1FAIpQLSchQne30L4mNQrQf7VBR09vYEf9jobPNnBnzGXw_jQ6idR4lA/viewform'
  ),
  (
    'coscha in サンポート高松Vol5.0',
    '8/23(日)',
    'サンポート高松Vol5.0',
    '香川',
    '撮影イベント',
    '主催者の告知を確認（SNS等）',
    'サンポート高松Vol5.0（香川）で開催されるコスプレイベント。主催: cos-cha。詳細: https://x.gd/SV852'
  ),
  (
    'ウシコス in 阿南の夏まつり vol.4',
    '7/26(日)',
    '阿南の夏まつり vol.4',
    '徳島',
    '撮影イベント',
    '主催者の告知を確認（SNS等）',
    '阿南の夏まつり vol.4（徳島）で開催されるコスプレイベント。主催: ウシコス。詳細: https://x.com/anan_cosplay/status/2057358251566735676'
  )
on conflict (name) do nothing;

update events set starts_on = date '2026-07-05' where name = 'コスメルinコスモタワー';
update events set starts_on = date '2026-07-20' where name = 'おどつなげーみんぐ４';
update events set starts_on = date '2026-07-25' where name = '【コスパフォ募集あり！】アニメメメステージ7';
update events set starts_on = date '2026-07-25' where name = '関西オンリーフェスタ2026 Jul.25';
update events set starts_on = date '2026-07-25' where name = 'COSJOY大阪 ハーベストの丘';
update events set starts_on = date '2026-08-08' where name = 'アニメメメオーサカ 9 夏祭り編';
update events set starts_on = date '2026-08-11' where name = 'おどつな！Vol.86';
update events set starts_on = date '2026-08-23' where name = 'GOOD COMIC CITY 大阪32 夏のオールジャンル 同人誌即売会';
update events set starts_on = date '2026-08-26' where name = '住之江公園プールイベント';
update events set starts_on = date '2026-09-01' where name = '住之江プールイベント';
update events set starts_on = date '2026-09-06' where name = 'こみっく★トレジャー48';
update events set starts_on = date '2026-09-19' where name = 'プール潜水撮影イベント';
update events set starts_on = date '2026-09-23' where name = '穂谷里山ロケ 彼岸花';
update events set starts_on = date '2026-09-27' where name = '住之江公園 彼岸花';
update events set starts_on = date '2026-09-27' where name = 'JPCC寝屋川公園';
update events set starts_on = date '2026-07-19' where name = 'コスメルin淡路夢舞台';
update events set starts_on = date '2026-07-25' where name = 'コスメル in 旧二葉小学校';
update events set starts_on = date '2026-07-26' where name = 'あぼしまち交流館 With キッズフェスティバル';
update events set starts_on = date '2026-07-26' where name = '明石公園コスプレイベント';
update events set starts_on = date '2026-08-02' where name = 'かみこす! at アミュスタ神戸';
update events set starts_on = date '2026-08-11' where name = '夏の淡路島洲本撮影会海ロケ';
update events set starts_on = date '2026-08-29' where name = 'コスメル in 淡路夢舞台';
update events set starts_on = date '2026-07-19' where name = '京都 舞鶴赤れんがパーク';
update events set starts_on = date '2026-09-21' where name = 'ラコロール 京都府庁旧本館';
update events set starts_on = date '2026-07-19' where name = '余呉の集落 紫陽花';
update events set starts_on = date '2026-08-08' where name = 'コスメル in大津街中';
update events set starts_on = date '2026-07-25' where name = '南紀白浜プール&海ロケイベント';
update events set starts_on = date '2026-09-05' where name = '加太海水浴場';
update events set starts_on = date '2026-07-13' where name = '白野江廃校コスプレ部';
update events set starts_on = date '2026-08-15' where name = 'BeeRUSH 大名店コスプレイベント';
update events set starts_on = date '2026-08-01' where name = 'USAGI BOMB-BA-YE';
update events set starts_on = date '2026-08-01' where name = 'コストラチャペルin森の教会 CandleNight';
update events set starts_on = date '2026-08-22' where name = 'アミュコス';
update events set starts_on = date '2026-07-19' where name = '長崎新聞社アストピア';
update events set starts_on = date '2026-08-02' where name = '気分は上々 同人誌即売会&コスプレイベント';
update events set starts_on = date '2026-08-29' where name = '佐伯コスプレフェスタ';
update events set starts_on = date '2026-07-25' where name = 'LTCコスプレボウリング';
update events set starts_on = date '2026-08-14' where name = '道の駅 ゆ〜さ浅虫';
update events set starts_on = date '2026-07-19' where name = 'CRUSH!75（奥州市）';
update events set starts_on = date '2026-08-22' where name = 'ぱれくら（コスプレ撮影会）';
update events set starts_on = date '2026-09-20' where name = 'コスプレGIG in イオンスーパーセンター一関';
update events set starts_on = date '2026-07-26' where name = '八木山ベニーランド';
update events set starts_on = date '2026-08-29' where name = '秋田コス港 in 秋田市文化創造館';
update events set starts_on = date '2026-08-02' where name = 'おでかけライブin山形141';
update events set starts_on = date '2026-08-09' where name = '甑葉プラザ コスプレ祭';
update events set starts_on = date '2026-08-23' where name = 'チェリーランドコスプレ 6th';
update events set starts_on = date '2026-08-29' where name = 'やままるコスプレ in 東の杜';
update events set starts_on = date '2026-07-19' where name = 'コスプレGIGinカルチャーパーク123';
update events set starts_on = date '2026-08-01' where name = 'ＡＺＵＭＡキャラクターフェス';
update events set starts_on = date '2026-08-08' where name = 'コスビート国見';
update events set starts_on = date '2026-08-15' where name = 'みゆコス 夏ノ宵';
update events set starts_on = date '2026-08-23' where name = '福兎会ＡＯＺ';
update events set starts_on = date '2026-07-20' where name = 'おのみち☆コスパルーザ2';
update events set starts_on = date '2026-08-09' where name = '広島コミケ264';
update events set starts_on = date '2026-08-02' where name = 'はれコス ｉｎ 青佐鼻海岸 ２０２６Ｓｕｍｍｅｒ';
update events set starts_on = date '2026-08-15' where name = '夏の星＆炎＆BBQ撮影イベント';
update events set starts_on = date '2026-08-29' where name = 'はれステPremium2026Ultra';
update events set starts_on = date '2026-07-19' where name = 'こすおん！ @ フラワーランド';
update events set starts_on = date '2026-07-19' where name = 'コスチャinイオンモール高松Vol.4.0';
update events set starts_on = date '2026-07-25' where name = 'こすぴっぴ';
update events set starts_on = date '2026-08-23' where name = 'coscha in サンポート高松Vol5.0';
update events set starts_on = date '2026-07-26' where name = 'ウシコス in 阿南の夏まつり vol.4';
