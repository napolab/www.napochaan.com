# Content Sections Implementation Plan (Plan 4)

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development. Checkbox (`- [ ]`) steps.

**Goal:** spec §6 で確定した content-driven UI（hero / news=ログ / works=版面表 / gigs=縦timeline / gallery=グリッド吸着+lightbox / blog=番号付き読み物index / about=whoami）を、既存 primitive・署名コンポーネントの上に実装し、index ページを組み立てる。データは props（サンプル）で受け、Plan 5(CMS)で Payload から供給する。

**Architecture:** 再利用パターン（Timeline / Gallery）は `src/components/`（showcase 必須）。サイト固有のコンテンツ section は `src/app/(site)/_components/<name>/`（showcase 不要・TDD 必須）。各 section は presentational（props でデータ受領、`null` を入力契約に持ち込まない＝呼び出し側で `?? undefined` 変換）。既存を再利用: `Table`(works) / `SectionHeading` / `Tag` / `SystemAnnotation` / `Heading` / `Link` / `Figure` / `EchoText` / `Marquee` / `RichText`(blog記事)。

**Tech Stack:** React 19（section は極力 RSC、interactive のみ `'use client'`：Gallery lightbox = react-aria `DialogTrigger`/`Modal`/`Dialog`）, Panda CSS, vitest browser。

**前提 token / primitive:** Plan 1-3 で確定済（colors semantic, fonts, spacing inline/element/block/section, sizes, borderWidths, lineHeights jp, layerStyle focusRing 等）。`.claude/rules/` 全順守（root style 名・namespace import・no-child-selectors→data-\*/`_before`・semantic-html・arrow・no let/forEach/any/!・function-arg-types: 入力は `T?`、`T|null` 禁止）。per-task commit 承認済（husky 通過必須・CLAUDE.md は add しない）。

---

## File Structure

| #   | unit                          | path                                                                       | 再利用                                           |
| --- | ----------------------------- | -------------------------------------------------------------------------- | ------------------------------------------------ |
| 1   | Timeline（縦・軌跡）          | `src/components/timeline/` (+showcase)                                     | gigs が使用                                      |
| 2   | Gallery（grid-snap+lightbox） | `src/components/gallery/` (+showcase)                                      | gallery section が使用                           |
| 3   | Hero                          | `src/app/(site)/_components/hero/`                                         | EchoText/SystemAnnotation/Marquee                |
| 4   | NewsSection                   | `src/app/(site)/_components/news-section/`                                 | SectionHeading/Tag/SystemAnnotation/Link         |
| 5   | WorksSection                  | `src/app/(site)/_components/works-section/`                                | SectionHeading + `@components/table`             |
| 6   | GigsSection                   | `src/app/(site)/_components/gigs-section/`                                 | SectionHeading + Timeline                        |
| 7   | GallerySection                | `src/app/(site)/_components/gallery-section/`                              | SectionHeading + Gallery                         |
| 8   | BlogIndex                     | `src/app/(site)/_components/blog-index/`                                   | SectionHeading/Heading/Tag/SystemAnnotation/Link |
| 9   | AboutWhoami                   | `src/app/(site)/_components/about-whoami/`                                 | SectionHeading/SystemAnnotation/Tag              |
| 10  | index 組み立て                | `src/app/(site)/page.tsx` + `src/components/site-shell` に SiteFooter 追加 | 全 section + sample data                         |

---

## Task 1: Timeline（再利用・縦タイムライン）

DJ/VJ 出演履歴用の汎用縦タイムライン。日付軸 + 点 + 線、`upcoming` は accent(青)強調、過去は muted。data-driven。

**Files:** `src/components/timeline/{index.tsx,styles.css.ts,timeline.test.tsx}` + `src/app/(design-system)/components/timeline/page.tsx`

- [ ] **Step 1: test** — `timeline.test.tsx`

```tsx
import { render } from 'vitest-browser-react';
import { describe, expect, it } from 'vitest';
import { page } from 'vitest/browser';

import { Timeline } from './index';

const items = [
  { id: '1', date: '06/14', label: 'next gig @ club', meta: 'Tokyo', upcoming: true },
  { id: '2', date: '04/02', label: 'techno set @ venue', meta: 'DJ' },
];

describe('Timeline', () => {
  it('renders a list of events', async () => {
    await render(<Timeline items={items} />);
    await expect.element(page.getByText('next gig @ club')).toBeInTheDocument();
    await expect.element(page.getByText('techno set @ venue')).toBeInTheDocument();
  });
  it('marks upcoming items via data attribute', async () => {
    await render(<Timeline items={items} />);
    await expect.element(page.getByTestId('timeline-item-1')).toHaveAttribute('data-upcoming', 'true');
  });
});
```

- [ ] **Step 2: FAIL** (`pnpm test -- --project browser src/components/timeline/timeline.test.tsx`)
- [ ] **Step 3: implement** — props:

```ts
type TimelineItem = { id: string; date: string; label: string; meta?: string; upcoming?: boolean };
type Props = { items: TimelineItem[] };
```

`<ol className={styles.root}>` → per item `<li data-testid={`timeline-item-${id}`} data-upcoming={upcoming ? 'true' : undefined} className={styles.item}>`: a date (`styles.date`, mono), a dot (`styles.dot`), label (`styles.label`), optional meta (`styles.meta`, mono muted). The vertical spine + dot via styles (use `_before`/positioning, NOT child selectors — each li styles its own dot element). `&[data-upcoming="true"]` on item → dot bg accent.solid, date/label color accent.text; default dot border gray-8 outline, muted. Render dot as its own `<span className={styles.dot} aria-hidden="true" />`. Spine: a left border on `root` (`borderLeftWidth hairline borderColor gray-7`) with item paddingLeft, OR a styled element — keep no-child-selector (root has border-left, items have padding + absolute dots). data-driven so each element gets its class.

- [ ] **Step 4: PASS** — [ ] **Step 5: showcase** (past + upcoming items) — [ ] **Step 6: commit** `feat(ui): Timeline component (vertical, upcoming accent highlight)`

---

## Task 2: Gallery（再利用・grid-snap 可変スパン + lightbox）

フライヤー/VRChat 写真。24px グリッド吸着の可変スパン grid。クリックで lightbox（react-aria Modal）拡大。`'use client'`（Modal interactive）。

**Files:** `src/components/gallery/{index.tsx,styles.css.ts,gallery.test.tsx}` + showcase

- [ ] **Step 1: test** — `gallery.test.tsx`

```tsx
import { render } from 'vitest-browser-react';
import { describe, expect, it } from 'vitest';
import { page } from 'vitest/browser';

import { Gallery } from './index';

const items = [
  { id: 'a', src: '/a.jpg', alt: 'flyer a', width: 400, height: 600, span: 'portrait' as const },
  { id: 'b', src: '/b.jpg', alt: 'photo b', width: 800, height: 450, span: 'wide' as const },
];

describe('Gallery', () => {
  it('renders all images as triggers', async () => {
    await render(<Gallery items={items} />);
    await expect.element(page.getByRole('img', { name: 'flyer a' })).toBeInTheDocument();
    await expect.element(page.getByRole('img', { name: 'photo b' })).toBeInTheDocument();
  });
  it('opens a lightbox dialog when an item is activated', async () => {
    await render(<Gallery items={items} />);
    await page.getByRole('button', { name: /flyer a/ }).click();
    await expect.element(page.getByRole('dialog')).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: FAIL**
- [ ] **Step 3: implement** (`'use client'`) — props:

```ts
type GalleryItem = { id: string; src: string; alt: string; width: number; height: number; span?: 'square' | 'portrait' | 'wide' | 'tall' };
type Props = { items: GalleryItem[] };
```

- grid: `styles.root` = `display:grid; gridTemplateColumns:repeat(6,1fr); gridAutoRows:'[78px]'; gap:'[2px]'` (or border tokens), 2px ink frame. Each item is a react-aria `DialogTrigger` wrapping a `Button` (the thumbnail) + a `Modal`/`Dialog` (lightbox). The Button has accessible name = alt (so test `getByRole('button', { name: /flyer a/ })`). Thumbnail uses `@components/image` `Image` (the project image wrapper — DO NOT use next/image directly per images.md). span → `data-span` selector setting gridColumn/gridRow span (square 1x1, portrait 2x3, wide 3x2, tall 2x3, etc.). Lightbox `Dialog` shows the large `Image` + a close `Button` + caption (alt). Focus ring uses layerStyle focusRing (RAC focus states via data-attrs).
- Use `@components/image` `Image` for all images (images.md rule). Each Button aria-label or visually-hidden text = alt for the role-name query; the inner `<img>` alt also = alt.
- [ ] **Step 4: PASS** — [ ] **Step 5: showcase** (mixed spans) — [ ] **Step 6: commit** `feat(ui): Gallery (grid-snap variable span + react-aria lightbox)`

---

## Task 3: Hero（`src/app/(site)/_components/hero/`）

タイポ主役。EchoText の巨大 wordmark + kicker(mono) + lead(M PLUS 1) + 散らした SystemAnnotation。

**Files:** `hero/{index.tsx,styles.css.ts,hero.test.tsx}`

- [ ] **Step 1: test**

```tsx
import { render } from 'vitest-browser-react';
import { describe, expect, it } from 'vitest';
import { page } from 'vitest/browser';

import { Hero } from './index';

describe('Hero', () => {
  it('renders the wordmark and lead', async () => {
    await render(<Hero />);
    await expect.element(page.getByText('napochaan').first()).toBeInTheDocument();
    await expect.element(page.getByText(/相互作用/)).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: FAIL** — [ ] **Step 3: implement** — `<header className={styles.root}>`: kicker `<p className={styles.kicker} >// DJ · VJ · graphic · digital — since 2020</p>` (mono, accent.text, uppercase, letterSpacing wider), `<EchoText>napochaan</EchoText>` (+ a red `.` if desired — keep simple: just EchoText), lead `<p className={styles.lead}>相互作用するインターネットの実験場。影響と関係を、グリッドの上でデザインする。</p>` (M PLUS 1, lineHeight body, maxW). Optional scattered `<SystemAnnotation>` (5470009 / not found(danger) / coords) absolutely positioned — keep minimal/optional. No props needed (static), or accept `{ name?: string; lead?: string }` with defaults. — [ ] **Step 4: PASS** — [ ] **Step 5: commit** `feat(site): Hero section (EchoText wordmark + kicker + lead)`

---

## Task 4: NewsSection（system log list）

**Files:** `news-section/{index.tsx,styles.css.ts,news-section.test.tsx}`

- props: `type NewsItem = { id: string; date: string; category: string; title: string; href?: string }; type Props = { items: NewsItem[] }`.
- [ ] **Step 1: test**

```tsx
import { render } from 'vitest-browser-react';
import { describe, expect, it } from 'vitest';
import { page } from 'vitest/browser';

import { NewsSection } from './index';

const items = [{ id: '1', date: '2026.06.05', category: 'site', title: 'サイトを rebuild 中', href: '/news/1' }];

describe('NewsSection', () => {
  it('renders a news heading and entries', async () => {
    await render(<NewsSection items={items} />);
    await expect.element(page.getByRole('heading', { name: /news/ })).toBeInTheDocument();
    await expect.element(page.getByText('サイトを rebuild 中')).toBeInTheDocument();
    await expect.element(page.getByText('2026.06.05')).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: FAIL** — [ ] **Step 3: implement** — `<section>` with `<SectionHeading no="01">news</SectionHeading>` then a `<ol className={styles.log}>`; each item `<li className={styles.item}>`: date(`styles.date` mono accent), `<Tag tone="outline">{category}</Tag>`, title (Link if href else span). dashed bottom border per item (`styles.item` `&:last-child` none). hover row → bg/invert via `&:hover`. — [ ] **Step 4: PASS** — [ ] **Step 5: commit** `feat(site): NewsSection (system log list)`

---

## Task 5: WorksSection（版面インデックス表）

**Files:** `works-section/{index.tsx,styles.css.ts,works-section.test.tsx}`

- props: `type WorkRow = { id: string; no: string; title: string; type: string; year: string }; type Props = { works: WorkRow[] }`.
- Uses `@components/table` `Table` (columns no/title/type/year + an arrow).
- [ ] **Step 1: test**

```tsx
import { render } from 'vitest-browser-react';
import { describe, expect, it } from 'vitest';
import { page } from 'vitest/browser';

import { WorksSection } from './index';

const works = [{ id: '1', no: '01', title: 'night graphics vol.13', type: 'flyer', year: '2024' }];

describe('WorksSection', () => {
  it('renders works in a table under a heading', async () => {
    await render(<WorksSection works={works} />);
    await expect.element(page.getByRole('heading', { name: /works/ })).toBeInTheDocument();
    await expect.element(page.getByRole('table')).toBeInTheDocument();
    await expect.element(page.getByRole('cell', { name: 'night graphics vol.13' })).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: FAIL** — [ ] **Step 3: implement** — `<section><SectionHeading no="02">works</SectionHeading><Table columns={[{key:'no',label:'no'},{key:'title',label:'title'},{key:'type',label:'type'},{key:'year',label:'year'}]} rows={works.map(w => ({ no:w.no, title:w.title, type:w.type, year:w.year }))} /></section>`. — [ ] **Step 4: PASS** — [ ] **Step 5: commit** `feat(site): WorksSection (index table via Table primitive)`

---

## Task 6: GigsSection（縦タイムライン）

**Files:** `gigs-section/{index.tsx,styles.css.ts,gigs-section.test.tsx}`

- props: `type Gig = { id: string; date: string; event: string; venue?: string; upcoming?: boolean }; type Props = { gigs: Gig[] }`.
- Uses `@components/timeline` `Timeline`.
- [ ] **Step 1: test**

```tsx
import { render } from 'vitest-browser-react';
import { describe, expect, it } from 'vitest';
import { page } from 'vitest/browser';

import { GigsSection } from './index';

const gigs = [{ id: '1', date: '06/14', event: 'next gig @ club', venue: 'Tokyo', upcoming: true }];

describe('GigsSection', () => {
  it('renders gigs in a timeline under a heading', async () => {
    await render(<GigsSection gigs={gigs} />);
    await expect.element(page.getByRole('heading', { name: /gigs/ })).toBeInTheDocument();
    await expect.element(page.getByText('next gig @ club')).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: FAIL** — [ ] **Step 3: implement** — `<section><SectionHeading no="03">gigs</SectionHeading><Timeline items={gigs.map(g => ({ id:g.id, date:g.date, label:g.event, meta:g.venue, upcoming:g.upcoming }))} /></section>`. — [ ] **Step 4: PASS** — [ ] **Step 5: commit** `feat(site): GigsSection (vertical timeline via Timeline)`

---

## Task 7: GallerySection

**Files:** `gallery-section/{index.tsx,styles.css.ts,gallery-section.test.tsx}`

- props: `type Props = { items: GalleryItem[] }` (reuse `GalleryItem` shape from `@components/gallery`; import the type).
- [ ] **Step 1: test** — heading `/gallery/` + the Gallery renders an image. — [ ] **Step 2: FAIL** — [ ] **Step 3: implement** — `<section><SectionHeading no="04">gallery</SectionHeading><Gallery items={items} /></section>`. — [ ] **Step 4: PASS** — [ ] **Step 5: commit** `feat(site): GallerySection`

---

## Task 8: BlogIndex（番号付き読み物インデックス）

**Files:** `blog-index/{index.tsx,styles.css.ts,blog-index.test.tsx}`

- props: `type Post = { id: string; index: string; title: string; source: string; readMin: number; date: string; excerpt: string; href: string }; type Props = { posts: Post[] }`.
- [ ] **Step 1: test**

```tsx
import { render } from 'vitest-browser-react';
import { describe, expect, it } from 'vitest';
import { page } from 'vitest/browser';

import { BlogIndex } from './index';

const posts = [{ id: '1', index: '01', title: '静かなインターネットの話', source: '静か', readMin: 5, date: '2026.05.20', excerpt: '個人サイトを…', href: '/blog/1' }];

describe('BlogIndex', () => {
  it('renders posts with index, title and meta', async () => {
    await render(<BlogIndex posts={posts} />);
    await expect.element(page.getByRole('heading', { name: /blog/ })).toBeInTheDocument();
    await expect.element(page.getByRole('link', { name: /静かなインターネットの話/ })).toBeInTheDocument();
    await expect.element(page.getByText('5 min')).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: FAIL** — [ ] **Step 3: implement** — `<section><SectionHeading no="05">blog</SectionHeading>` + `<ol className={styles.list}>` per post `<li className={styles.post}>`: index(mono accent), title as `<Link href>` wrapping a `<Heading level={3}>`-ish (or styled span; use Link + visible title), meta row (`<Tag tone="outline">{source}</Tag>`, `{readMin} min`(SystemAnnotation), date(SystemAnnotation)), excerpt (M PLUS 1 muted, lineHeight jp). dashed divider per post. `5 min` text = `` `${readMin} min` ``. — [ ] **Step 4: PASS** — [ ] **Step 5: commit** `feat(site): BlogIndex (numbered reading index)`

---

## Task 9: AboutWhoami（whoami システム出力）

**Files:** `about-whoami/{index.tsx,styles.css.ts,about-whoami.test.tsx}`

- props: `type Props = { skills: string[]; now: string; likes: string; wants: string }` (all required; caller defaults).
- [ ] **Step 1: test**

```tsx
import { render } from 'vitest-browser-react';
import { describe, expect, it } from 'vitest';
import { page } from 'vitest/browser';

import { AboutWhoami } from './index';

describe('AboutWhoami', () => {
  it('renders a whoami block with skills', async () => {
    await render(<AboutWhoami skills={['TypeScript', 'Panda CSS']} now="DJ / VJ" likes="techno" wants="…" />);
    await expect.element(page.getByText('$ whoami')).toBeInTheDocument();
    await expect.element(page.getByText('TypeScript')).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: FAIL** — [ ] **Step 3: implement** — `<section><SectionHeading no="00">about</SectionHeading>` + `<div className={styles.who}>` (border 2px, bg subtle, font mono): a `$ whoami` line; rows `skills` (label + `skills.map(s => <Tag tone="blue">{s}</Tag>)`), `now`/`likes`/`wants` (key mono muted + value). Each row a flex line; key width fixed. — [ ] **Step 4: PASS** — [ ] **Step 5: commit** `feat(site): AboutWhoami (whoami system output)`

---

## Task 10: index 組み立て + SiteFooter を SiteShell へ

**Files:** `src/app/(site)/page.tsx`（全置換）, `src/components/site-shell/index.tsx`（SiteFooter 追加）

- [ ] **Step 1: SiteShell に footer** — `src/components/site-shell/index.tsx`: stage の後に `<SiteFooter />` を入れる（stage 内 or 直後、band の内側）。`import { SiteFooter } from '@components/site-footer'`. （SiteShell の既存テストは children 表示のみなので壊れない。footer が出ることを確認するテストを1つ追記してもよい。）
- [ ] **Step 2: index page** — `src/app/(site)/page.tsx` を全置換：`revalidate=3600` 維持。サンプルデータ定数（news/works/gigs/gallery/posts/about）をファイル内に定義（Plan 5 で Payload 取得に差し替え）。`<>` 内に順に: `<Hero />`, `<AboutWhoami {...about} />`, `<NewsSection items={news} />`, `<WorksSection works={works} />`, `<GigsSection gigs={gigs} />`, `<GallerySection items={gallery} />`, `<BlogIndex posts={posts} />`。`id="main-content"` は Hero or 最初の要素へ。`fade-in-heading` 依存は撤去（未使用なら削除可、ただし他参照が無いこと確認）。サンプル画像は `/placeholder.jpg` 等（存在しなくても Image は alt 表示）。
- [ ] **Step 3: 検証** — `pnpm lint && pnpm typecheck && pnpm test` 全 green。`pnpm dev` で index が hero/各 section/footer + 背景 life/band で表示されること（任意・目視）。
- [ ] **Step 4: commit** `feat(site): assemble index page with all content sections + footer in SiteShell`

---

## Self-Review

- **Spec §6 coverage:** hero(T3)/news(T4)/works(T5)/gigs(T6)/gallery(T7)/blog(T8)/about(T9) ＋ 再利用 Timeline(T1)/Gallery(T2) ＋ footer/組み立て(T10)。blog 記事本文は既存 `RichText`(Plan 2)で別途記事ページ（将来）。
- **placeholder scan:** 各 task に test + 構造 + 使用 primitive を明示。データは props（サンプルは page）。
- **type consistency:** section props は presentational・`T?`（`T|null` 禁止）。Gallery の `GalleryItem`/`span` を gallery-section が import。Timeline の `TimelineItem` を gigs が map。
- **rules:** \_components は showcase 不要・TDD 必須。src/components(Timeline/Gallery)は showcase 必須。images.md: 画像は `@components/image`。Gallery lightbox は react-aria。no-child-selectors（data-driven 要素ごと class）。

## 注意（実装者向け）

- section は RSC を基本。Gallery のみ `'use client'`（Modal）。GallerySection は Gallery を内包するだけなら RSC のままで可（client child を描画）。
- `getByRole('cell'/'table'/'dialog'/'img')` は実 DOM 準拠。RAC Modal は `role="dialog"`。Image モック（`src/__mocks__/next/image.tsx`）が `role="img"`+alt を出すか確認し、必要ならクエリを `getByAltText` に。
- サンプルデータは最小限（1-3件）。本番データは Plan 5。
