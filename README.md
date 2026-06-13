# www.napochaan.com

[napochaan](https://www.napochaan.com) の個人サイト。DJ・VJ・グラフィック・デジタル制作の記録と、それを支える Web 表現の実験場。

Next.js (App Router) を [OpenNext](https://opennext.js.org/cloudflare) 経由で Cloudflare Workers にデプロイし、CMS には Payload (D1 + R2) を採用しています。

## Tech Stack

| 領域             | 採用技術                                                                                   |
| ---------------- | ------------------------------------------------------------------------------------------ |
| Framework        | Next.js 15 (App Router / React Server Components) + React 19                               |
| Runtime / Deploy | [OpenNext](https://opennext.js.org/cloudflare) → Cloudflare Workers                        |
| CMS              | [Payload CMS](https://payloadcms.com/) (Cloudflare D1 / R2 アダプタ)                       |
| Styling          | [Panda CSS](https://panda-css.com/) (design tokens, container queries)                     |
| Accessibility    | [react-aria-components](https://react-aria.adobe.com/)                                     |
| Realtime         | Cloudflare Durable Objects + WebSocket ([durabcast](https://github.com/napolab/durabcast)) |
| Lint / Format    | [oxlint](https://oxc.rs/) + oxfmt                                                          |
| Type Check       | [`@typescript/native-preview`](https://github.com/microsoft/typescript-go) (`tsgo`)        |
| Test             | [Vitest](https://vitest.dev/) (browser mode)                                               |
| Package Manager  | pnpm                                                                                       |

## Features

- **works / news / blog** — Payload コレクション。slug ベースの URL (`/works/{slug}`)、ISR、下書き Live Preview に対応
- **log** — 出演・リリース・制作を統合した活動年表
- **gallery** — masonry レイアウト + lightbox
- **contact** — Server Action によるフォーム送信 (Resend メール + Discord 通知 + Cloudflare Turnstile)
- **動的 OG 画像** — `next/og` (Satori) で詳細ページごとに生成
- **配信系** — RSS フィード / `sitemap.xml` / `llms.txt` / `llms-full.txt`
- **リアルタイムカーソル共有** — Durable Object と WebSocket による presence
- **フォント最適化** — Adobe Fonts (Typekit) の非同期ロード + FOUT 対策オーバーレイ

## Development

```bash
pnpm install

pnpm dev            # 開発サーバー
pnpm build          # 本番ビルド (Next.js → OpenNext)
pnpm lint           # oxlint + oxfmt --check
pnpm fmt            # oxfmt --write + oxlint --fix
pnpm typecheck      # tsgo (TypeScript native preview)
pnpm test           # vitest
```

Payload / DB 関連:

```bash
pnpm payload migrate:create <name>   # マイグレーション生成
pnpm payload migrate                 # ローカル D1 に適用
pnpm payload generate:types          # 型再生成
pnpm seed:import                     # src/seed/data/*.json から投入
```

ローカル開発には `.dev.vars`（gitignore 済み）に各種シークレットが必要です。詳細は [`SETUP-NOTES.md`](./SETUP-NOTES.md) を参照してください。

## Architecture Notes

- **RSC ファースト** — 既定で Server Component。インタラクティブな部分のみ最小スコープの Client Component に切り出し、`Suspense` + `ErrorBoundary` で包む
- **画像** — `next/image` を直接使わず `@components/image` 経由。`/_next/image` を Worker 層で Cloudflare Images バインディングへルーティング
- **ISR とキャッシュ** — `unstable_cache`（データ層）+ `revalidatePath`（path-keyed HTML）をコレクションの `afterChange` フックで両方バスト
- **シード** — `src/seed/data/*.json` を single source of truth とし、slug をキーに冪等 upsert

## License

個人サイトのため、コードの再利用・改変は想定していません（参考閲覧用）。`src/assets` 等の画像・コンテンツの著作権は napochaan に帰属します。
