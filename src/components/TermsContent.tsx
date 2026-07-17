"use client";

import { colors } from "@/lib/tokens";

/**
 * Community guidelines / terms body, shared by the settings `terms` screen and
 * the sign-up consent overlay. Mobile-readable summary of docs/TERMS_DRAFT.md —
 * the placeholder-free parts (禁止事項・機能ルール・通報/ブロック・免責).
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

export function TermsContent() {
  return (
    <div>
      <p style={{ margin: 0, fontSize: 12.5, lineHeight: 1.9, color: colors.textSecondary }}>
        プルミエ！は、コスプレイヤー・カメラマンが好きな作品でつながり、併せ・撮影を楽しむための
        交流サービスです。<strong style={{ color: colors.textPrimary }}>ご利用は18歳以上の方に限ります。</strong>
        コンテンツは<strong style={{ color: colors.textPrimary }}>非アダルト（健全）方針</strong>です。
        安心して使える場にするため、以下のルールにご協力ください。
      </p>

      <Section title="1. 守ってほしいこと">
        <Item>
          <strong>写真の掲載は、写っている人全員の同意を得てから。</strong>
          「撮影の同意」と「SNS・アプリへの掲載の同意」は別です。削除を求められたら応じてください。
        </Item>
        <Item>他の人が撮影・制作した写真や作品を、無断で転載したり自分のものとして載せないでください。</Item>
        <Item>本サービスは非アダルト（健全）方針です。露骨な性的表現・過度な露出の写真は投稿できません。</Item>
      </Section>

      <Section title="2. 禁止事項">
        <Item>露骨な性的表現・わいせつな投稿（未成年に関する性的表現は固く禁止）。</Item>
        <Item>誹謗中傷・脅迫・つきまとい・差別、個人情報の無断公開（晒し）。</Item>
        <Item>盗撮、被写体を貶める・性的に消費する意図の撮影や加工。</Item>
        <Item>なりすまし、本人確認バッジや実績の詐称。</Item>
        <Item>宣伝・勧誘・スパム、マルチ商法や出会い目的の利用。</Item>
        <Item>取引詐欺・不当な集金などの金銭トラブル。</Item>
        <Item>著作権・肖像権・商標権の侵害、公式素材の流用、権利者が禁止する二次創作の扱い。</Item>
      </Section>

      <Section title="3. 併せ（募集・応募）について">
        <Item>併せはユーザー同士の自主的な企画です。運営は当日の進行・費用精算の当事者にはなりません。</Item>
        <Item>費用の分担は参加確定前に必ず確認を。無断キャンセル（ドタキャン）は控えましょう。</Item>
        <Item>スタジオ・イベント会場のルール（露出基準・撮影ルール・更衣室）が優先されます。</Item>
      </Section>

      <Section title="4. フリマ（衣装売買）について">
        <Item>取引は出品者と購入希望者の当事者間で、メッセージを通じて直接行います。</Item>
        <Item>
          <strong>本サービスはアプリ内決済・代金の預かり・配送を行いません。</strong>
          金銭トラブルの補償・返金対応も行いませんので、取引は自己責任でお願いします。
        </Item>
        <Item>偽ブランド品・海賊版衣装・違法な物品は出品できません。</Item>
      </Section>

      <Section title="5. 通報・ブロック">
        <Item>問題のある投稿・ユーザーは通報できます。一定数の通報が集まると自動的に非表示になります。</Item>
        <Item>相手をブロックすると、以後お互いの投稿・メッセージは表示されなくなります。</Item>
        <Item>運営は、規約違反と判断した場合、投稿の削除やアカウントの利用制限を行うことがあります。</Item>
        <Item>
          通報への対応や安全確保のため、運営が<strong>必要な範囲でメッセージを含むコンテンツを
          確認する場合があります</strong>。確認は通報のあった案件など正当な目的に限り、いつ・誰が
          確認したかを記録に残したうえで、必要最小限の範囲で行います。
        </Item>
      </Section>

      <Section title="6. 本人確認・外部リンク">
        <Item>本人確認は任意です。提出された身分証画像は確認後すぐに削除します。</Item>
        <Item>応援・支援リンク（外部サービス）は年齢確認済みの方にのみ表示されます。</Item>
      </Section>

      <Section title="7. 免責">
        <Item>本サービスは交流の「場」を提供するものです。ユーザー間のトラブルや当日の事故について運営は原則として責任を負いません。</Item>
        <Item>ただし、運営の故意または重大な過失による損害についてはこの限りではありません。</Item>
        <Item>投稿コンテンツの権利は投稿者に帰属します。運営はサービス提供に必要な範囲で表示に利用します。</Item>
      </Section>

      <p style={{ margin: "24px 0 0", fontSize: 11, lineHeight: 1.8, color: colors.textMutedAlt }}>
        本ガイドラインは予告なく改定される場合があります。重要な変更はサービス内でお知らせします。
        困ったときは通報・ブロックをご利用ください。
      </p>
      <p style={{ margin: "12px 0 0", fontSize: 11, lineHeight: 1.8, color: colors.textMutedAlt }}>
        運営者: Type&Co（屋号）　お問い合わせ: 16typeandco@gmail.com
      </p>
    </div>
  );
}
