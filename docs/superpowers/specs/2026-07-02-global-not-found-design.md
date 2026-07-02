# 共通 404 ページ配線 — Design

Date: 2026-07-02
Status: Approved

## 問題

未マッチ URL(例: `https://napochaan.com/this-page-does-not-exist`)が Next.js 組み込みの無地
「404 This page could not be found」で表示される。

原因: このプロジェクトは `(site)` / `(payload)` の 2 つの route group がそれぞれ root layout を持つ
multiple root layouts 構成。`src/app/` 直下に `layout.tsx` が存在しないため、グローバルな
`app/not-found.tsx` を置けない。既存のスタイル済み 404(`src/app/(site)/not-found.tsx`,
ErrorScreen ベース)は `(site)` 内のページが `notFound()` を呼んだ時(存在しない blog slug 等)
のみ使われ、ルーティング自体が未マッチの URL には届かない。

## 解決策

`(site)` 直下に catch-all route を 1 つ追加し、`notFound()` を呼ぶ。

```
src/app/(site)/[...not-found]/
├── page.tsx                 # notFound() を呼ぶだけの Server Component
└── page.test.ts             # default export が NEXT_HTTP_ERROR_FALLBACK;404 を throw することを確認
```

- どのルートにもマッチしない URL(全深度: `/foobar`, `/works/a/b` など)がこの catch-all に
  マッチし、`notFound()` により既存の `(site)/not-found.tsx` が SiteShell 内・HTTP 404 で表示される。

## 検討した代替案

1. **catch-all route(採用)** — 1 ファイル追加。multiple root layouts 構成での定石。
2. root layout を単一化して `app/not-found.tsx` を置く — (payload) と (site) の `<html>` が
   別物なので大規模リストラになる。過剰。
3. `global-not-found.tsx`(experimental) — Next.js 15.4+ の実験機能。現行 15.3.9 では使えない。

## 影響範囲・安全性

- **既存ルートへの影響なし**: Next.js は静的セグメントを dynamic セグメントより優先してマッチする。
  `/admin/*`・`/api/*`((payload) 側)、`robots.txt`・`sitemap.xml`・`llms.txt`・`/next/*`、
  `(home)` の `/` はすべて catch-all より先に解決される。
- **メタデータ**: 404 レンダリングには Next.js が自動で `noindex` を付与する。追加対応不要。
- **エラーハンドリング**: 既存の `error.tsx` / `global-error.tsx` は変更しない。
- **ISR/OpenNext**: catch-all は動的レンダリング。現状の組み込み 404 も worker で SSR されて
  いるため、負荷特性は変わらない。

## テスト

- `page.test.ts`(node 環境): default export を呼ぶと `notFound()` 由来のエラーが throw される
  ことを assert。
- 手動確認: dev server で `/this-page-does-not-exist` にアクセスし、ErrorScreen 404 と
  HTTP 404 status を確認。既存ルート(`/`, `/works`, `/admin`, `/robots.txt`)が影響を
  受けないことも確認。

## 変更しないもの

- `src/app/(site)/not-found.tsx`(既存 404 の見た目・文言)
- ErrorScreen コンポーネント
- (payload) route group
