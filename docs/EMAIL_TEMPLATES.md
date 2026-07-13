# メール文面テンプレート（運営向け）

Supabase の認証メール（会員登録の確認メールなど）を、英語のデフォルトから
**プルミエ！ブランドの日本語**に差し替えるためのテンプレート集です。

> これらはコード（このリポジトリ）ではなく **Supabase ダッシュボード側**で
> 管理されています。アプリのデプロイでは反映されません。下記の手順で
> ダッシュボードに貼り付けてください。

---

## 反映手順

1. Supabase ダッシュボード → 対象プロジェクトを選択
2. 左メニュー **Authentication** → **Emails**（または **Email Templates**）
3. 差し替えたいテンプレートのタブを開く
   - **Confirm signup** … 新規登録時の確認メール（← 今回の対象）
   - **Magic Link** … マジックリンクでのログイン
   - **Reset Password** … パスワード再設定
   - **Change Email Address** … メール変更の確認
4. **Subject（件名）** と **Message body（本文 HTML）** を下記に置き換えて **Save**
5. テスト登録して実機で受信確認

差し込み変数はそのまま残してください（例: `{{ .ConfirmationURL }}`）。
Supabase がリンクを自動で埋め込みます。

> **差出人名／アドレス**（現在 `Supabase Auth <noreply@mail.app.supabase.io>`）を
> 変えたい場合は、**Project Settings → Authentication → SMTP Settings** で
> 独自 SMTP（SendGrid / Resend / Amazon SES など）を設定し、Sender name を
> 「プルミエ！」、From を独自ドメイン（例: `no-reply@premiercos.com`）にします。
> 文面だけの差し替えなら SMTP 設定は不要です。

---

## 1. Confirm signup（会員登録の確認）← 今回の対象

### 件名（Subject）

```
【プルミエ！】メールアドレスの確認をお願いします
```

### 本文（Message body — HTML）

```html
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#F7F6FB;margin:0;padding:24px 0;font-family:-apple-system,BlinkMacSystemFont,'Hiragino Kaku Gothic ProN','Segoe UI',Roboto,sans-serif;">
  <tr>
    <td align="center">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:480px;background:#FFFFFF;border-radius:18px;overflow:hidden;border:1px solid #ECE8F6;">
        <!-- ヘッダー -->
        <tr>
          <td style="background:linear-gradient(135deg,#8B79C4,#6D5DAB);padding:26px 28px;">
            <div style="font-size:20px;font-weight:800;color:#FFFFFF;letter-spacing:0.5px;">プルミエ！</div>
            <div style="font-size:11px;color:#EFEBF8;margin-top:4px;">&ldquo;好き&rdquo;でつながる、コスプレイヤーマッチング交流サイト</div>
          </td>
        </tr>
        <!-- 本文 -->
        <tr>
          <td style="padding:30px 28px 8px;">
            <div style="font-size:17px;font-weight:700;color:#241B3D;">ご登録ありがとうございます</div>
            <p style="font-size:13.5px;color:#5A5470;line-height:1.85;margin:14px 0 0;">
              プルミエ！へようこそ。<br>
              下のボタンからメールアドレスの確認を完了すると、ご利用を開始できます。
            </p>
          </td>
        </tr>
        <!-- ボタン -->
        <tr>
          <td align="center" style="padding:24px 28px 8px;">
            <a href="{{ .ConfirmationURL }}"
               style="display:inline-block;background:#6D5DAB;color:#FFFFFF;text-decoration:none;font-size:14.5px;font-weight:700;padding:14px 34px;border-radius:999px;">
              メールアドレスを確認する
            </a>
          </td>
        </tr>
        <!-- 補助リンク -->
        <tr>
          <td style="padding:14px 28px 4px;">
            <p style="font-size:11px;color:#8B85A0;line-height:1.7;margin:0;">
              ボタンが開けない場合は、以下の URL をブラウザに貼り付けてください。
            </p>
            <p style="font-size:11px;color:#6D5DAB;word-break:break-all;line-height:1.7;margin:6px 0 0;">
              {{ .ConfirmationURL }}
            </p>
          </td>
        </tr>
        <!-- 注意書き -->
        <tr>
          <td style="padding:20px 28px 28px;">
            <p style="font-size:10.5px;color:#A8A3B8;line-height:1.75;margin:0;border-top:1px solid #F0EDF7;padding-top:16px;">
              このメールは、プルミエ！に登録手続きをされた方にお送りしています。<br>
              お心当たりがない場合は、このメールを破棄してください。確認しない限りアカウントは有効になりません。
            </p>
            <p style="font-size:10.5px;color:#C3BFD1;margin:14px 0 0;">© プルミエ！（premiercos.com）</p>
          </td>
        </tr>
      </table>
    </td>
  </tr>
</table>
```

---

## 2. Magic Link（マジックリンクでのログイン）

### 件名

```
【プルミエ！】ログイン用リンクをお送りします
```

### 本文（HTML）

上記 1 の HTML をベースに、見出し・本文・ボタン文言のみ差し替えます。

- 見出し: `ログインリンク`
- 本文: `下のボタンからプルミエ！にログインできます。<br>心当たりがない場合は、このメールを破棄してください。`
- ボタン文言: `ログインする`
- 変数はそのまま `{{ .ConfirmationURL }}`

---

## 3. Reset Password（パスワード再設定）

### 件名

```
【プルミエ！】パスワード再設定のご案内
```

### 本文（HTML）

上記 1 の HTML をベースに以下を差し替え。

- 見出し: `パスワードの再設定`
- 本文: `下のボタンから新しいパスワードを設定できます。<br>心当たりがない場合は、このメールを破棄してください。パスワードは変更されません。`
- ボタン文言: `パスワードを再設定する`
- 変数はそのまま `{{ .ConfirmationURL }}`

---

## 4. Change Email Address（メールアドレス変更の確認）

### 件名

```
【プルミエ！】メールアドレス変更の確認
```

### 本文（HTML）

上記 1 の HTML をベースに以下を差し替え。

- 見出し: `メールアドレスの変更`
- 本文: `新しいメールアドレスの確認をお願いします。<br>下のボタンを押すと変更が完了します。`
- ボタン文言: `変更を確認する`
- 変数はそのまま `{{ .ConfirmationURL }}`

> Change Email では、変更前・変更後の両アドレスに確認を送る設定（Secure email
> change）が既定で有効です。必要に応じて `{{ .Email }}` / `{{ .NewEmail }}`
> 変数も利用できます。
