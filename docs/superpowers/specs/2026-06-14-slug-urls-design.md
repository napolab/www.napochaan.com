# Slug-based detail URLs for works / blog / news

Date: 2026-06-14
Status: Approved (design)

## Goal

Replace the numeric detail URLs (`/works/{id}`, `/blog/{id}`, `/news/{id}`) with
human-meaningful slug URLs (`/works/{slug}`, `/blog/{slug}`, `/news/{slug}`).

## Decisions (locked)

| Question                 | Decision                                                                                                |
| ------------------------ | ------------------------------------------------------------------------------------------------------- |
| Slug source              | Manual, editor-entered `slug` field in the admin (no auto-romanization)                                 |
| Field constraints        | `required` + `unique`, validated `^[a-z0-9]+(?:-[a-z0-9]+)*$` (lowercase kebab)                         |
| Backward compatibility   | None. Clean `[id]` → `[slug]` cut; numeric URLs simply stop existing                                    |
| Scope                    | `works`, `blog`, `news` public detail pages + their RSS `<link>`                                        |
| Preview routes           | Stay `id`-keyed (`/{collection}/preview/[id]`) — authenticated, no SEO, robust against unset draft slug |
| Existing-record slugs    | napochaan-authored slugs, drafted for review, then baked into seed JSON + a backfill migration          |
| Migration backfill match | `title`-match hardcoded `title → slug` map applied via `payload.update()`                               |

External-url items (works/news rows with the `url` field set) still carry a
required slug. Their internal detail route 404s exactly as it does today — slugs
do not change external-link behaviour.

## Architecture

The change spans six layers. Each is independently understandable and testable.

### 1. CMS — shared `slug` field factory

New `src/collections/fields/slug.ts` exporting a `slugField()` factory so the
validation contract lives in one place (OCP — collections extend, they don't
re-declare rules):

```ts
// src/collections/fields/slug.ts
import type { Field } from 'payload';

const SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

export const slugField = (): Field => ({
  name: 'slug',
  label: 'スラッグ (URL)',
  type: 'text',
  required: true,
  unique: true,
  index: true,
  admin: {
    position: 'sidebar',
    description: 'URL に使う英数字の識別子。小文字英数字とハイフンのみ（例: v3-renewal-blog）。',
  },
  validate: (value: string | string[] | null | undefined): true | string => {
    if (typeof value !== 'string' || value.length === 0) return 'スラッグは必須です。';
    if (!SLUG_PATTERN.test(value)) return '小文字英数字とハイフンのみ使用できます（先頭・末尾・連続ハイフン不可）。';

    return true;
  },
});
```

Added to `works.ts`, `news.ts`, `blog.ts` `fields` arrays. `unique: true` is
per-collection (a works slug and a blog slug may coincide).

`useAsTitle` stays `title`. No change to `defaultColumns` is required, though
`slug` may optionally be surfaced there.

### 2. Data access — lookup by slug

In `src/lib/payload/{works,news,blog}/index.ts`:

- Replace the public reader `find{Work,News,Blog}ById` with
  `find{Work,News,Blog}BySlug(slug: string)` — same `unstable_cache` wrapper, new
  cache key (`'works-by-slug'` etc.), `where: { and: [{ slug: { equals: slug } }, publishedWhere] }`.
- Keep `find{Work,News,Blog}DraftById` unchanged (preview path, id-keyed).
- The row types gain `slug: string`:
  - `WorkRow` (`src/app/(site)/works/_lib/work-row/index.ts`)
  - `NewsItem` (`src/app/(site)/news/_lib/news-item/index.ts`)
  - `Post` (blog row type)
- The `to-{work,news,blog}-item` mappers carry `doc.slug` through.
- `find-work` / `find-post` and the `adjacent-*` helpers match on `slug` instead
  of `id` (their `id` parameter becomes `slug`).

`slug` is required in the CMS, so the mappers treat it as a guaranteed string.

### 3. Routing

Rename the dynamic segment directories:

- `src/app/(site)/works/[id]` → `works/[slug]`
- `src/app/(site)/news/[id]` → `news/[slug]`
- `src/app/(site)/blog/[id]` → `blog/[slug]`

Inside each page:

- `params` type `{ id }` → `{ slug }`.
- `generateStaticParams` maps to `{ slug: row.slug }`.
- `generateMetadata` resolves by slug; `path` / canonical become `/{collection}/{slug}`.
- `notFound()` when the slug resolves to nothing (unchanged control flow).

`preview/[id]` directories are untouched. The admin `livePreview.url` config
(`payload.config.ts`) keeps building `/{collection}/preview/{id}`.

### 4. Link construction (id → slug)

Every internal detail link switches from `row.id` to `row.slug`:

| File                                                              | Current                                                 |
| ----------------------------------------------------------------- | ------------------------------------------------------- |
| `src/app/(site)/page.tsx`                                         | `item.url ?? \`/news/${item.id}\``                      |
| `src/app/(site)/_components/works-section/index.tsx`              | `/works/${work.id}`                                     |
| `src/app/(site)/_components/blog-index/index.tsx`                 | `/blog/${post.id}`                                      |
| `src/app/(site)/_components/news-section/*`                       | news links                                              |
| `src/app/(site)/works/_components/works-archive/index.tsx`        | `/works/${work.id}`                                     |
| `src/app/(site)/works/[slug]/_components/related-works/index.tsx` | `/works/${work.id}`                                     |
| `src/app/(site)/works/[slug]/_components/adjacent-nav/index.tsx`  | `/works/${slot.work.id}`                                |
| `src/app/(site)/works/[slug]/page.tsx`                            | `absoluteUrl(\`/works/${id}\`)` (ShareBar / WorkDetail) |
| `src/app/(site)/blog/_components/post-list/post-card.tsx`         | `/blog/${post.id}`                                      |
| `src/app/(site)/blog/[slug]/_components/blog-nav/index.tsx`       | `/blog/${slot.item.id}`                                 |
| `src/app/(site)/blog/[slug]/page.tsx`                             | `absoluteUrl(\`/blog/${id}\`)`                          |
| `src/app/(site)/news/_components/news-archive/index.tsx`          | `item.url ?? \`/news/${item.id}\``                      |
| `src/app/(site)/news/_components/news-nav/index.tsx`              | `/news/${slot.item.id}`                                 |
| `src/app/(site)/news/_components/news-detail/index.tsx`           | `absoluteUrl(\`/news/${item.id}\`)`                     |
| `src/app/(site)/log/_lib/build-log-timeline/index.ts`             | `/works/${work.id}`                                     |

External-link rows keep `item.url ?? …` — only the internal fallback changes.

The `news-pinned-strip` admin link (`/admin/collections/news/${doc.id}`) is an
admin route and stays id-based.

### 5. Revalidate hook — detail path by slug

`createPublishedTagAndPathRevalidateHooks`'s third argument currently builds the
ISR detail path from the doc `id`. Generalize it to read the doc's `slug`:

- Change the detail-path builder signature from `(id) => string` to
  `(doc) => string | undefined`, and add a `readSlug(doc)` helper alongside the
  existing `readId`.
- Collections pass `(doc) => isString(doc.slug) ? \`/works/${doc.slug}\` : undefined`.
- Unpublish/delete still bust the correct ISR path because the slug is on the doc.

Other callers of the factory (gallery/logs/profile, if any pass a detail-path
builder) are audited and migrated or left unchanged if they pass no builder.

### 6. Feeds & resource files

Emit slug URLs:

- `src/app/(site)/works/rss.xml/route.ts` — `linkOf` + `guid`
- `src/app/(site)/news/rss.xml/route.ts`
- `src/app/(site)/blog/rss.xml/route.ts`
- `src/app/sitemap.ts`
- `src/app/llms.txt`, `src/app/llms-full.txt`

RSS `link`/`guid` for external-url rows keep pointing at `work.url` where that is
already the behaviour.

## Seed + migration

### Seed JSON

Add `"slug": "…"` to every entry in `src/seed/data/works.json`,
`news.json`, `blog.json`. `seed/export.ts` strips only `SYSTEM_KEYS` and passes
arbitrary fields through, so `slug` round-trips on export automatically; `import`
inserts it with no special handling.

### Migration (live D1)

`pnpm payload migrate:create add_slug` produces a migration that:

1. Adds the `slug` column (+ unique index) to `works`, `news`, `blog` and their
   `_v` version tables.
2. Backfills existing rows via a hardcoded `title → slug` map using
   `payload.create`-style `payload.update()` (per the payload-cms rule: never raw
   SQL for versioned collections — the `_v` table must be updated too).
3. Is idempotent: skip rows that already have a slug.

The `title → slug` map is the napochaan-reviewed slug list (see below).

### Slug authoring workflow

The full slug list was drafted from every title and reviewed/approved (2026-06-14).
The same map feeds both the seed JSON edits and the migration backfill.

Conventions applied:

- People / proper nouns romanized; descriptive parts in English; lowercase kebab.
- Version-tagged works carry the full patch version with dots written as hyphens
  (`napochaan-v3-0-0`).
- The 佐久間洋司 exhibition series uses official English titles as a shared prefix:
  拡張される音楽 = **Augmented Music**, 共に在る音楽 = **Coexisting Music**,
  思弁的な音楽 = **Speculative Music**, r-906《額縁の言葉》= **Frame Words**.
- `unique` is per-collection, so a works slug and a news slug for the same real
  event intentionally coincide (e.g. `coexisting-music-demixus`).

#### Approved `title → slug` map

**works** (sorted by date, matching `works.json`)

| date       | title                                          | slug                              |
| ---------- | ---------------------------------------------- | --------------------------------- |
| 2019-02-02 | 名取さなさんのタスク管理ファンアプリ           | `natori-sana-task-app`            |
| 2019-03-16 | 名取さなさんのファン AR アプリ                 | `natori-sana-ar-app`              |
| 2020-02-13 | soelu.com lessons ページ                       | `soelu-lessons-page`              |
| 2020-03-31 | soelu.com instructors ページ                   | `soelu-instructors-page`          |
| 2020-04-10 | v1.0.0 www.napochaan.com                       | `napochaan-v1-0-0`                |
| 2021-01-17 | 447Records TANA                                | `447records-tana`                 |
| 2021-03-24 | flat-工房 買取アプリ                           | `flat-kobo-kaitori-app`           |
| 2021-08-16 | Project BLUE Official HP                       | `project-blue-hp`                 |
| 2022-03-01 | LGTM ジェネレータ                              | `lgtm-generator`                  |
| 2022-08-05 | flatkobo.shop ネットショップ UI                | `flatkobo-shop-ui`                |
| 2023-03-26 | v2.0.0 www.napochaan.com                       | `napochaan-v2-0-0`                |
| 2023-08-05 | 熱異常 / シャノン REMIX テクニカルサポート     | `shannon-netsuijou-remix-support` |
| 2023-08-07 | 2023夏ボカコレランキングアーカイブ             | `vocacolle-2023-summer-archive`   |
| 2023-09-14 | オリジナル名刺                                 | `original-business-card`          |
| 2023-12-19 | シャノン 第一象徴体系 LP                       | `shannon-symbol-system-lp`        |
| 2023-12-20 | 大阪関西国際芸術祭2023「多面体、鏡面」         | `augmented-music-polyhedron`      |
| 2024-01-24 | 楽曲「デュレエ」関連データ解析                 | `duree-data-analysis`             |
| 2024-01-24 | StudioGnu HP                                   | `studio-gnu-hp`                   |
| 2024-02-23 | UTAU 彼方公式 HP                               | `utau-kanata-hp`                  |
| 2024-03-01 | flat-工房 HP 制作サポート                      | `flat-kobo-hp-support`            |
| 2024-06-22 | Hono Conf 2024 登壇                            | `hono-conf-2024`                  |
| 2024-08-01 | Workers Tech Talk #3 登壇                      | `workers-tech-talk-3`             |
| 2024-09-14 | 工房祭ステージシステム「ファイブブロッカー」   | `five-blocker-stage-system`       |
| 2024-10-12 | 燭 / MusicVideo Coding Advisor                 | `shoku-mv-coding-advisor`         |
| 2024-12-01 | ボカコレ2024冬 ランキングアーカイブ            | `vocacolle-2024-winter-archive`   |
| 2024-12-12 | 共に在る音楽 煮ル果実 DEMiXUS システム         | `coexisting-music-demixus`        |
| 2024-12-12 | 共に在る音楽 椎乃味醂xももえ システム          | `coexisting-music-shiino-momoe`   |
| 2025-01-01 | ヘイロー化ギミック booth 販売                  | `halo-gimmick-booth`              |
| 2025-03-15 | AHUB UMANITY アルバム HP                       | `ahub-umanity-hp`                 |
| 2025-04-17 | VRChat AKAGE オマージュ動画                    | `vrchat-akage-homage`             |
| 2025-05-03 | まだ知らない君がいる 一部映像提供              | `mada-shiranai-kimi-video`        |
| 2025-06-01 | VRChat イベントポスター                        | `vrchat-event-poster`             |
| 2025-07-07 | BirthdayWebSite ristill.club 2025              | `ristill-birthday-2025`           |
| 2025-08-01 | ボカコレ2025夏 アーカイブ                      | `vocacolle-2025-summer-archive`   |
| 2025-09-13 | VRC PIXELART EXHIBITION 2.0 ドットレカギミック | `vrc-pixelart-exhibition-2`       |
| 2025-11-16 | 椎乃味醂「解釈系 / ハーモニー」特設サイト      | `shiino-harmony-site`             |
| 2025-12-06 | Vket2025Winter「PrizeSpider」ギミック          | `vket-2025-winter-prizespider`    |
| 2025-12-10 | 思弁的な音楽 r-906《額縁の言葉:I》             | `speculative-music-frame-words`   |
| 2026-01-18 | ハーモニー ペア決めあみだくじシステム          | `harmony-amidakuji-system`        |
| 2026-04-12 | VRDJイベント Booth2Booth 公式サイト            | `booth2booth-site`                |
| 2026-05-05 | #ProjectCircles モーション制作                 | `projectcircles-motion`           |
| 2026-06-09 | v3.0.0 www.napochaan.com                       | `napochaan-v3-0-0`                |

**news** (sorted by publishedAt, matching `news.json`)

| date       | title                                      | slug                            |
| ---------- | ------------------------------------------ | ------------------------------- |
| 2023-12-20 | 拡張される音楽「多面体、鏡面」@ 大阪 2023  | `augmented-music-osaka-2023`    |
| 2024-06-22 | Hono Conference 2024 に登壇                | `hono-conf-2024`                |
| 2024-08-01 | Cloudflare Workers Tech Talks in Tokyo #3  | `workers-tech-talks-3`          |
| 2024-11-29 | 拡張される音楽「多面体、鏡面」システム構築 | `augmented-music-system`        |
| 2024-12-12 | 共に在る音楽 煮ル果実DEMiXUS システム構築  | `coexisting-music-demixus`      |
| 2024-12-12 | 共に在る音楽 椎乃味醂xももえ システム構築  | `coexisting-music-shiino-momoe` |
| 2025-12-10 | 思弁的な音楽 r-906《額縁の言葉:I》         | `speculative-music-frame-words` |
| 2026-04-12 | Booth²Booth の立ち上げ                     | `booth2booth-launch`            |
| 2026-05-05 | #ProjectCircles モーキャプ提供             | `projectcircles-mocap`          |
| 2026-06-10 | DJ・VJ の出演依頼について                  | `dj-vj-booking`                 |

**blog** (sorted by publishedAt, matching `blog.json`)

| date       | title                                   | slug                      |
| ---------- | --------------------------------------- | ------------------------- |
| 2026-06-10 | www.napochaan.com v3.0.0 の制作について | `napochaan-v3-0-0-making` |
| 2026-06-13 | VJ ソフト(Genovese)を作っている         | `genovese-vj-software`    |

## Testing (TDD)

- `slugField` validate: accepts `a`, `a-b`, `v3-renewal-blog`; rejects ``,
`Aa`, `a_b`, `a--b`, `-a`, `a-`, `あ`.
- `find{Work,News,Blog}BySlug`: returns the matching published row; `undefined`
  for unknown / draft-only slug (mock payload client).
- `find-work` / `find-post`: match by slug.
- `adjacent-*`: prev/next resolved against the slug key.
- Revalidate hook: detail path built from `doc.slug`; omitted when slug absent.
- RSS / sitemap: assert slug URLs in output.

## Out of scope

- No redirect layer for old numeric URLs (backward compat explicitly waived).
- Preview routes remain id-keyed.
- No auto-slug generation from title.
- Gallery / logs collections (no public slug detail page).

## Build / verification order

1. `slugField` factory + collection wiring + tests.
2. Migration scaffold (column add) — verify `pnpm payload migrate` locally.
3. Slug authoring + review → seed JSON + migration backfill map.
4. Data-access readers (`…BySlug`) + row types + mappers + tests.
5. Route rename + `generateStaticParams` / metadata.
6. Link-site sweep + revalidate hook.
7. Feeds + sitemap + llms.
8. `pnpm lint && pnpm typecheck`, then difit review.
