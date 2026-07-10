# 投げ銭・金銭仲介 設計（プルミエ！）

> レイヤー／カメラマンへの「投げ銭（応援・支援）」を実装するための設計方針。
> 現状は外部リンク（Fantia / pixivFANBOX / Skeb）誘導のみで、アプリ内の金銭仲介は
> 未実装（[ARCHITECTURE.md](ARCHITECTURE.md) §8）。ここでは**アプリ内で完結する支援**を
> 導入する際の選択肢・法的論点・アーキテクチャ・段階計画をまとめる。

- **前提の再確認**: 運営はワンオペ。人手の承認フロー・目視の入金確認は作らない
  （＝Stripe 等の外部決済＋Webhook で自動化する方針を貫く）。
- **⚠️ 免責**: 本書は実装設計のためのメモであり法的助言ではない。**金銭を扱う機能を
  本番公開する前に、必ず司法書士／弁護士等の専門家レビューを受けること**。特に資金決済法・
  犯罪収益移転防止法・特定商取引法・税務（源泉徴収／インボイス）の該当性判断は必須。

---

## 1. 3つのモデルと推奨

| モデル | 概要 | 創作者の受取 | 法的な重さ | 判定 |
| --- | --- | --- | --- | --- |
| **A. 直接支援（Stripe Connect）** | ファン→創作者へ都度課金。運営は手数料を取り、残りは創作者の口座へ | 現金（出金あり） | 中（決済は Stripe の免許で処理） | **推奨（MVP）** |
| **B. コインウォレット（前払式）** | ファンがコインを前払い購入→後で消費 | 現金 or ステータス | 大（資金決済法・前払式支払手段） | 後日（UX 向上時） |
| **C. 換金なし応援** | 課金は運営売上、創作者には「応援された数」バッジのみ | ステータスのみ | 小 | 創作者の収益にならず弱い |
| **D. 現状維持（外部リンク）** | Fantia/FANBOX/Skeb へ誘導（実装済み） | 外部で受取 | ゼロ | 併用は可 |

### 推奨：**モデル A（Stripe Connect の直接支援）から始める**

理由：
- **創作者に実際の収益が入る**（コスプレSNSの本命ニーズ）。C ではステータスだけで弱い。
- **法的にいちばん軽い"換金あり"の形**。コイン残高を持たない（＝前払式支払手段に該当しない）ので
  資金決済法の届出・供託ラインを回避。送金は Stripe の資金移動業免許の下で処理されるため、
  運営自身が資金移動業／収納代行の主体になりにくい（＝重い登録を避けられる）。
- **本人確認（KYC）を Stripe に委任できる**。出金する創作者の本人確認は Stripe Connect の
  オンボーディングが担う → 別途 eKYC ベンダーと契約しなくても"出金のためのKYC"は満たせる。
  （※ プルミエ！独自の「確認済バッジ／年齢ゲート」の本人確認とは目的が別。§5 参照）
- **Web アプリなので Apple/Google の 30% を回避できる**。ネイティブアプリのアプリ内課金だと
  デジタル財（コイン）に 30% 手数料がかかるが、本アプリは Next.js の Web 配信なので
  Stripe 決済を直接使える。これは料率設計上とても大きい。

> コイン（モデル B）は「まとめ買いして後で少しずつ投げる」UX のためのもの。便利だが
> **前払式支払手段**として資金決済法の対象になり管理コストが増える。MVP では持たず、
> 需要が見えてから追加する。

---

## 2. モデル A のお金の流れ（Stripe Connect）

```
ファン ──(¥1,000 支援)──▶ Stripe Checkout / PaymentIntent
                              │  application_fee_amount = ¥150（運営手数料 15%）
                              │  transfer_data.destination = 創作者の connected account
                              ▼
                         Stripe が分配
                              ├─▶ 運営（プラットフォーム）: ¥150 − Stripe決済手数料
                              └─▶ 創作者の残高: ¥850 →（定期）銀行口座へ自動出金
```

- **アカウント種別**: Stripe Connect **Express**（Stripe ホストのオンボーディングで
  本人確認・銀行口座登録・出金スケジュール・税務書類を Stripe 側が処理）。運営はマーケット
  プレイスの位置づけ。
- **決済単位**: 残高を貯めない「**都度課金**」。1 回の支援 = 1 つの PaymentIntent。
- **手数料**: `application_fee_amount` で運営取り分を指定（例：15%。要決定。§6）。
- **返金**: 支援の性質上、原則不可の規約に（トラブル時は個別対応）。

---

## 3. アーキテクチャ（Cloudflare Workers + Supabase + Stripe）

既存スタックにそのまま載る。ワンオペ方針どおり **Stripe Webhook で状態を自動更新**する。

### 3.1 サーバー（Route Handlers on Workers）
- `POST /api/stripe/connect/onboard` — 創作者の Connect アカウント作成＋`account_link` を返す
  （Stripe ホストのオンボーディングへ誘導）。要ログイン。
- `POST /api/stripe/checkout` — 支援の PaymentIntent / Checkout Session を作成。
  送信者＝セッションのユーザー、宛先＝対象クリエイターの connected account。
- `POST /api/stripe/webhook` — 署名検証のうえ以下を処理（**ここが自動化の要**）：
  - `account.updated` → `creator_payment_accounts.payouts_enabled` を更新
  - `payment_intent.succeeded` → `supports.status = 'succeeded'`、通知を自動生成
  - `charge.refunded` 等 → 状態反映
- **秘密鍵は Worker Secret**（`wrangler secret put STRIPE_SECRET_KEY` /
  `STRIPE_WEBHOOK_SECRET`）。`NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` のみ公開。
- Stripe SDK は fetch ベースで Workers 互換（`stripe` の `httpClient` に fetch を指定、
  もしくは Stripe の REST を直接叩く）。

### 3.2 スキーマ（新規マイグレーション案 `00XX_monetization.sql`）
```sql
-- 創作者の受取アカウント（Stripe Connect）
create table creator_payment_accounts (
  user_id           uuid primary key references profiles(id) on delete cascade,
  stripe_account_id text not null unique,
  payouts_enabled   boolean not null default false,   -- Stripe webhook で更新
  onboarded_at      timestamptz,
  created_at        timestamptz not null default now()
);

-- 支援（投げ銭）1 件 = 1 PaymentIntent
create table supports (
  id                 uuid primary key default gen_random_uuid(),
  sender_id          uuid not null references profiles(id) on delete set null,
  recipient_id       uuid not null references profiles(id) on delete cascade,
  amount_jpy         integer not null check (amount_jpy > 0),
  fee_jpy            integer not null default 0,
  message            text,
  stripe_pi_id       text unique,
  status             text not null default 'pending'
                       check (status in ('pending','succeeded','failed','refunded')),
  created_at         timestamptz not null default now()
);
create index supports_recipient_idx on supports (recipient_id, created_at desc);

-- RLS: 送受信者は自分の関係する支援を閲覧。作成/更新はサーバー(Stripe webhook,
-- service role)経由のみ＝一般ユーザー向けの insert/update ポリシーは付与しない。
alter table creator_payment_accounts enable row level security;
alter table supports                 enable row level security;
create policy cpa_select on creator_payment_accounts for select using (user_id = auth.uid());
create policy supports_select on supports for select
  using (sender_id = auth.uid() or recipient_id = auth.uid());
```
> 支援行の作成は「決済確定（webhook）後にサーバーが書く」ため、RLS で一般の insert は
> 塞ぐ。金額の真実は Stripe 側にあり、DB は投影。二重計上防止に `stripe_pi_id` を unique に。

### 3.3 クライアント（既存 UI の転用）
- `ProfileScreen` の「応援ギフト」セクション（`giftTiers`：🌸50 / ⭐200 / 👑500）を、
  **コインではなく金額プリセット**（例：¥100 / ¥500 / ¥1,000）にして直接支援へ接続。
- 創作者側：設定に「支援を受け取る（口座設定）」を追加 → `/api/stripe/connect/onboard` へ。
  `payouts_enabled` が false の相手には支援ボタンを出さない（受け取れないため）。
- ゾーニング／年齢確認とは独立（支援は成人向けではないが、料率・規約表示は必要）。

---

## 4. 法的論点（要専門家確認・日本）

| 論点 | 要旨 | モデル A での扱い |
| --- | --- | --- |
| **資金決済法（前払式支払手段）** | コイン等を前払いで発行・保管すると対象。基準日残高が一定額超で届出・供託 | **コインを持たない**ので原則非該当（回避） |
| **資金移動業／収納代行** | 送金の主体になると重い登録。為替取引の該当性 | 送金は **Stripe の免許下**で処理。運営はマーケットプレイス |
| **犯収法（本人確認）** | 出金する側（創作者）の本人確認が必要 | **Stripe Connect のオンボーディングが実施** |
| **特定商取引法** | 特商法表記・返金方針の明示 | 決済導入時に表記ページを用意 |
| **消費税・インボイス** | プラットフォーム手数料の課税、創作者の所得・源泉 | Stripe の税務書類機能＋税理士確認 |
| **アプリストア手数料** | ネイティブ配信だとデジタル財に 30% | **Web 配信で回避**（優位点） |

---

## 5. 本人確認（KYC）の整理 — 目的が2つある

1. **プルミエ！独自の「確認済バッジ／年齢ゲート」** … 既存の手動本人確認（`verify` 画面・
   `verification_requests`）。信頼バッジと応援リンクのゾーニング用。→ 実装済み。
2. **出金のための本人確認** … 支援を現金で受け取る創作者に必要。→ **Stripe Connect が担当**。

この2つは**別物**。投げ銭を入れても①を eKYC ベンダーに置き換える必要はなく、②は Stripe に
任せられる。つまり「手動 KYC のまま投げ銭を始められる」。将来①をベンダー eKYC 化するかは
規模で判断（[SETUP.md](SETUP.md) の方針どおり）。

---

## 6. 段階計画

| フェーズ | 範囲 | 依存 |
| --- | --- | --- |
| **M0（済）** | 外部リンク誘導（Fantia/FANBOX/Skeb） | — |
| **M1** | Stripe Connect 直接支援：口座オンボード＋都度支援＋Webhook 自動反映＋支援履歴 | Stripe アカウント・法務レビュー・手数料率決定 |
| **M2（任意）** | コインウォレット（前払式）でまとめ買い UX | 資金決済法の残高管理体制 |
| **M3（任意）** | 月額サブスク支援（継続課金）、ランキング／特典 | M1 |

---

## 7. 着手前に決めること（オーナー判断）

1. **モデル**：A（直接支援・推奨）／B（コイン）／C（換金なし）のどれで始めるか。
2. **手数料率**：運営取り分（例：10〜20%）。Stripe 決済手数料（約 3.6%）は別途かかる。
3. **タイミング**：今すぐ M1 の実装に入るか、ユーザーが付いてローンチ後にするか
   （売上が立つ前に法務コストだけ先行するのは非効率、という §「eKYCコスト」議論と同じ論点）。
4. **法務レビュー**：本番公開前の専門家確認は必須（本書 §4）。
5. **Stripe アカウント**：本番申請には事業者情報・特商法表記・本人確認が必要（リードタイムあり）。

> 技術的には既存スタックにそのまま載り、M1 の実装規模は中程度（Route Handler 3本＋Webhook＋
> スキーマ＋既存ギフト UI の転用）。**ブロッカーは技術ではなく、料率・法務・タイミングの判断**。
