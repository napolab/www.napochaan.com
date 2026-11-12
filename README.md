# www.napochaan.com

[napochaan](https://www.napochaan.com) の個人サイト。DJ・VJ・グラフィック・デジタル制作の記録と、それを支える Web 表現の実験場。

pnpm workspaces の monorepo。公開サイト（`apps/web`）と CMS（`apps/cms`）を別 Worker に分け、Next.js (App Router) を [OpenNext](https://opennext.js.org/cloudflare) 経由で Cloudflare Workers にデプロイしています。CMS には Payload (D1 + R2) を採用しています。

```
apps/cms          Payload CMS（admin / REST / MCP / CMS RPC）  cms.napochaan.com / cms-stg.napochaan.com（ホスト全体が Cloudflare Access 配下）
apps/web          公開サイト（SSR + Workers Cache、Payload 非依存） napochaan.com / stg.napochaan.com
packages/cms-api  web ↔ cms 共有の Hono app / DTO / サービス interface（実装なし）

web ──env.CMS（Service Binding, hc<CMSAppType>）──▶ cms
web ◀──env.WEB.purge()（CMS 書込み時にキャッシュを全消し）── cms
```

## Tech Stack

| 領域             | 採用技術                                                                                   |
| ---------------- | ------------------------------------------------------------------------------------------ |
| Framework        | Next.js 16 (App Router / React Server Components) + React 19                               |
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

- **works / news / blog** — Payload コレクション。slug ベースの URL (`/works/{slug}`)、SSR + Workers Cache、下書き Live Preview に対応
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

pnpm dev            # web の開発サーバー（先に cms を起動しておく。下記）
pnpm dev:cms        # cms（Payload admin）の開発サーバー :3001
pnpm build          # web の本番ビルド (Next.js → OpenNext)
pnpm lint           # 全 workspace: oxlint + oxfmt --check
pnpm fmt            # 全 workspace: oxfmt --write + oxlint --fix
pnpm typecheck      # 全 workspace: tsgo (TypeScript native preview)
pnpm test           # 全 workspace: vitest
```

web は cms を Service Binding 経由で呼ぶので、ローカルで RPC を通すときは `apps/cms` で `wrangler dev` を先に起動してから web の `next dev` を起動する（`pnpm --filter cms dev:worker` = OpenNext build + `wrangler dev --port 8791`）。dev registry（`WRANGLER_REGISTRY_PATH` / `MINIFLARE_REGISTRY_PATH`）は worktree ごとに固定する。

Payload / DB 関連（root の script は `apps/cms` に委譲される）:

```bash
pnpm payload migrate:create <name>   # マイグレーション生成（apps/cms/migrations）
pnpm payload migrate                 # ローカル D1 に適用
pnpm payload generate:types          # 型再生成
pnpm seed:import                     # apps/cms/src/seed/data/*.json から投入
```

デプロイは cms → web の順（`pnpm deploy:staging` / `pnpm deploy:production` が順に実行）。運用手順は [`docs/production-deploy.md`](./docs/production-deploy.md)。

ローカル開発には各 app の `.dev.vars`（`apps/cms/.dev.vars` / `apps/web/.dev.vars`、gitignore 済み。雛形は `.dev.vars.example`）に各種シークレットが必要です。詳細は [`SETUP-NOTES.md`](./SETUP-NOTES.md) を参照してください。

## Architecture Notes

- **RSC ファースト** — 既定で Server Component。インタラクティブな部分のみ最小スコープの Client Component に切り出し、`Suspense` + `ErrorBoundary` で包む
- **画像** — `next/image` を直接使わず `@components/image` 経由。`/_next/image` を Worker 層で Cloudflare Images バインディングへルーティング
- **SSR とキャッシュ** — web は ISR を使わず SSR + Workers Cache（HTML は `max-age=0, s-maxage=…`）。CMS の書込みで cms の `afterChange` フックが `env.WEB.purge()` を呼び、キャッシュを全消しする（`.claude/rules/workers-cache.md`）
- **シード** — `apps/cms/src/seed/data/*.json` を single source of truth とし、slug をキーに冪等 upsert

## License

個人サイトのため、コードの再利用・改変は想定していません（参考閲覧用）。`src/assets` 等の画像・コンテンツの著作権は napochaan に帰属します。
