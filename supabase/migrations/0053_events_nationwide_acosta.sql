-- =============================================================================
-- プルミエ！ 0053 — acosta! 全国イベント＋コスメルの追加
--   イベント一覧に地域絞り込み（関東/中部/関西/九州/中国・四国など）が
--   入ったのに合わせ、全国のacosta!イベントと、大阪の「コスメル」を追加する。
--   日程・会場・公式URLは acosta.jp のHTMLソースから直接抽出（2026-07-16
--   時点）。曜日と2026年カレンダーの整合を確認済み。
--   「詳細は近日公開！」表示だった回（[TBA]）も日程は確定のため含める。
--   「Ultra acosta! 2026」(9/4〜6・池袋) は migration 0013 で登録済みのため
--   対象外（on conflict do nothing でも自動的にスキップされる）。
--   冪等（on conflict do nothing、starts_on は name 一致で update）。
-- =============================================================================

insert into events (name, event_date, venue, region, tag, fee_text, body) values
  (
    'acosta! TFTビル（7/18）',
    '7/18(土)',
    'TFTビル',
    '東京',
    '撮影イベント',
    'チケット・参加方法は公式サイトを確認',
    '東京・浜松町のTFTビルで開催されるコスプレ撮影イベント。詳細はacosta公式サイト（acosta.jp）でご確認ください。'
  ),
  (
    'acosta! みずほPayPayドーム福岡（7/18〜20）',
    '7/18(土)〜20(月祝)',
    'みずほPayPayドーム福岡',
    '福岡',
    '撮影イベント',
    'チケット・参加方法は公式サイトを確認',
    'PayPayドーム福岡で3日間開催される大型コスプレイベント。ドーム1階駐車場がイベント限定開放、館内入場もOK。詳細: https://acosta.jp/event/fukuoka-paypaydome/26071820-2/'
  ),
  (
    'acosta! 万博夏まつり（7/25〜26）',
    '7/25(土)〜26(日)',
    '万博記念公園',
    '大阪',
    '撮影イベント',
    'チケット・参加方法は公式サイトを確認',
    '万博記念公園で開催される屋外コスプレ撮影イベント。詳細: https://acosta.jp/event/expo70-park-summer/2026-07/'
  ),
  (
    'acosta! ATC（8/1〜2）',
    '8/1(土)〜2(日)',
    'ATC（大阪南港）',
    '大阪',
    '撮影イベント',
    'チケット・参加方法は公式サイトを確認',
    '大阪南港ATCで開催される撮影イベント。詳細: https://acosta.jp/event/atc/2026080102-2/'
  ),
  (
    'acosta! GMOアリーナさいたま（8/8）',
    '8/8(土)',
    'GMOアリーナさいたま',
    '埼玉',
    '撮影イベント',
    'チケット・参加方法は公式サイトを確認',
    '埼玉のGMOアリーナで開催される撮影イベント。詳細: https://acosta.jp/event/saitama/2026_08/'
  ),
  (
    'acosta! 万博夏まつり（8/22〜23）',
    '8/22(土)〜23(日)',
    '万博記念公園',
    '大阪',
    '撮影イベント',
    'チケット・参加方法は公式サイトを確認',
    '万博記念公園で開催される屋外コスプレ撮影イベント（第2弾）。詳細: https://acosta.jp/event/expo70-park-summer/2026-08/'
  ),
  (
    'acosta! イオンモール広島府中（8/23）',
    '8/23(日)',
    'イオンモール広島府中',
    '広島',
    '撮影イベント',
    'チケット・参加方法は公式サイトを確認',
    '広島のイオンモール府中で開催される撮影イベント。詳細: https://acosta.jp/event/aeonmal-hiroshimafuchu/260823-2/'
  ),
  (
    'acosta! 松戸ラストサマーフェス（8/29〜30）',
    '8/29(土)〜30(日)',
    '松戸（千葉）',
    '千葉',
    '撮影イベント',
    'チケット・参加方法は公式サイトを確認',
    '千葉・松戸で開催される夏の撮影イベント。詳細: https://acosta.jp/event/matudo/2026-0829/'
  ),
  (
    'acosta! 扇町プール（9/5〜6）',
    '9/5(土)〜6(日)',
    '扇町プール',
    '大阪',
    '撮影イベント',
    'チケット・参加方法は公式サイトを確認',
    'プールを会場にした夏らしい撮影イベント。チケット販売は7/21(火)20:00〜。詳細: https://acosta.jp/event/ogimachi-pool/26090506-2/'
  ),
  (
    'acosta! ひらかたパーク（9/19）',
    '9/19(土)',
    'ひらかたパーク',
    '大阪',
    '撮影イベント',
    'チケット・参加方法は公式サイトを確認',
    '遊園地「ひらかたパーク」を会場にした撮影イベント。詳細: https://acosta.jp/event/hirakatapark/260919-2/'
  ),
  (
    'acosta! 京まふ（9/19〜20）',
    '9/19(土)〜20(日) ※詳細は近日公開',
    '京都',
    '京都',
    '撮影イベント',
    'チケット・参加方法は公式サイトを確認',
    '京都まんがミュージアム・フェスタ（京まふ）にあわせたコスプレイベント。開催日は確定、詳細は近日公開（acosta.jp）。'
  ),
  (
    'acosta! 池袋サンシャインシティ（9/22〜23）',
    '9/22(火)〜23(水) ※詳細は近日公開',
    '池袋サンシャインシティ',
    '東京',
    '撮影イベント',
    'チケット・参加方法は公式サイトを確認',
    '池袋サンシャインシティで開催される撮影イベント。開催日は確定、詳細は近日公開（acosta.jp）。'
  ),
  (
    'acosta! みのおキューズモール（9/26〜27）',
    '9/26(土)〜27(日)',
    'みのおキューズモール',
    '大阪',
    '撮影イベント',
    'チケット・参加方法は公式サイトを確認',
    '大阪・箕面のショッピングモールで開催される撮影イベント。詳細: https://acosta.jp/event/qsmall-minoh/2026092627-2/'
  ),
  (
    'acosta! 鶴舞公園（10/3〜4）',
    '10/3(土)〜4(日) ※詳細は近日公開',
    '鶴舞公園',
    '愛知',
    '撮影イベント',
    'チケット・参加方法は公式サイトを確認',
    '名古屋・鶴舞公園で開催される撮影イベント。開催日は確定、詳細は近日公開（acosta.jp）。'
  ),
  (
    'acosta! 岸和田カンカン（10/4）',
    '10/4(日) ※詳細は近日公開',
    '岸和田カンカン',
    '大阪',
    '撮影イベント',
    'チケット・参加方法は公式サイトを確認',
    '大阪・岸和田の商業施設「カンカン」で開催される撮影イベント。開催日は確定、詳細は近日公開（acosta.jp）。'
  ),
  (
    'acosta! 道頓堀コスプレ祭（10/17〜18）',
    '10/17(土)〜18(日) ※詳細は近日公開',
    '道頓堀',
    '大阪',
    '撮影イベント',
    'チケット・参加方法は公式サイトを確認',
    '大阪・道頓堀一帯で開催される撮影イベント。開催日は確定、詳細は近日公開（acosta.jp）。'
  ),
  (
    'acosta! 大分やまくに（10/18）',
    '10/18(日) ※詳細は近日公開',
    '大分やまくに',
    '大分',
    '撮影イベント',
    'チケット・参加方法は公式サイトを確認',
    '大分・やまくにで開催される撮影イベント。開催日は確定、詳細は近日公開（acosta.jp）。'
  ),
  (
    'acosta! イオンモール大日（10/24）',
    '10/24(土) ※詳細は近日公開',
    'イオンモール大日',
    '大阪',
    '撮影イベント',
    'チケット・参加方法は公式サイトを確認',
    '大阪・イオンモール大日で開催される撮影イベント。開催日は確定、詳細は近日公開（acosta.jp）。'
  ),
  (
    'acosta! 鶴舞公園（10/31）',
    '10/31(土) ※詳細は近日公開',
    '鶴舞公園',
    '愛知',
    '撮影イベント',
    'チケット・参加方法は公式サイトを確認',
    '名古屋・鶴舞公園で開催される撮影イベント（第2弾）。開催日は確定、詳細は近日公開（acosta.jp）。'
  ),
  (
    'acosta!×AGF2026特別版（11/7〜8）',
    '11/7(土)〜8(日)',
    '池袋サンシャインシティ',
    '東京',
    '撮影イベント',
    'チケット・参加方法は公式サイトを確認',
    'アニメイトガールズフェスティバル2026とのコラボ特別版。詳細: https://acosta.jp/event/ikebukuro/2026-11/'
  ),
  (
    'コスメル in コスモタワー',
    '7/20(月祝)',
    '大阪南港コスモタワー（大阪府大阪市住之江区南港北1-14-16）',
    '大阪',
    '撮影イベント',
    'チケット・参加方法は公式サイトを確認',
    '近未来的な高層ビルを会場にしたコスプレイベント。大理石のエントランスホール・中庭・廃墟エリアなど撮影スポットが豊富。公式: https://cosmel.link/csm.html'
  )
on conflict (name) do nothing;

update events set starts_on = date '2026-07-18' where name = 'acosta! TFTビル（7/18）';
update events set starts_on = date '2026-07-18' where name = 'acosta! みずほPayPayドーム福岡（7/18〜20）';
update events set starts_on = date '2026-07-25' where name = 'acosta! 万博夏まつり（7/25〜26）';
update events set starts_on = date '2026-08-01' where name = 'acosta! ATC（8/1〜2）';
update events set starts_on = date '2026-08-08' where name = 'acosta! GMOアリーナさいたま（8/8）';
update events set starts_on = date '2026-08-22' where name = 'acosta! 万博夏まつり（8/22〜23）';
update events set starts_on = date '2026-08-23' where name = 'acosta! イオンモール広島府中（8/23）';
update events set starts_on = date '2026-08-29' where name = 'acosta! 松戸ラストサマーフェス（8/29〜30）';
update events set starts_on = date '2026-09-05' where name = 'acosta! 扇町プール（9/5〜6）';
update events set starts_on = date '2026-09-19' where name = 'acosta! ひらかたパーク（9/19）';
update events set starts_on = date '2026-09-19' where name = 'acosta! 京まふ（9/19〜20）';
update events set starts_on = date '2026-09-22' where name = 'acosta! 池袋サンシャインシティ（9/22〜23）';
update events set starts_on = date '2026-09-26' where name = 'acosta! みのおキューズモール（9/26〜27）';
update events set starts_on = date '2026-10-03' where name = 'acosta! 鶴舞公園（10/3〜4）';
update events set starts_on = date '2026-10-04' where name = 'acosta! 岸和田カンカン（10/4）';
update events set starts_on = date '2026-10-17' where name = 'acosta! 道頓堀コスプレ祭（10/17〜18）';
update events set starts_on = date '2026-10-18' where name = 'acosta! 大分やまくに（10/18）';
update events set starts_on = date '2026-10-24' where name = 'acosta! イオンモール大日（10/24）';
update events set starts_on = date '2026-10-31' where name = 'acosta! 鶴舞公園（10/31）';
update events set starts_on = date '2026-11-07' where name = 'acosta!×AGF2026特別版（11/7〜8）';
update events set starts_on = date '2026-07-20' where name = 'コスメル in コスモタワー';
