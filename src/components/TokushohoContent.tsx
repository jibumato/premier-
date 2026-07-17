"use client";

import { colors } from "@/lib/tokens";

/**
 * 特定商取引法に基づく表記の本文。設定の `tokushoho` 画面で表示する。
 * 現在は無償提供・アプリ内決済なしのため法的な表示義務は必ずしも生じないが、
 * 利用者に安心してもらうため任意で事業者情報を開示する。住所・電話番号・
 * 運営統括責任者名は「請求があれば遅滞なく開示」方式（プライバシーポリシーと
 * 同じ方針）で、個人の自宅住所等を常時公開しない。有償機能導入時に正式版へ
 * 差し替える。構成は TermsContent / PrivacyContent に合わせる。
 */

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: 4,
        padding: "13px 0",
        borderBottom: `1px solid ${colors.borderSoft}`,
      }}
    >
      <div style={{ fontSize: 11.5, fontWeight: 700, color: colors.textMutedAlt }}>{label}</div>
      <div style={{ fontSize: 12.5, lineHeight: 1.8, color: colors.textSecondary }}>{children}</div>
    </div>
  );
}

export function TokushohoContent() {
  return (
    <div>
      <p style={{ margin: 0, fontSize: 12.5, lineHeight: 1.9, color: colors.textSecondary }}>
        本サービスは現在、利用者へ無償で提供しており、運営者が販売主体となる有償の取引・
        アプリ内課金は行っていません。そのため特定商取引法上の表示義務は必ずしも生じませんが、
        安心してご利用いただくため、事業者に関する情報を任意で開示します。
      </p>

      <div style={{ marginTop: 14 }}>
        <Row label="販売事業者 / 運営者">Type&amp;Co（屋号）</Row>
        <Row label="運営統括責任者">
          ご請求があれば遅滞なく開示します。下記メールアドレス宛にご連絡ください。
        </Row>
        <Row label="所在地">ご請求があれば遅滞なく開示します。</Row>
        <Row label="電話番号">
          ご請求があれば遅滞なく開示します。お問い合わせは原則としてメールにて承ります。
        </Row>
        <Row label="メールアドレス">16typeandco@gmail.com</Row>
        <Row label="販売価格 / 利用料金">
          本サービスの利用は無料です（現在、アプリ内課金・有償サービスはありません）。
        </Row>
        <Row label="商品代金以外の必要料金">
          なし。ただしインターネット接続料・通信料はお客様のご負担となります。
        </Row>
        <Row label="お支払い方法・時期">現在、アプリ内での決済はありません。</Row>
        <Row label="サービスの提供時期">アカウント登録後、すぐにご利用いただけます。</Row>
        <Row label="返品・キャンセル">無償サービスのため、返品・返金は生じません。</Row>
      </div>

      {/* フリマ（衣装売買）はローンチ時は非表示のため、本項目も伏せている。
          フリマ再開時にこのブロックのコメントを外して復活させる。
      <div style={{ marginTop: 22 }}>
        <h3 style={{ margin: 0, fontSize: 14, fontWeight: 700, color: colors.textPrimary }}>
          フリマ（衣装売買）について
        </h3>
        <div style={{ marginTop: 8, fontSize: 12.5, lineHeight: 1.9, color: colors.textSecondary }}>
          <div style={{ display: "flex", gap: 8, marginTop: 6 }}>
            <span style={{ color: colors.primary, flex: "0 0 auto" }}>・</span>
            <span>
              フリマ機能は利用者同士の個人間取引の場を提供するものであり、運営者は個々の取引の
              当事者ではありません。代金の授受・発送・返品等は、出品者と購入者の間で直接行われます。
            </span>
          </div>
          <div style={{ display: "flex", gap: 8, marginTop: 6 }}>
            <span style={{ color: colors.primary, flex: "0 0 auto" }}>・</span>
            <span>
              出品者が事業者に該当する場合、当該出品者自身が特定商取引法に基づく表示義務を負います。
            </span>
          </div>
        </div>
      </div>
      */}

      <p style={{ margin: "24px 0 0", fontSize: 11, lineHeight: 1.8, color: colors.textMutedAlt }}>
        将来、投げ銭・フリマの有償化など運営者が対価を受け取るサービスを提供する場合は、
        価格・支払方法・返品/キャンセル条件・所在地等を明示した表記を改めて掲載します。
      </p>
      <p style={{ margin: "12px 0 0", fontSize: 11, lineHeight: 1.8, color: colors.textMutedAlt }}>
        事業者: Type&amp;Co（屋号）　お問い合わせ: 16typeandco@gmail.com
      </p>
    </div>
  );
}
