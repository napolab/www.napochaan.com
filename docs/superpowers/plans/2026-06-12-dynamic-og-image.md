# Dynamic OG Image Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Detail pages (`blog/[id]`, `works/[id]`, `news/[id]`) emit a dynamically generated, brand-styled `og:image` (1200×630) built with `next/og`.

**Architecture:** Next.js App Router file-convention `opengraph-image.tsx` per detail segment. Each route fetches its record, normalizes it through pure helpers, and renders a Satori card: left info column + right field (Game-of-Life board when no image, rectangular thumbnail when an image exists). The `napochaan.` wordmark is a pre-rendered transparent PNG of the real digibop EchoText (Satori can't embed Typekit). Japanese titles break on 文節 via BudouX. The GoL board reuses the production `life.ts` engine.

**Tech Stack:** `next/og` (Satori + resvg-wasm) on `@opennextjs/cloudflare`, BudouX (`@utils/phrase`), `@components/game-of-life/life`, LINE Seed JP (OTF) + Geist Mono (subset), vitest (node) for pure-function TDD.

**Spec:** `docs/superpowers/specs/2026-06-11-dynamic-og-image-design.md`

---

## File Structure

| File                                                              | Responsibility                                              |
| ----------------------------------------------------------------- | ----------------------------------------------------------- |
| `src/utils/og/section-label/index.ts`                             | pure: `'works'\|'news'\|'blog'` → `'WORKS'\|'NEWS'\|'BLOG'` |
| `src/utils/og/clamp-title/index.ts`                               | pure: title → BudouX 文節 chunks, clamped to a char budget  |
| `src/utils/og/og-life-board/index.ts`                             | pure: build a GoL board (cells + alive) via `life.ts`       |
| `src/utils/og/resolve-og-card-data/index.ts`                      | pure: record fields → `OgCardData`                          |
| `src/utils/og/load-og-fonts/index.ts`                             | fetch font ArrayBuffers for `ImageResponse`                 |
| `src/utils/og/og-card/index.tsx`                                  | Satori JSX renderer (`OgCard`, `SIZE`, `CONTENT_TYPE`)      |
| `src/assets/og/wordmark.png`                                      | digibop EchoText transparent PNG (committed asset)          |
| `public/og/LINESeedJP-Bold.otf`, `public/og/GeistMono-subset.ttf` | fonts served via ASSETS                                     |
| `src/app/(site)/{works,news,blog}/[id]/opengraph-image.tsx`       | thin route wrappers                                         |
| `src/utils/seo/resolve-detail-metadata/index.ts`                  | MODIFY: drop explicit images for detail routes              |

`og-card/index.tsx` is **Satori-land**: it uses inline `style` objects (not Panda CSS, not `@components/image`). This is a deliberate exception — document it with a top-of-file comment. All other files follow project rules (arrow fns, no `let`, no barrel, colocated `*.test.ts`).

---

## Phase 0 — Spike (de-risk before building)

### Task 0: Prove `next/og` runs on this OpenNext build

**Files:**

- Create (temporary): `src/app/(site)/news/[id]/opengraph-image.tsx`

- [ ] **Step 1: Minimal ImageResponse on one route**

```tsx
import { ImageResponse } from 'next/og';

export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

const Image = () => {
  return new ImageResponse(
    (
      <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f1f2f5', fontSize: 64 }}>
        og spike: napochaan
      </div>
    ),
    size,
  );
};

export default Image;
```

- [ ] **Step 2: Build for Cloudflare**

Run: `pnpm build` (this runs `opennextjs-cloudflare build`)
Expected: build completes; note the reported worker bundle size.

- [ ] **Step 3: Preview and fetch the PNG**

Run the local preview the project uses (e.g. `pnpm preview` / `wrangler dev` per package.json), then:
`curl -s -o /tmp/og.png -w "%{http_code} %{content_type}\n" http://localhost:8787/news/<any-seeded-id>/opengraph-image`
Expected: `200 image/png`, and `/tmp/og.png` opens as a 1200×630 image.

- [ ] **Step 4: Record spike outcome in the spec**

Append a "Spike results" note to the spec §2: does `next/og` work? bundle size delta? Decide **font load method** (runtime fetch vs Data-import bundle) from the measured size. If `next/og` does NOT work after reasonable effort, STOP and reconsider `workers-og` (spec §2) before continuing.

- [ ] **Step 5: Remove the spike file**

```bash
git rm src/app/\(site\)/news/\[id\]/opengraph-image.tsx 2>/dev/null || rm "src/app/(site)/news/[id]/opengraph-image.tsx"
```

(The real route is added in Task 8.) Do not commit the spike.

---

## Phase 1 — Assets

### Task 1: Add Satori-compatible fonts

**Files:**

- Create: `public/og/LINESeedJP-Bold.otf`
- Create: `public/og/GeistMono-subset.ttf`

- [ ] **Step 1: Obtain LINE Seed JP OTF**

Download the **OTF** (not woff2 — Satori can't decode woff2) from the official LINE Seed OFL release and place at `public/og/LINESeedJP-Bold.otf`. Keep the bundled `LICENSE.txt` alongside the existing woff2 license.

- [ ] **Step 2: Obtain a Latin-only Geist Mono subset**

From Google Fonts (OFL), export **Geist Mono** subset to Latin + digits + punctuation (`U+0020-007E` plus `·×—●`) as TTF → `public/og/GeistMono-subset.ttf` (~15–30KB).

- [ ] **Step 3: Verify both load**

Run: `node -e "const f=require('fs'); for(const p of ['public/og/LINESeedJP-Bold.otf','public/og/GeistMono-subset.ttf']) console.log(p, f.statSync(p).size)"`
Expected: both print non-zero sizes.

- [ ] **Step 4: Commit**

```bash
git add public/og/
git commit -m "feat(og): add Satori-compatible fonts (LINE Seed JP OTF, Geist Mono subset)"
```

### Task 2: Add the digibop wordmark PNG asset

**Files:**

- Create: `src/assets/og/wordmark.png`
- Create: `docs/superpowers/notes/og-wordmark-regen.md`

The transparent PNG was already produced during design at `reports/og-mockups/echo-wordmark.png` (real digibop EchoText, green-keyed). Re-use it; document regeneration.

- [ ] **Step 1: Copy the produced asset into source**

```bash
mkdir -p src/assets/og
cp reports/og-mockups/echo-wordmark.png src/assets/og/wordmark.png
```

- [ ] **Step 2: Document the regeneration procedure**

Write `docs/superpowers/notes/og-wordmark-regen.md` describing: (1) on `https://stg.napochaan.com/` isolate `span[role="img"][aria-label*="napochaan"]`, (2) screenshot it on a `#00ff00` field at DPR 2, (3) green-key + despill + crop with PIL (see `reports/og-mockups/key.py`). Re-generate only when the wordmark design changes.

- [ ] **Step 3: Verify dimensions**

Run: `node -e "const{execSync}=require('child_process');console.log(execSync('file src/assets/og/wordmark.png').toString())"`
Expected: PNG, ~1549×379, with alpha.

- [ ] **Step 4: Commit**

```bash
git add src/assets/og/wordmark.png docs/superpowers/notes/og-wordmark-regen.md
git commit -m "feat(og): add digibop wordmark PNG asset + regen note"
```

---

## Phase 2 — Pure helpers (TDD)

### Task 3: `section-label`

**Files:**

- Create: `src/utils/og/section-label/index.ts`
- Test: `src/utils/og/section-label/section-label.test.ts`

- [ ] **Step 1: Write the failing test**

```ts
import { describe, expect, it } from 'vitest';

import { sectionLabel, type OgSection } from './index';

describe('sectionLabel', () => {
  it('maps each section slug to its uppercase label', () => {
    expect(sectionLabel('works')).toBe('WORKS');
    expect(sectionLabel('news')).toBe('NEWS');
    expect(sectionLabel('blog')).toBe('BLOG');
  });

  it('is typed to the three known sections', () => {
    const sections: OgSection[] = ['works', 'news', 'blog'];
    expect(sections.map(sectionLabel)).toEqual(['WORKS', 'NEWS', 'BLOG']);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm vitest run src/utils/og/section-label/section-label.test.ts`
Expected: FAIL ("Cannot find module './index'").

- [ ] **Step 3: Write minimal implementation**

```ts
export type OgSection = 'works' | 'news' | 'blog';

// Uppercased section chip label (WORKS / NEWS / BLOG). Pure.
export const sectionLabel = (section: OgSection): string => section.toUpperCase();
```

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm vitest run src/utils/og/section-label/section-label.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/utils/og/section-label/
git commit -m "feat(og): add section-label helper"
```

### Task 4: `clamp-title` (BudouX 文節 + clamp)

**Files:**

- Create: `src/utils/og/clamp-title/index.ts`
- Test: `src/utils/og/clamp-title/clamp-title.test.ts`

- [ ] **Step 1: Write the failing test**

```ts
import { describe, expect, it } from 'vitest';

import { clampTitle } from './index';

describe('clampTitle', () => {
  it('returns BudouX phrase chunks unchanged when within budget', () => {
    const result = clampTitle('サイトを v3 にリニューアルしました', 40);
    expect(result.truncated).toBe(false);
    expect(result.chunks.join('')).toBe('サイトを v3 にリニューアルしました');
    expect(result.chunks.length).toBeGreaterThan(1); // segmented into 文節
  });

  it('keeps whole 文節 and appends an ellipsis when over budget', () => {
    const result = clampTitle('サイトを v3 にリニューアルしました', 8);
    expect(result.truncated).toBe(true);
    expect(result.chunks.at(-1)?.endsWith('…')).toBe(true);
    expect(result.chunks.join('').length).toBeLessThanOrEqual(9); // budget + ellipsis
  });

  it('hard-clips a single phrase that alone exceeds the budget', () => {
    const result = clampTitle('リニューアルしました', 4);
    expect(result.truncated).toBe(true);
    expect(result.chunks).toHaveLength(1);
    expect(result.chunks[0]?.endsWith('…')).toBe(true);
  });

  it('returns no chunks for empty input', () => {
    expect(clampTitle('', 10)).toEqual({ chunks: [], truncated: false });
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm vitest run src/utils/og/clamp-title/clamp-title.test.ts`
Expected: FAIL ("Cannot find module './index'").

- [ ] **Step 3: Write minimal implementation**

```ts
import { phrase } from '@utils/phrase';

export type ClampedTitle = { chunks: string[]; truncated: boolean };

type Acc = { chunks: string[]; count: number; done: boolean };

// Title split into BudouX 文節 chunks (for nowrap-chunk rendering in Satori),
// clamped to `maxChars`. Whole phrases are kept; when the budget is exceeded an
// ellipsis is appended to the last kept phrase. A first phrase longer than the
// budget is hard-clipped. Pure.
export const clampTitle = (title: string, maxChars: number): ClampedTitle => {
  const segments = phrase(title);
  if (segments.length === 0) return { chunks: [], truncated: false };

  const total = segments.reduce((n, s) => n + s.length, 0);
  if (total <= maxChars) return { chunks: segments, truncated: false };

  const kept = segments.reduce<Acc>(
    (acc, seg) => {
      if (acc.done || acc.count + seg.length > maxChars) return { ...acc, done: true };

      return { chunks: [...acc.chunks, seg], count: acc.count + seg.length, done: false };
    },
    { chunks: [], count: 0, done: false },
  ).chunks;

  if (kept.length === 0) {
    const head = title.slice(0, Math.max(1, maxChars - 1));

    return { chunks: [`${head}…`], truncated: true };
  }

  const [last] = kept.slice(-1);

  return { chunks: [...kept.slice(0, -1), `${last}…`], truncated: true };
};
```

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm vitest run src/utils/og/clamp-title/clamp-title.test.ts`
Expected: PASS (4 tests).

- [ ] **Step 5: Commit**

```bash
git add src/utils/og/clamp-title/
git commit -m "feat(og): add clamp-title (BudouX phrase chunks + clamp)"
```

### Task 5: `og-life-board` (reuse production `life.ts`)

**Files:**

- Create: `src/utils/og/og-life-board/index.ts`
- Test: `src/utils/og/og-life-board/og-life-board.test.ts`

- [ ] **Step 1: Write the failing test**

```ts
import { describe, expect, it } from 'vitest';

import { ogLifeBoard } from './index';

describe('ogLifeBoard', () => {
  it('is deterministic for a fixed seed', () => {
    const a = ogLifeBoard(10, 8, { seed: 42 });
    const b = ogLifeBoard(10, 8, { seed: 42 });
    expect(a.alive).toBe(b.alive);
    expect(a.cells).toEqual(b.cells);
  });

  it('reports board dimensions and a positive alive count', () => {
    const board = ogLifeBoard(20, 12, { seed: 7 });
    expect(board.cols).toBe(20);
    expect(board.rows).toBe(12);
    expect(board.alive).toBeGreaterThan(0);
    expect(board.cells).toHaveLength(board.alive);
  });

  it('flags red cells by the production formula (x*31 + y*17) % 23 === 0', () => {
    const board = ogLifeBoard(20, 12, { seed: 7 });
    for (const cell of board.cells) {
      expect(cell.red).toBe((cell.x * 31 + cell.y * 17) % 23 === 0);
      expect(cell.x).toBeLessThan(20);
      expect(cell.y).toBeLessThan(12);
    }
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm vitest run src/utils/og/og-life-board/og-life-board.test.ts`
Expected: FAIL ("Cannot find module './index'").

- [ ] **Step 3: Write minimal implementation**

```ts
import { countAlive, createGrid, seedRandom, step, type Grid } from '@components/game-of-life/life';

export type LifeCell = { x: number; y: number; red: boolean };
export type OgLifeBoard = { cells: LifeCell[]; alive: number; cols: number; rows: number };
export type OgLifeBoardOptions = { seed?: number; density?: number; steps?: number };

// Deterministic LCG so the OG board is identical across builds (the OG is
// generated at build / revalidate time — no need for Math.random).
const makeRand = (seed: number): (() => number) => {
  const state = { value: seed >>> 0 };

  return () => {
    state.value = (state.value * 1103515245 + 12345) & 0x7fffffff;

    return state.value / 0x7fffffff;
  };
};

const advance = (grid: Grid, steps: number): Grid => Array.from({ length: steps }).reduce<Grid>((g) => step(g), grid);

// Build a Game-of-Life board for the OG field, reusing the production engine
// (src/components/game-of-life/life.ts). Returns only the live cells (with the
// production red-cell flag) plus the alive count. Pure given the seed.
export const ogLifeBoard = (cols: number, rows: number, options?: OgLifeBoardOptions): OgLifeBoard => {
  const rand = makeRand(options?.seed ?? 20260612);
  const seeded = seedRandom(createGrid(cols, rows), options?.density ?? 0.16, rand);
  const grid = advance(seeded, options?.steps ?? 8);

  const cells = [...grid.cells].flatMap((value, index) => {
    if (value !== 1) return [];

    const x = index % cols;
    const y = Math.floor(index / cols);

    return [{ x, y, red: (x * 31 + y * 17) % 23 === 0 }];
  });

  return { cells, alive: countAlive(grid), cols, rows };
};
```

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm vitest run src/utils/og/og-life-board/og-life-board.test.ts`
Expected: PASS (3 tests).

- [ ] **Step 5: Commit**

```bash
git add src/utils/og/og-life-board/
git commit -m "feat(og): add og-life-board (reuses production life.ts engine)"
```

### Task 6: `resolve-og-card-data`

**Files:**

- Create: `src/utils/og/resolve-og-card-data/index.ts`
- Test: `src/utils/og/resolve-og-card-data/resolve-og-card-data.test.ts`

- [ ] **Step 1: Write the failing test**

```ts
import { describe, expect, it } from 'vitest';

import { resolveOgCardData } from './index';

describe('resolveOgCardData', () => {
  it('uppercases the label and clamps the title into chunks', () => {
    const data = resolveOgCardData({ section: 'news', title: 'サイトを v3 にリニューアルしました', meta: '2026.06.11' });
    expect(data.label).toBe('NEWS');
    expect(data.title.chunks.length).toBeGreaterThan(0);
    expect(data.meta).toBe('2026.06.11');
  });

  it('flags hasImage when a non-empty image url is present', () => {
    const withImage = resolveOgCardData({ section: 'works', title: 'X', meta: 'm', imageUrl: 'https://r2/x.jpg' });
    expect(withImage.hasImage).toBe(true);
    expect(withImage.imageUrl).toBe('https://r2/x.jpg');
  });

  it('treats an empty/absent image url as no image', () => {
    expect(resolveOgCardData({ section: 'news', title: 'X', meta: 'm', imageUrl: '' }).hasImage).toBe(false);
    expect(resolveOgCardData({ section: 'news', title: 'X', meta: 'm' }).hasImage).toBe(false);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm vitest run src/utils/og/resolve-og-card-data/resolve-og-card-data.test.ts`
Expected: FAIL ("Cannot find module './index'").

- [ ] **Step 3: Write minimal implementation**

```ts
import { clampTitle, type ClampedTitle } from '../clamp-title';
import { sectionLabel, type OgSection } from '../section-label';

// Title char budget tuned for the 432px info column at ~33px. The spike / first
// real render confirms the exact value; adjust here only.
const TITLE_MAX_CHARS = 24;

export type OgCardInput = {
  section: OgSection;
  title: string;
  meta: string;
  // Caller coerces Payload NULL → undefined at the boundary.
  imageUrl?: string;
};

export type OgCardData = {
  label: string;
  title: ClampedTitle;
  hasImage: boolean;
  imageUrl?: string;
  meta: string;
};

// Normalizes a detail record into the card's render inputs. Pure.
export const resolveOgCardData = (input: OgCardInput): OgCardData => {
  const hasImage = input.imageUrl !== undefined && input.imageUrl !== '';

  return {
    label: sectionLabel(input.section),
    title: clampTitle(input.title, TITLE_MAX_CHARS),
    hasImage,
    imageUrl: hasImage ? input.imageUrl : undefined,
    meta: input.meta,
  };
};
```

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm vitest run src/utils/og/resolve-og-card-data/resolve-og-card-data.test.ts`
Expected: PASS (3 tests).

- [ ] **Step 5: Commit**

```bash
git add src/utils/og/resolve-og-card-data/
git commit -m "feat(og): add resolve-og-card-data"
```

---

## Phase 3 — Fonts loader + Satori renderer

### Task 7: `load-og-fonts`

**Files:**

- Create: `src/utils/og/load-og-fonts/index.ts`

> No unit test: this is I/O (`fetch`). It is exercised by the route + spike. Method (fetch vs Data-import) is confirmed by Task 0; this task implements the fetch variant. If the spike chose bundling, replace the body with `import jp from '../../../../public/og/LINESeedJP-Bold.otf'` (Data binding) and return those ArrayBuffers instead.

- [ ] **Step 1: Implement**

```ts
export type OgFont = { name: string; data: ArrayBuffer; weight: 400 | 700; style: 'normal' };

// Loads the two Satori fonts from the site's own ASSETS (served from public/og).
// `origin` is the request origin (e.g. https://napochaan.com). Results are cached
// by the OG route's ISR entry, so this fetch runs only on (re)generation.
export const loadOgFonts = async (origin: string): Promise<OgFont[]> => {
  const [jp, mono] = await Promise.all([
    fetch(`${origin}/og/LINESeedJP-Bold.otf`).then((r) => r.arrayBuffer()),
    fetch(`${origin}/og/GeistMono-subset.ttf`).then((r) => r.arrayBuffer()),
  ]);

  return [
    { name: 'LINE Seed JP', data: jp, weight: 700, style: 'normal' },
    { name: 'Geist Mono', data: mono, weight: 400, style: 'normal' },
  ];
};
```

- [ ] **Step 2: Typecheck**

Run: `pnpm typecheck`
Expected: no errors in this file.

- [ ] **Step 3: Commit**

```bash
git add src/utils/og/load-og-fonts/
git commit -m "feat(og): add load-og-fonts (fetch from ASSETS)"
```

### Task 8: `og-card` Satori renderer

**Files:**

- Create: `src/utils/og/og-card/index.tsx`
- Test: `src/utils/og/og-card/og-card.test.tsx`

The renderer returns a Satori JSX tree. We unit-test the **structure** (label text, title chunks, image-vs-GoL branch, cell count) by walking the returned element's props — not by rasterizing.

- [ ] **Step 1: Write the failing test**

```tsx
import { describe, expect, it } from 'vitest';

import { OgCard, SIZE } from './index';

// Recursively collect all string children in the element tree.
const texts = (node: unknown): string[] => {
  if (typeof node === 'string') return [node];
  if (Array.isArray(node)) return node.flatMap(texts);
  if (node && typeof node === 'object' && 'props' in node) return texts((node as { props: { children?: unknown } }).props.children);

  return [];
};

const baseData = { label: 'NEWS', title: { chunks: ['サイトを', 'リニューアル'], truncated: false }, meta: '2026.06.11', hasImage: false } as const;

describe('OgCard', () => {
  it('exposes the 1200x630 size', () => {
    expect(SIZE).toEqual({ width: 1200, height: 630 });
  });

  it('renders the label and every title chunk', () => {
    const tree = OgCard({ data: baseData, wordmarkUrl: 'data:img', board: { cells: [], alive: 0, cols: 1, rows: 1 } });
    const all = texts(tree).join('|');
    expect(all).toContain('NEWS');
    expect(all).toContain('サイトを');
    expect(all).toContain('リニューアル');
  });

  it('shows alive count from the board when there is no image', () => {
    const board = { cells: [{ x: 0, y: 0, red: false }], alive: 1, cols: 2, rows: 2 };
    const tree = OgCard({ data: baseData, wordmarkUrl: 'data:img', board });
    expect(texts(tree).join('|')).toContain('alive 1');
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm vitest run src/utils/og/og-card/og-card.test.tsx`
Expected: FAIL ("Cannot find module './index'").

- [ ] **Step 3: Implement the renderer**

```tsx
// SATORI-LAND: this file renders for next/og (Satori), NOT the DOM. It therefore
// uses inline `style` objects (no Panda CSS, no @components/image) and only
// flexbox layout — Satori supports neither CSS grid nor `word-break: auto-phrase`.
import type { OgCardData } from '../resolve-og-card-data';
import type { OgLifeBoard } from '../og-life-board';

export const SIZE = { width: 1200, height: 630 } as const;
export const CONTENT_TYPE = 'image/png' as const;

const INK = 'oklch(0.185 0.020 265)';
const CANVAS = 'oklch(0.952 0.004 265)';
const MUTED = 'oklch(0.430 0.018 265)';
const SUBTLE = 'oklch(0.560 0.016 265)';
const BLUE = 'rgb(26,52,255)';
const BLUE_CELL = 'rgba(26,52,255,0.92)';
const RED_CELL = 'rgba(255,0,43,0.85)';
const COL_W = 432;
const CELL = 24;
const MONO = 'Geist Mono';
const JP = 'LINE Seed JP';

type Props = {
  data: OgCardData;
  wordmarkUrl: string; // data: URL or absolute URL of the digibop PNG
  board: OgLifeBoard; // GoL board for the field (used when !hasImage)
};

const Field = ({ data, board }: { data: OgCardData; board: OgLifeBoard }) => {
  if (data.hasImage) {
    return (
      <div style={{ position: 'absolute', left: COL_W, top: 0, right: 0, bottom: 0, display: 'flex', borderLeft: `2px solid ${INK}` }}>
        <img src={data.imageUrl} width={1200 - COL_W} height={630} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
      </div>
    );
  }

  return (
    <div style={{ position: 'absolute', left: COL_W, top: 0, right: 0, bottom: 0, display: 'flex' }}>
      {board.cells.map((c) => (
        <div
          key={`${c.x}-${c.y}`}
          style={{ position: 'absolute', left: c.x * CELL + 1, top: c.y * CELL + 1, width: CELL - 2, height: CELL - 2, background: c.red ? RED_CELL : BLUE_CELL }}
        />
      ))}
    </div>
  );
};

// Returns the Satori element tree. Exported as a plain function (not a JSX
// component used by React) so the route can pass it straight to ImageResponse.
export const OgCard = ({ data, wordmarkUrl, board }: Props) => {
  return (
    <div style={{ width: '100%', height: '100%', position: 'relative', display: 'flex', background: CANVAS, color: INK }}>
      <Field data={data} board={board} />

      {/* left info column */}
      <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: COL_W, display: 'flex', flexDirection: 'column', padding: 40, background: CANVAS, borderRight: `2px solid ${INK}` }}>
        <div style={{ fontFamily: MONO, fontSize: 13, letterSpacing: 2, color: MUTED }}>NAPOCHAAN.COM</div>
        <div style={{ display: 'flex', marginTop: 22 }}>
          <div style={{ background: BLUE, color: '#fff', padding: '5px 12px', fontFamily: MONO, fontSize: 15 }}>{data.label}</div>
        </div>
        <div style={{ display: 'flex', flexWrap: 'wrap', marginTop: 18, fontFamily: JP, fontWeight: 700, fontSize: 33, lineHeight: 1.24, letterSpacing: '-0.02em' }}>
          {data.title.chunks.map((chunk, i) => (
            <span key={`${i}-${chunk}`} style={{ whiteSpace: 'nowrap' }}>{chunk}</span>
          ))}
        </div>
        <div style={{ display: 'flex', marginTop: 'auto' }}>
          <img src={wordmarkUrl} width={344} height={84} style={{ width: 344, height: 'auto' }} />
        </div>
        <div style={{ marginTop: 14, fontFamily: MONO, fontSize: 12, letterSpacing: 2, color: SUBTLE }}>{data.meta}</div>
      </div>

      {/* field system text (only meaningful for the GoL state) */}
      <div style={{ position: 'absolute', left: COL_W + 28, top: 40, display: 'flex', fontFamily: MONO, fontSize: 12, letterSpacing: 2, color: BLUE }}>{`alive ${board.alive}`}</div>
      <div style={{ position: 'absolute', right: 44, bottom: 40, display: 'flex', fontFamily: MONO, fontSize: 12, letterSpacing: 2, color: data.hasImage ? '#fff' : BLUE }}>gen 0042</div>
    </div>
  );
};
```

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm vitest run src/utils/og/og-card/og-card.test.tsx`
Expected: PASS (3 tests).

> Note: `*.test.tsx` runs in the browser/DOM vitest pool per project routing — that's fine, the test only inspects the returned object, it does not mount it.

- [ ] **Step 5: Commit**

```bash
git add src/utils/og/og-card/
git commit -m "feat(og): add Satori og-card renderer (column + GoL/image field)"
```

---

## Phase 4 — Routes

### Task 9: `news/[id]/opengraph-image.tsx`

**Files:**

- Create: `src/app/(site)/news/[id]/opengraph-image.tsx`

- [ ] **Step 1: Implement the route**

```tsx
import { ImageResponse } from 'next/og';

import wordmark from '@assets/og/wordmark.png';

import { findNewsById } from '@lib/payload/news';
import { dayjs } from '@utils/dayjs';
import { loadOgFonts } from '@utils/og/load-og-fonts';
import { ogLifeBoard } from '@utils/og/og-life-board';
import { CONTENT_TYPE, OgCard, SIZE } from '@utils/og/og-card';
import { resolveOgCardData } from '@utils/og/resolve-og-card-data';

export const size = SIZE;
export const contentType = CONTENT_TYPE;

type Params = { params: Promise<{ id: string }> };

const FIELD_COLS = Math.ceil((SIZE.width - 432) / 24);
const FIELD_ROWS = Math.ceil(SIZE.height / 24);

const Image = async ({ params }: Params) => {
  const { id } = await params;
  const item = await findNewsById(id);
  const baseUrl = process.env.BASE_URL ?? 'http://localhost:3000';

  const data = resolveOgCardData({
    section: 'news',
    title: item?.title ?? 'news',
    meta: `${item ? dayjs(item.publishedAt).tz('Asia/Tokyo').format('YYYY.MM.DD') : ''} · og:image · 1200×630`,
    // news has no image source → always the GoL field
  });

  const board = ogLifeBoard(FIELD_COLS, FIELD_ROWS, { seed: id.length * 9973 + 17 });
  const fonts = await loadOgFonts(baseUrl);

  return new ImageResponse(<OgCard data={data} wordmarkUrl={`${baseUrl}${wordmark.src}`} board={board} />, { ...size, fonts });
};

export default Image;
```

> If the spike found `process.env.BASE_URL` unavailable in the OG runtime, import `getCloudflareContext` from `@opennextjs/cloudflare` and read `getCloudflareContext().env.BASE_URL` instead. Confirm during this task and keep whichever works.

- [ ] **Step 2: Build + fetch the PNG**

Run `pnpm build` then preview, and:
`curl -s -o /tmp/news-og.png -w "%{http_code}\n" http://localhost:8787/news/<seeded-id>/opengraph-image`
Expected: `200`; `/tmp/news-og.png` shows the column + GoL field card.

- [ ] **Step 3: Commit**

```bash
git add "src/app/(site)/news/[id]/opengraph-image.tsx"
git commit -m "feat(og): dynamic og:image for news detail (GoL field)"
```

### Task 10: `works/[id]/opengraph-image.tsx`

**Files:**

- Create: `src/app/(site)/works/[id]/opengraph-image.tsx`

- [ ] **Step 1: Implement the route**

```tsx
import { ImageResponse } from 'next/og';

import wordmark from '@assets/og/wordmark.png';

import { findWorkById } from '@lib/payload/works';
import { loadOgFonts } from '@utils/og/load-og-fonts';
import { ogLifeBoard } from '@utils/og/og-life-board';
import { CONTENT_TYPE, OgCard, SIZE } from '@utils/og/og-card';
import { resolveOgCardData } from '@utils/og/resolve-og-card-data';

export const size = SIZE;
export const contentType = CONTENT_TYPE;

type Params = { params: Promise<{ id: string }> };

const FIELD_COLS = Math.ceil((SIZE.width - 432) / 24);
const FIELD_ROWS = Math.ceil(SIZE.height / 24);

const Image = async ({ params }: Params) => {
  const { id } = await params;
  const work = await findWorkById(id);
  const baseUrl = process.env.BASE_URL ?? 'http://localhost:3000';

  const data = resolveOgCardData({
    section: 'works',
    title: work?.title ?? 'works',
    meta: `no.${id} · ${work?.category ?? 'works'}`,
    imageUrl: work?.thumbnail?.src ?? undefined, // present → image field; absent → GoL
  });

  const board = ogLifeBoard(FIELD_COLS, FIELD_ROWS, { seed: id.length * 9973 + 31 });
  const fonts = await loadOgFonts(baseUrl);

  return new ImageResponse(<OgCard data={data} wordmarkUrl={`${baseUrl}${wordmark.src}`} board={board} />, { ...size, fonts });
};

export default Image;
```

> `work.thumbnail.src` must be an absolute, fetchable URL (R2 public URL), NOT the `/_next/image` transformer path (spec §7). If `findWorkById` returns a relative path, prefix `baseUrl`. Confirm the shape and adjust this line only.

- [ ] **Step 2: Build + fetch the PNG (with and without a thumbnail)**

Preview, then fetch a work id that has a thumbnail and one that doesn't:
`curl -s -o /tmp/works-og.png -w "%{http_code}\n" http://localhost:8787/works/<id>/opengraph-image`
Expected: `200`; image card when thumbnail exists, GoL card when it doesn't.

- [ ] **Step 3: Commit**

```bash
git add "src/app/(site)/works/[id]/opengraph-image.tsx"
git commit -m "feat(og): dynamic og:image for works detail (image or GoL field)"
```

### Task 11: `blog/[id]/opengraph-image.tsx`

**Files:**

- Create: `src/app/(site)/blog/[id]/opengraph-image.tsx`

- [ ] **Step 1: Implement the route**

```tsx
import { ImageResponse } from 'next/og';

import wordmark from '@assets/og/wordmark.png';

import { findBlogById } from '@lib/payload/blog';
import { firstImageSrc } from '@utils/lexical/first-image-src';
import { dayjs } from '@utils/dayjs';
import { loadOgFonts } from '@utils/og/load-og-fonts';
import { ogLifeBoard } from '@utils/og/og-life-board';
import { CONTENT_TYPE, OgCard, SIZE } from '@utils/og/og-card';
import { resolveOgCardData } from '@utils/og/resolve-og-card-data';

export const size = SIZE;
export const contentType = CONTENT_TYPE;

type Params = { params: Promise<{ id: string }> };

const FIELD_COLS = Math.ceil((SIZE.width - 432) / 24);
const FIELD_ROWS = Math.ceil(SIZE.height / 24);

const Image = async ({ params }: Params) => {
  const { id } = await params;
  const post = await findBlogById(id);
  const baseUrl = process.env.BASE_URL ?? 'http://localhost:3000';

  const data = resolveOgCardData({
    section: 'blog',
    title: post?.title ?? 'blog',
    meta: `${post ? dayjs(post.publishedAt).tz('Asia/Tokyo').format('YYYY.MM.DD') : ''} · blog`,
    imageUrl: firstImageSrc(post?.body) ?? undefined, // first body image → image field; else GoL
  });

  const board = ogLifeBoard(FIELD_COLS, FIELD_ROWS, { seed: id.length * 9973 + 53 });
  const fonts = await loadOgFonts(baseUrl);

  return new ImageResponse(<OgCard data={data} wordmarkUrl={`${baseUrl}${wordmark.src}`} board={board} />, { ...size, fonts });
};

export default Image;
```

> Reuse `firstImageSrc` (already used by `resolve-detail-metadata`). Confirm its import path (`@utils/lexical/first-image-src`) and that the returned URL is absolute/fetchable; prefix `baseUrl` if relative.

- [ ] **Step 2: Build + fetch the PNG**

Preview, then:
`curl -s -o /tmp/blog-og.png -w "%{http_code}\n" http://localhost:8787/blog/<id>/opengraph-image`
Expected: `200`; image card when the post body has an image, else GoL.

- [ ] **Step 3: Commit**

```bash
git add "src/app/(site)/blog/[id]/opengraph-image.tsx"
git commit -m "feat(og): dynamic og:image for blog detail (image or GoL field)"
```

---

## Phase 5 — Metadata cleanup

### Task 12: Stop `resolveDetailMetadata` from emitting explicit images

**Files:**

- Modify: `src/utils/seo/resolve-detail-metadata/index.ts`
- Modify: `src/utils/seo/resolve-detail-metadata/resolve-detail-metadata.test.ts`

The file-convention `opengraph-image.tsx` now wires `og:image` / `twitter:image` automatically for detail routes. Keeping explicit `images` here would override it. Remove the `images` arrays (and the now-unused image resolution) from this helper. Keep `resolveSectionMetadata` untouched (sections still use `og-default.png`).

- [ ] **Step 1: Update the test to assert NO images are emitted**

Replace assertions that expect `openGraph.images` / `twitter.images` with:

```ts
it('does not emit explicit og/twitter images (file-convention owns them)', () => {
  const meta = resolveDetailMetadata({
    docTitle: 'Example',
    path: '/works/1',
    genericDescription: 'works',
    defaultImage: '/og-default.png',
  });
  expect(meta.openGraph && 'images' in meta.openGraph ? meta.openGraph.images : undefined).toBeUndefined();
  expect(meta.twitter && 'images' in meta.twitter ? meta.twitter.images : undefined).toBeUndefined();
});
```

Delete or adjust any existing test cases that asserted specific image URLs from this helper.

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm vitest run src/utils/seo/resolve-detail-metadata/resolve-detail-metadata.test.ts`
Expected: FAIL (helper still returns `images`).

- [ ] **Step 3: Remove image emission from the helper**

In `resolve-detail-metadata/index.ts`: delete `resolveImage`, the `imageCandidates`/`defaultImage` usage in the returned object, and the `images` keys inside `openGraph` and `twitter`. Keep the `ResolveDetailMetadataArgs` fields (`imageCandidates`, `defaultImage`) optional-and-ignored OR drop them and update the three call sites. Simplest: keep the args (callers unchanged) but stop reading them for images. Returned object's `openGraph` keeps `type/siteName/locale/url/title/description`; `twitter` keeps `card/title/description`.

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm vitest run src/utils/seo/resolve-detail-metadata/resolve-detail-metadata.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/utils/seo/resolve-detail-metadata/
git commit -m "refactor(seo): detail metadata delegates og:image to opengraph-image route"
```

---

## Phase 6 — Verify

### Task 13: Full build, preview, and review

- [ ] **Step 1: Lint + typecheck**

Run: `pnpm lint && pnpm typecheck`
Expected: both pass. (If `og-card/index.tsx` trips inline-style or no-`let` rules, add a scoped `oxlint-disable` with the SATORI-LAND justification comment — Satori requires inline styles.)

- [ ] **Step 2: Run the full OG test suite**

Run: `pnpm vitest run src/utils/og`
Expected: all pass.

- [ ] **Step 3: Production build + preview, visually verify all three**

`pnpm build` → preview, then open each in a browser / curl:

- `/news/<id>/opengraph-image` → column + GoL field
- `/works/<id-with-thumb>/opengraph-image` → column + image field
- `/works/<id-no-thumb>/opengraph-image` → column + GoL field
- `/blog/<id>/opengraph-image` → image or GoL per body

Also verify the page `<head>` references the route: view-source a detail page and confirm `og:image` points at `…/opengraph-image` and `twitter:card` is `summary_large_image`.

- [ ] **Step 4: Validate the card against the design**

Compare to `reports/og-mockups/final-gol-boost.png` / `final-img2.png`: title breaks on 文節, digibop wordmark crisp, GoL boosted blue + red accents, labels uppercase, alive count present.

- [ ] **Step 5: Launch difit for review**

Start difit and request review (per project rule: review before declaring done). Do NOT commit beyond the per-task commits already made; do not push.

---

## Notes for the implementer

- **Pure helpers obey project rules**: arrow functions only, no `let`, no `forEach`, no wrapper coercion (`x !== undefined` not `Boolean(x)`), colocated `*.test.ts`, import via aliases (`@utils/*`, `@components/*`, `@lib/*`, `@assets/*`).
- **`og-card/index.tsx` is the one exception**: Satori needs inline `style`. Mark it with the SATORI-LAND comment and scoped lint-disables only where required.
- **Determinism**: the GoL seed is derived from the record id so each card is stable across rebuilds but varies per record.
- **Null coercion at the boundary**: routes coerce Payload `null` → `undefined` (`?? undefined`) before passing to `resolveOgCardData` (function-arg-types rule).
- **ISR (spec §8)**: add `export const revalidate = 3600;` to each `opengraph-image.tsx` to mirror the detail page's revalidate, so the generated PNG sits in the R2 incremental cache and refreshes on the same cadence. Add it alongside `size`/`contentType` in Tasks 9–11.
- **If the Task 0 spike fails** (next/og won't run on OpenNext 1.18): stop and revisit `workers-og` (spec §2) — the pure helpers (Tasks 3–6) and assets (Tasks 1–2) are reusable regardless of renderer.
