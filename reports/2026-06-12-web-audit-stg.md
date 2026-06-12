# Web Resource Audit Report — stg.napochaan.com

- Target: https://stg.napochaan.com
- Analyzed at: 2026-06-12T03:39Z (JST 12:39)
- Tool: web-audit-tools/3.4.0 web-resource-checker

## Files Found

| File          | Status        | Critical | Important | Recommended |
| ------------- | ------------- | -------- | --------- | ----------- |
| sitemap.xml   | Found / Valid | 0        | 0         | 1           |
| robots.txt    | Found         | 1        | 0         | 1           |
| security.txt  | Not Found     | 0        | 1         | 0           |
| llms.txt      | Found / Valid | 0        | 0         | 2           |
| llms-full.txt | Found / Valid | 0        | 0         | 1           |

## Issues — with codebase context

### robots.txt — `Disallow: /` (checker: Critical → 実際は意図どおり)

Staging は `src/app/robots.ts` + `src/utils/robots/build-robots` が
`isProduction = (BASE_URL === 'https://www.napochaan.com')` で判定し、
非 production では全ブロック + sitemap ディレクティブなし、という設計。
コードコメントにも "non-production hosts must block crawlers" と明記されている。

→ **対応不要**。staging が index されない防波堤として正しく機能している。
checker の "missing Sitemap directive" も同じ分岐の意図的な挙動。

production (`www.napochaan.com`) では allow + DISALLOWED_PATHS
(`/admin`, `/api`, `/next/`, 各 `preview`) + sitemap が出る実装になっている。

### security.txt — Not Found (Important)

`/.well-known/security.txt` (RFC 9116) が無い。これは staging 固有ではなく
production にも無いはず（route が存在しない）。個人サイトでも脆弱性報告窓口
(`Contact: mailto:...` + `Expires:`) を置く価値はある。

→ 対応するなら `src/app/.well-known/security.txt/route.ts` を追加。
必須フィールドは `Contact` と `Expires`(180日〜1年先) の 2 つだけ。

### sitemap.xml — 9/61 URLs missing `<lastmod>` (Recommended)

CMS 由来の詳細ページは lastmod を持っているが、静的ページ
(home / about / works / news / blog / log など 9 件) に lastmod が無い。

→ 対応するなら `src/app/sitemap.ts` で静的ページにビルド時 or
コンテンツ更新日ベースの lastmod を付与。優先度は低い。

### llms.txt / llms-full.txt — summary が短い (Recommended)

summary = `> おそろしき、なんでも屋。` (12 chars)。checker は「LLM の文脈理解の
ために長く」と言うが、これはサイトのタグラインそのものであり意図的なコピー。
直下の About セクションに肩書き情報もあるため実害は小さい。

→ 変えるならタグラインの後に 1 行説明を足す形（タグライン自体は保持）。
`## Optional` セクション欠如も llmstxt.org の任意項目で、現状 5 セクション
25 リンクと充実しているため対応不要と判断。

## Summary

- Files checked: 5 (4 found)
- 真に対応価値があるのは **security.txt の新設** のみ
- robots.txt の Critical は staging の意図的ブロックで誤検知
- sitemap lastmod / llms.txt summary は低優先度の任意改善
