# Contact ページ（フォーム + メール送信 + Discord 通知）設計

- Date: 2026-06-09
- Branch: `feat/contact-page`（`main` から分岐）
- Status: design approved (requirements locked via AskUserQuestion)

## Context

`/contact` は 2026-06-08 に hero CTA 配線用の **stub のみ**（`PageHeader` + 「準備中です」）として作られ、フォーム本体・送信先は未実装だった（memory: contact-page-todo）。本変更でフォームを実装し、送信時に **Resend でメール送信**し、同時に **Discord webhook へ通知**する。メール（`contact@napochaan.com` 宛）が一次チャンネル、Discord は受信に即気づくための補助通知。

## 確定要件（AskUserQuestion）

| 項目         | 決定                                                                         |
| ------------ | ---------------------------------------------------------------------------- |
| フォーム項目 | 名前 + Email（返信用）+ 本文                                                 |
| 差出人       | `contact@napochaan.com`（Resend でドメイン検証）→ `contact@napochaan.com` 宛 |
| 履歴保存     | Payload には保存しない（メール + Discord のみ）                              |
| 送信方式     | **Server Action**（この repo 初の server action）+ `useActionState`          |
| レイアウト   | desktop = フォーム（左）+ 直接連絡グリッド（右 aside）/ mobile = 縦積み      |

## アーキテクチャ / データフロー

```
ContactForm (client, "use client")
  react-aria <Form>/<TextField>/<TextArea> + 既存 <Button>
  useActionState(submitContact, initialState)
        |  FormData(name,email,message)
        v
submitContact (server, "use server")
  1. zod parse → 失敗なら field errors を返す（早期 return）
  2. getCloudflareContext().env から secrets 取得
  3. sendContactEmail()  … 失敗なら status:'error' で return（一次チャンネル）
  4. notifyDiscord()     … best-effort（catch してログのみ、成功は妨げない）
  5. status:'success' を返す
        |
        +--> Resend REST  POST https://api.resend.com/emails
        +--> Discord webhook  POST $DISCORD_WEBHOOK_URL
```

`process.env` ではなく `getCloudflareContext({ async: true }).env` で secret を読む（Workers の runtime binding）。SDK は使わず `fetch` で REST を叩く（Workers バンドルリスク回避、既存 `news/rss.xml/route.ts`・`next/preview/route.ts` と同じ思想）。

## ファイル構成（単一責任）

| パス                                                               | 役割                                                                                      | 種別     |
| ------------------------------------------------------------------ | ----------------------------------------------------------------------------------------- | -------- |
| `src/lib/contact/schema.ts`                                        | zod スキーマ（name 1〜100字, email 形式 + ≤254字, message 10〜5000字）+ `ContactInput` 型 | pure     |
| `src/lib/contact/send-email.ts`                                    | `sendContactEmail(input, env)` Resend REST を fetch。成功/失敗を返す                      | I/O      |
| `src/lib/contact/notify-discord.ts`                                | `notifyDiscord(input, env)` Discord webhook を fetch。best-effort                         | I/O      |
| `src/app/(site)/contact/_actions/submit-contact.ts`                | `"use server"` アクション。検証→送信→通知を調停し型付き `ContactState` を返す             | action   |
| `src/app/(site)/contact/_components/contact-form/index.tsx`        | `"use client"` フォーム本体（TextField×2 + TextArea + Button + useActionState）           | UI       |
| `src/components/text-field/{index.tsx,styles.css.ts,*.test.tsx}`   | 単一行の boxed hairline 入力（共有コンポーネント、react-aria）                            | UI       |
| `src/components/text-area/{index.tsx,styles.css.ts,*.test.tsx}`    | 複数行の boxed hairline 入力（共有コンポーネント、react-aria）                            | UI       |
| `src/app/(site)/contact/_components/contact-form/styles.css.ts`    | フォーム + field styles（`@styled/css`）                                                  | UI       |
| `src/components/contact-list/{index.tsx,styles.css.ts,*.test.tsx}` | about の `_components/contact-list` を **共有化のため移設**                               | refactor |
| `src/app/(site)/contact/page.tsx`                                  | stub を PageHeader + グリッド（form + ContactList aside）に書き換え                       | UI       |
| `src/app/(site)/contact/styles.css.ts`                             | グリッドレイアウト追記                                                                    | UI       |

### ContactList 移設の理由

現状 `src/app/(site)/about/_components/contact-list/` は about ページ専用。contact からも使うため `src/components/contact-list/` へ移し、about 側の import 1行を更新（colocation ルール: 2画面共有＝共有コンポーネント）。データは両ページとも `about/profile.ts` の `contacts`（x / github / mail）を渡す。

## UI（レイアウト）— 確定（AskUserQuestion）

| 軸           | 決定                                                                                                                       |
| ------------ | -------------------------------------------------------------------------------------------------------------------------- |
| field style  | **Boxed hairline**（既存 button/contact-list 文法。rest=`border.default`、focus=`accent.border`+`focusRing`、角は `none`） |
| container    | **Bare**（パネル枠なし。`SectionHeading` 直下にフィールドを並べる）                                                        |
| 送信ボタン   | **右寄せ** auto 幅（`送信 →`）。既存 `Button`（`data-variant="solid"`）                                                    |
| desktop grid | `form 2fr : aside 1fr`（mobile 1col 縦積み、aside は form の下）                                                           |

```
<main id="main-content">
  <PageHeader title="contact" kicker="// お問い合わせ" lead=... breadcrumbs=[home, contact] />
  <div class="grid">                          // desktop 2fr:1fr / mobile 1col
    <section>                                  // 2fr
      <SectionHeading no="01" more="// メッセージ">message</SectionHeading>
      <ContactForm />                          // 名前 / Email / 本文 / [送信 →](右寄せ)
    </section>
    <aside>                                     // 1fr
      <SectionHeading no="02">direct</SectionHeading>
      <p>フォームが苦手なら直接どうぞ</p>
      <ContactList items={profile.contacts} />
    </aside>
  </div>
</main>
```

### フィールドの実装

- boxed hairline 文法は2つの独立した共有コンポーネントに分割。単一行は `@components/text-field`（`TextField`、name/email）、複数行は `@components/text-area`（`TextArea`、message）。それぞれ別 props で、`multiline` フラグは持たない。
- 構造: react-aria `TextField` > `Label`(mono small, 例「name / お名前」) + `Input`(TextField) / `TextArea`(TextArea, boxed) + `FieldError`(検証エラーをインライン, `danger.*`)。`description` で補足可。
- rest/focus/invalid を data 属性・`_focusWithin`/aria-invalid で出し分け（rest 静か→focus 電子ブルー、invalid は `danger.border`）。
- 送信ボタンは `isPending` 中 disabled + ラベル「送信中…」。ボタン行は `justify-content:flex-end`。
- 成功時: フォームを成功メッセージ（`role="status"`）に差し替え。失敗時（送信系）: フォーム上部に汎用エラー（`role="alert"`）。検証エラーは各 `FieldError` にインライン。

## エラー処理（非対称）

- **検証エラー**: zod の `flatten().fieldErrors` を `ContactState.fieldErrors` で返し、各 `TextField` の `FieldError` に表示。JS 無効でも server action で動作。
- **Resend 失敗**: 一次チャンネルなので `status:'error'` + 汎用メッセージ（PII を返さない）。`console.error` でログ。
- **Discord 失敗**: best-effort。`try/catch` でログのみ、送信全体は成功扱い（通知は補助）。
- secret 未設定（env 欠落）: `status:'error'` + サーバログ。ユーザーには汎用文言。

## Secrets / env

メールアドレスは秘匿情報として扱い、平文 config（commit 対象の `wrangler.toml`）には置かず **4つとも secret 化**する。`.dev.vars`（dev, gitignore, 機密）に記載:

```
RESEND_API_KEY=re_xxx
DISCORD_WEBHOOK_URL=https://discord.com/api/webhooks/...
CONTACT_TO_EMAIL=contact@napochaan.com
CONTACT_FROM_EMAIL=contact@napochaan.com
```

記載後 `pnpm cf:types` を再実行して `cloudflare-env.d.ts` を更新（`env.*` を型安全化, 4つとも `string`）。`send-email.ts` は from/to をハードコードせず env から必須で受ける（デフォルト文字列を持たない）。本番は 4つとも `wrangler secret put`（`RESEND_API_KEY` / `DISCORD_WEBHOOK_URL` / `CONTACT_TO_EMAIL` / `CONTACT_FROM_EMAIL`）。Resend 側で `napochaan.com` のドメイン検証（DNS: SPF/DKIM）が前提。

## テスト（TDD, vitest = workerd pool）

- `schema.test.ts`: 正常/各 field の境界（空・不正 email・本文上限）。
- `send-email.test.ts`: `globalThis.fetch` を mock し、Resend へ正しい URL/headers/body を送る・非2xx で失敗を返す。
- `notify-discord.test.ts`: webhook へ POST、失敗しても throw せずログのみ。
- `contact-form.test.tsx`: ラベル描画、必須未入力でフォーム送信されない（client validation）、`useActionState` 経由で action が呼ばれる（action を mock）。
- `contact-list.test.tsx`: 移設後パスで既存テストが通る。
- 各実装前にテストを書く（TDD）。`pnpm lint && pnpm typecheck && pnpm test` を完了条件にする。

## 検証（end-to-end）

1. `.dev.vars` に実 key（or ダミー）を入れ `pnpm dev`。
2. `/contact` で 名前/Email/本文 を入力し送信 → 成功表示。
3. Resend ダッシュボード／受信箱でメール、Discord チャンネルで通知を確認。
4. 不正入力（空・不正 email）でインラインエラー、JS 無効でも server action が field errors を返すこと。

## スコープ外（YAGNI）

- Payload への保存・管理画面一覧
- 添付ファイル / reCAPTCHA / rate limit（必要なら別タスク）
- 自動返信メール
