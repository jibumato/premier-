"use client";

import { colors } from "@/lib/tokens";

/**
 * Privacy policy body, shared by the settings `privacy` screen and the
 * sign-up consent overlay. Mobile-readable summary of docs/PRIVACY_DRAFT.md —
 * the placeholder-free parts. Structure mirrors TermsContent.
 */

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{ marginTop: 22 }}>
      <h3 style={{ margin: 0, fontSize: 14, fontWeight: 700, color: colors.textPrimary }}>{title}</h3>
      <div style={{ marginTop: 8, fontSize: 12.5, lineHeight: 1.9, color: colors.textSecondary }}>{children}</div>
    </div>
  );
}

function Item({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ display: "flex", gap: 8, marginTop: 6 }}>
      <span style={{ color: colors.primary, flex: "0 0 auto" }}>・</span>
      <span>{children}</span>
    </div>
  );
}

export function PrivacyContent() {
  return (
    <div>
      <p style={{ margin: 0, fontSize: 12.5, lineHeight: 1.9, color: colors.textSecondary }}>
        プルミエ！における個人情報の取扱いについて説明します。安心してご利用いただくため、
        取得する情報とその使い方を明確にしています。
      </p>

      <Section title="1. 取得する情報">
        <Item>アカウント情報（メールアドレス、パスワード＝ハッシュ化して保管）。</Item>
        <Item>プロフィール（表示名・自己紹介・アバター/カバー画像・活動区分・フォロー作品）。</Item>
        <Item>投稿コンテンツ（併せ・投稿画像・フリマ出品・知恵袋・レビュー・メッセージ）。</Item>
        <Item>本人確認を申請した場合の身分証画像（取扱いは第4項）。</Item>
        <Item>通報・ブロックの情報、お問い合わせ内容。</Item>
        <Item>ログイン維持のための Cookie、アクセスログ・端末情報。</Item>
      </Section>

      <Section title="2. 利用目的">
        <Item>本サービスの提供・本人認証・アカウント管理のため。</Item>
        <Item>併せ・フリマ・メッセージ等の交流機能を提供するため。</Item>
        <Item>本人確認（確認済バッジ・年齢確認）のため。</Item>
        <Item>通報・ブロック等の安全対策、規約違反・不正利用への対応のため。</Item>
        <Item>品質改善・統計分析、重要なお知らせの連絡のため。</Item>
      </Section>

      <Section title="3. 第三者提供">
        <Item>法令に基づく場合等を除き、本人の同意なく第三者に提供しません。</Item>
        <Item>
          ユーザーが自ら公開する情報（プロフィール・投稿・出品等）は、サービスの性質上、
          他のユーザーが閲覧できます。非公開設定やブロックで表示範囲を制御できます。
        </Item>
      </Section>

      <Section title="4. 本人確認書類の取扱い">
        <Item>本人確認は任意です。身分証画像は本人性・年齢の確認の目的にのみ利用します。</Item>
        <Item>
          <strong>確認が完了したら、身分証画像は速やかに削除します。</strong>
          確認結果（確認済み等のフラグ）のみを保持します。
        </Item>
        <Item>マイナンバー（個人番号）は取得しません。番号が写らない画像の提出をお願いします。</Item>
      </Section>

      <Section title="5. 外部サービス・越境移転">
        <Item>
          本サービスは提供のため Supabase（認証・データベース）、Cloudflare（配信・画像保管）を
          利用します。データベースは<strong>東京リージョン（日本国内）</strong>に保管しています。
        </Item>
        <Item>
          これらの委託先は米国法人であり、また Cloudflare は世界中で配信を行うため、
          <strong>個人データが外国に移転される場合があります</strong>。運営は、委託先とのデータ処理
          契約（DPA）・標準契約条項（SCC）等の内容や各社の公表情報を確認することで、個人データ
          保護のための相当措置が継続的に講じられていることを確認します。
        </Item>
        <Item>将来の決済（投げ銭）は決済事業者が処理し、運営はカード番号を保持しません。</Item>
        <Item>外部の支援リンク先での取扱いは、各サービスのプライバシーポリシーに従います。</Item>
      </Section>

      <Section title="6. 安全管理・開示等の請求">
        <Item>通信の暗号化、アクセス権限の管理（行レベルセキュリティ）等の安全管理措置を講じます。</Item>
        <Item>
          自己の個人データの開示・訂正・削除・利用停止等を請求できます。多くの情報はアプリ内から
          自身で編集・削除できます。
        </Item>
      </Section>

      <Section title="7. 保存期間・アカウント削除">
        <Item>個人情報は利用目的の達成に必要な期間、または法令の定める期間保有します。</Item>
        <Item>
          アカウントを削除すると関連データは削除または匿名化されます（法令上の保存義務がある
          情報・取引記録等は一定期間保持する場合があります）。
        </Item>
      </Section>

      <p style={{ margin: "24px 0 0", fontSize: 11, lineHeight: 1.8, color: colors.textMutedAlt }}>
        本ポリシーは予告なく改定される場合があります。重要な変更はサービス内でお知らせします。
      </p>
      <p style={{ margin: "12px 0 0", fontSize: 11, lineHeight: 1.8, color: colors.textMutedAlt }}>
        事業者: Type&Co（屋号）　個人情報の取扱いに関するお問い合わせ: 16typeandco@gmail.com
      </p>
    </div>
  );
}
