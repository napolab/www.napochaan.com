# Gallery Page Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** `/gallery` フルページを、skyline アルゴリズムによる可変幅 masonry（lightbox 付き・CSS columns フォールバック）で実装する。

**Architecture:** skyline パッキングを純関数 `pack()`（列吸着・可変スパン・順序保持）に切り出して TDD。client island `GalleryArchive` がコンテナ幅を `ResizeObserver` で計測し、`pack()` の結果で各セルを絶対配置する。幅未確定（SSR / JS無し）時は CSS `columns` フォールバックを描画する progressive enhancement。lightbox は既存 editorial `Gallery` から共有コンポーネントに抽出して再利用。

**Tech Stack:** Next.js 15 App Router (RSC) / React 19 / Panda CSS (`@styled/css`) / react-aria-components (Dialog) / vitest browser mode / next/image。

**Spec:** `docs/superpowers/specs/2026-06-08-gallery-page-design.md`

**前提（worktree セットアップ済み）:** branch `feat/gallery-page`、`.claude/worktrees/feat+gallery-page`、`pnpm install` 済み、`cloudflare-env.d.ts` は main の known-good を流用済み、`pnpm typecheck` green。

**実行コマンド規約:**

- 単一テスト: `pnpm vitest run <path>`（全スイートは重いので原則パス指定で回す）
- 完了ゲート: `pnpm lint && pnpm typecheck`
- ⚠️ fresh worktree で typecheck が `Cloudflare` namespace 系で落ちたら `rm -f tsconfig.tsbuildinfo` してから再実行（incremental cache 起因）。

**列数（確定）:** breakpoints は mobile`0` / tablet`480` / desktop`768`。列数 = base **2** / tablet **3** / desktop **4**。`resolveColumns(w)`: `w<480→2, w<768→3, else 4`。
**スパン（確定）:** `spanForAspect(ratio)`: `ratio(=width/height) >= 1.6 → 2`（VRChat 横）, それ以外 → `1`（flyer 縦・正方）。pack 側で `min(span, columns)` にクランプ。
**gap（確定）:** `2px`（root bg = `fg.default` で seam が方眼線に見える、editorial と統一）。

**スコープ外:** Payload CMS 連携 / カテゴリフィルタ UI / `/gallery/[id]` / skyline の look-ahead 最適化（v1 は順序安定な greedy。gaps は許容、必要なら後続）。

---

## Task 1: 共有 Lightbox を editorial Gallery から抽出

editorial `Gallery` の `GalleryCell` 内の react-aria lightbox（trigger button + Modal）を `components/gallery/lightbox/` に切り出し、editorial を差し替える。masonry でも同じものを使う。既存 `gallery.test.tsx` を **green のまま**維持する。

**Files:**

- Create: `src/components/gallery/lightbox/index.tsx`
- Create: `src/components/gallery/lightbox/styles.css.ts`
- Create: `src/components/gallery/lightbox/lightbox.test.tsx`
- Modify: `src/components/gallery/index.tsx`
- Modify: `src/components/gallery/styles.css.ts`
- Keep green: `src/components/gallery/gallery.test.tsx`（変更しない）

- [ ] **Step 1: Lightbox の失敗テストを書く**

`src/components/gallery/lightbox/lightbox.test.tsx`:

```tsx
import { render } from 'vitest-browser-react';
import { describe, expect, it } from 'vitest';
import { page } from 'vitest/browser';

import { Lightbox } from './index';

describe('Lightbox', () => {
  it('renders the trigger thumbnail (children) with an accessible name', async () => {
    await render(
      <Lightbox src="/a.jpg" alt="flyer a" width={400} height={600} triggerClassName="t">
        <img src="/a.jpg" alt="flyer a" />
      </Lightbox>,
    );
    await expect.element(page.getByRole('button', { name: /flyer a/ })).toBeInTheDocument();
  });

  it('opens a dialog showing the full image when activated', async () => {
    await render(
      <Lightbox src="/a.jpg" alt="flyer a" width={400} height={600} triggerClassName="t">
        <img src="/a.jpg" alt="flyer a" />
      </Lightbox>,
    );
    await page.getByRole('button', { name: /flyer a/ }).click();
    await expect.element(page.getByRole('dialog')).toBeInTheDocument();
  });

  it('closes when the overlay backdrop is clicked', async () => {
    await render(
      <Lightbox src="/a.jpg" alt="flyer a" width={400} height={600} triggerClassName="t">
        <img src="/a.jpg" alt="flyer a" />
      </Lightbox>,
    );
    await page.getByRole('button', { name: /flyer a/ }).click();
    await expect.element(page.getByRole('dialog')).toBeInTheDocument();

    const overlay = page.getByTestId('gallery-overlay').element();
    const fire = (type: string) => overlay.dispatchEvent(new PointerEvent(type, { bubbles: true, cancelable: true, clientX: 4, clientY: 4, pointerId: 1, isPrimary: true, button: 0 }));
    fire('pointerdown');
    fire('pointerup');
    overlay.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true, clientX: 4, clientY: 4 }));

    await expect.element(page.getByRole('dialog')).not.toBeInTheDocument();
  });
});
```

- [ ] **Step 2: 失敗を確認**

Run: `pnpm vitest run src/components/gallery/lightbox/lightbox.test.tsx`
Expected: FAIL（`./index` が無い / Lightbox undefined）

- [ ] **Step 3: Lightbox styles を作る（editorial から移設）**

`src/components/gallery/lightbox/styles.css.ts`（既存 `src/components/gallery/styles.css.ts` の `overlay` / `modal` / `dialog` / `modalImage` / `close` を**そのまま**移す）:

```ts
import { css } from '@styled/css';

// Dim backdrop that fills the viewport and centers the modal. isDismissable on the
// ModalOverlay closes the lightbox when this backdrop (outside the Modal) is clicked.
export const overlay = css({
  position: 'fixed',
  inset: '0',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  bg: '[oklch(0 0 0 / 0.8)]',
  zIndex: 'modal',
});

export const modal = css({
  display: 'flex',
  maxW: '[90vw]',
  maxH: '[90vh]',
});

export const dialog = css({
  position: 'relative',
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  gap: '4',
  outline: 'none',
  maxW: '[90vw]',
  maxH: '[90vh]',
});

// Cap the lightbox image height so a tall portrait never pushes the close
// button off-screen; width follows the aspect ratio (contain, no crop).
export const modalImage = css({
  width: 'auto',
  height: 'auto',
  maxW: '[88vw]',
  maxH: '[80vh]',
  objectFit: 'contain',
});

export const close = css({
  fontFamily: 'mono',
  fontSize: 'xs',
  color: 'fg.onSolid',
  bg: 'transparent',
  border: 'none',
  cursor: 'pointer',
  letterSpacing: 'wide',
  textTransform: 'uppercase',
  _focusVisible: {
    layerStyle: 'focusRing',
  },
  _hover: {
    color: 'accent.text',
  },
});
```

- [ ] **Step 4: Lightbox 本体を作る**

`src/components/gallery/lightbox/index.tsx`:

```tsx
'use client';

import { Button, Dialog, DialogTrigger, Modal, ModalOverlay } from 'react-aria-components';

import { Image } from '@components/image';
import { formatBlurURL } from '@components/image/helper';

import * as styles from './styles.css';

import type { ReactNode } from 'react';

type Props = {
  src: string;
  alt: string;
  width: number;
  height: number;
  // The layout-owned class for the trigger button (editorial vs masonry differ).
  triggerClassName: string;
  // The thumbnail rendered inside the trigger (each layout styles its own crop).
  children: ReactNode;
};

export const Lightbox = ({ src, alt, width, height, triggerClassName, children }: Props) => {
  return (
    <DialogTrigger>
      <Button className={triggerClassName} aria-label={alt}>
        {children}
      </Button>
      <ModalOverlay className={styles.overlay} isDismissable data-testid="gallery-overlay">
        <Modal className={styles.modal}>
          <Dialog className={styles.dialog} aria-label={alt}>
            {({ close }) => (
              <>
                <Image src={src} alt={alt} width={width} height={height} className={styles.modalImage} placeholder="blur" blurDataURL={formatBlurURL(src, { width: 16, blur: 20 })} />
                <Button onPress={close} className={styles.close}>
                  close
                </Button>
              </>
            )}
          </Dialog>
        </Modal>
      </ModalOverlay>
    </DialogTrigger>
  );
};
```

- [ ] **Step 5: Lightbox テストを通す**

Run: `pnpm vitest run src/components/gallery/lightbox/lightbox.test.tsx`
Expected: PASS（3 件）

- [ ] **Step 6: editorial Gallery を Lightbox 利用に差し替え**

`src/components/gallery/index.tsx` を以下に置換（`GalleryCell` が `Lightbox` を使う。modal 周りの直接実装を削除）:

```tsx
'use client';

import { useMemo } from 'react';

import { Image } from '@components/image';
import { formatBlurURL } from '@components/image/helper';

import { Lightbox } from './lightbox';
import * as styles from './styles.css';

import type { CSSProperties } from 'react';

// Named template areas defined by the gallery grid (see styles.css.ts). Each item
// is placed into exactly one, guaranteeing the grid tiles with no empty cells.
export type GalleryArea = 'lead' | 'sub' | 'wide' | 'square' | 'column' | 'inset';

export type GalleryItem = {
  id: string;
  src: string;
  alt: string;
  width: number;
  height: number;
  area: GalleryArea;
  // Short label rendered as a corner tag over the cell (e.g. 'flyer / 04.24').
  caption?: string;
  // CSS object-position value that frames the cover-crop for this cell. Defaults to 'center'.
  objectPosition?: 'top' | 'bottom' | 'left' | 'right' | 'center' | `${number}% ${number}%` | `${number}%` | 'initial' | 'inherit' | (string & {});
};

type Props = {
  items: GalleryItem[];
};

const GalleryCell = ({ item }: { item: GalleryItem }) => {
  const cellStyle = useMemo(() => ({ '--gallery-area': item.area, '--gallery-object-position': item.objectPosition ?? 'center' }) as CSSProperties, [item.area, item.objectPosition]);

  return (
    <li className={styles.cell} style={cellStyle}>
      <Lightbox src={item.src} alt={item.alt} width={item.width} height={item.height} triggerClassName={styles.trigger}>
        <Image src={item.src} alt={item.alt} width={item.width} height={item.height} className={styles.gridImage} placeholder="blur" blurDataURL={formatBlurURL(item.src, { width: 16, blur: 20 })} />
      </Lightbox>
      {item.caption !== undefined ? <span className={styles.caption}>{item.caption}</span> : null}
    </li>
  );
};

export const Gallery = ({ items }: Props) => {
  return (
    <ul className={styles.root}>
      {items.map((item) => (
        <GalleryCell key={item.id} item={item} />
      ))}
    </ul>
  );
};
```

- [ ] **Step 7: editorial styles から移設済みエクスポートを削除**

`src/components/gallery/styles.css.ts` から `overlay` / `modal` / `dialog` / `modalImage` / `close` の **5 エクスポートを削除**（Lightbox に移設済み）。残すのは `root` / `cell` / `trigger` / `gridImage` / `caption`。先頭の `import { css } from '@styled/css';` は残す。

- [ ] **Step 8: 既存 + 新規テストが全て通る**

Run: `pnpm vitest run src/components/gallery`
Expected: PASS（`gallery.test.tsx` 5 件 + `lightbox.test.tsx` 3 件）。既存 editorial の挙動（overlay testid・dialog 開閉）は不変。

- [ ] **Step 9: lint / typecheck**

Run: `pnpm lint && pnpm typecheck`
Expected: green（落ちたら `rm -f tsconfig.tsbuildinfo` 後に typecheck 再実行）

- [ ] **Step 10: commit**

```bash
git add src/components/gallery
git commit -m "refactor(gallery): extract shared Lightbox for reuse across layouts"
```

---

## Task 2: skyline レイアウトヘルパー（resolveColumns / spanForAspect）

純関数2つ。ブレークポイント幅→列数、アスペクト比→列スパン。

**Files:**

- Create: `src/app/(site)/gallery/_components/gallery-archive/skyline/layout.ts`
- Test: `src/app/(site)/gallery/_components/gallery-archive/skyline/layout.test.ts`

- [ ] **Step 1: 失敗テストを書く**

`.../skyline/layout.test.ts`:

```ts
import { describe, expect, it } from 'vitest';

import { resolveColumns, spanForAspect } from './layout';

describe('resolveColumns', () => {
  it('returns 2 columns below the tablet breakpoint (480)', () => {
    expect(resolveColumns(0)).toBe(2);
    expect(resolveColumns(479)).toBe(2);
  });
  it('returns 3 columns from tablet (480) up to desktop (768)', () => {
    expect(resolveColumns(480)).toBe(3);
    expect(resolveColumns(767)).toBe(3);
  });
  it('returns 4 columns at desktop (768) and above', () => {
    expect(resolveColumns(768)).toBe(4);
    expect(resolveColumns(1920)).toBe(4);
  });
});

describe('spanForAspect', () => {
  it('spans 2 columns for wide images (ratio >= 1.6)', () => {
    expect(spanForAspect(1.6)).toBe(2);
    expect(spanForAspect(16 / 9)).toBe(2);
  });
  it('spans 1 column for portrait and near-square images', () => {
    expect(spanForAspect(1)).toBe(1);
    expect(spanForAspect(400 / 600)).toBe(1);
    expect(spanForAspect(1.59)).toBe(1);
  });
});
```

- [ ] **Step 2: 失敗を確認**

Run: `pnpm vitest run "src/app/(site)/gallery/_components/gallery-archive/skyline/layout.test.ts"`
Expected: FAIL（`./layout` が無い）

- [ ] **Step 3: 実装**

`.../skyline/layout.ts`:

```ts
// Breakpoints: mobile 0 / tablet 480 / desktop 768 (src/themes/breakpoints.ts).
// Column count grows with available width so cells stay a comfortable size.
export const resolveColumns = (width: number): number => {
  if (width < 480) return 2;
  if (width < 768) return 3;
  return 4;
};

// Wide landscape images (e.g. 16:9 VRChat shots) earn a 2-column span; portrait
// flyers and near-square frames stay 1 column. Packing clamps span to the column
// count, so this never needs to know how many columns exist.
export const spanForAspect = (ratio: number): number => (ratio >= 1.6 ? 2 : 1);
```

- [ ] **Step 4: テストを通す**

Run: `pnpm vitest run "src/app/(site)/gallery/_components/gallery-archive/skyline/layout.test.ts"`
Expected: PASS（5 件）

- [ ] **Step 5: commit**

```bash
git add "src/app/(site)/gallery/_components/gallery-archive/skyline/layout.ts" "src/app/(site)/gallery/_components/gallery-archive/skyline/layout.test.ts"
git commit -m "feat(gallery): add skyline layout helpers (resolveColumns, spanForAspect)"
```

---

## Task 3: skyline pack 純関数（TDD 主対象）

列吸着の skyline パッカー。各アイテムを「スパン区間の最大列高（=shelf y）が最小、同点は最左」に貪欲配置し、列高を更新する。順序保持・重なりなし。

**Files:**

- Create: `src/app/(site)/gallery/_components/gallery-archive/skyline/pack.ts`
- Test: `src/app/(site)/gallery/_components/gallery-archive/skyline/pack.test.ts`

- [ ] **Step 1: 失敗テストを書く**

`.../skyline/pack.test.ts`:

```ts
import { describe, expect, it } from 'vitest';

import { pack } from './pack';

import type { PackItem, Placement } from './pack';

// True if two placement rectangles overlap (touching edges is allowed).
const overlaps = (a: Placement, b: Placement): boolean =>
  a.x < b.x + b.width && b.x < a.x + a.width && a.y < b.y + b.height && b.y < a.y + a.height;

const square = (id: string): PackItem => ({ id, width: 100, height: 100, span: 1 });

describe('pack', () => {
  it('returns nothing for an empty list', () => {
    expect(pack([], { width: 800, gap: 2, columns: 4 })).toEqual({ placements: [], totalHeight: 0 });
  });

  it('places a single 1-span item at the origin with the column width', () => {
    const { placements } = pack([square('a')], { width: 800, gap: 2, columns: 4 });
    const colW = (800 - 3 * 2) / 4;
    expect(placements).toHaveLength(1);
    expect(placements[0]).toMatchObject({ id: 'a', x: 0, y: 0, width: colW });
    // square aspect -> height equals width
    expect(placements[0]?.height).toBeCloseTo(colW);
  });

  it('preserves source order in the output', () => {
    const { placements } = pack([square('a'), square('b'), square('c')], { width: 800, gap: 2, columns: 4 });
    expect(placements.map((p) => p.id)).toEqual(['a', 'b', 'c']);
  });

  it('lays the first N equal items across the top row, left to right', () => {
    const { placements } = pack([square('a'), square('b'), square('c'), square('d')], { width: 800, gap: 2, columns: 4 });
    // all on row 0
    expect(placements.every((p) => p.y === 0)).toBe(true);
    // x values are strictly increasing (distinct columns, source order = left to right)
    const xs = placements.map((p) => p.x);
    expect([...xs].sort((m, n) => m - n)).toEqual(xs);
    expect(new Set(xs).size).toBe(xs.length);
  });

  it('drops the overflow item under the shortest (leftmost) column', () => {
    // 4 equal squares fill row 0; the 5th sits below column 0.
    const items = [square('a'), square('b'), square('c'), square('d'), square('e')];
    const { placements } = pack(items, { width: 800, gap: 2, columns: 4 });
    const colW = (800 - 3 * 2) / 4;
    const e = placements.find((p) => p.id === 'e');
    expect(e?.x).toBe(0);
    expect(e?.y).toBeCloseTo(colW + 2); // below a square cell + gap
  });

  it('gives a wide item (span 2) twice the column width plus the inner gap', () => {
    const wide: PackItem = { id: 'w', width: 160, height: 90, span: 2 };
    const { placements } = pack([wide], { width: 800, gap: 2, columns: 4 });
    const colW = (800 - 3 * 2) / 4;
    expect(placements[0]?.width).toBeCloseTo(2 * colW + 2);
  });

  it('clamps span to the column count (span 3 in a 2-column grid = full width)', () => {
    const wide: PackItem = { id: 'w', width: 160, height: 90, span: 3 };
    const { placements } = pack([wide], { width: 480, gap: 2, columns: 2 });
    expect(placements[0]?.width).toBeCloseTo(480);
    expect(placements[0]?.x).toBe(0);
  });

  it('produces no overlapping rectangles for a mixed set', () => {
    const items: PackItem[] = [
      { id: '1', width: 400, height: 600, span: 1 },
      { id: '2', width: 160, height: 90, span: 2 },
      { id: '3', width: 100, height: 100, span: 1 },
      { id: '4', width: 160, height: 90, span: 2 },
      { id: '5', width: 400, height: 600, span: 1 },
      { id: '6', width: 100, height: 100, span: 1 },
    ];
    const { placements, totalHeight } = pack(items, { width: 800, gap: 2, columns: 4 });
    for (const [i, a] of placements.entries()) {
      for (const b of placements.slice(i + 1)) {
        expect(overlaps(a, b)).toBe(false);
      }
    }
    // totalHeight bounds every cell
    expect(placements.every((p) => p.y + p.height <= totalHeight + 0.001)).toBe(true);
  });
});
```

- [ ] **Step 2: 失敗を確認**

Run: `pnpm vitest run "src/app/(site)/gallery/_components/gallery-archive/skyline/pack.test.ts"`
Expected: FAIL（`./pack` が無い）

- [ ] **Step 3: 実装**

`.../skyline/pack.ts`（`let` / `forEach` 不使用・immutable reduce）:

```ts
export type PackItem = { id: string; width: number; height: number; span: number };
export type Placement = { id: string; x: number; y: number; width: number; height: number };
export type PackResult = { placements: Placement[]; totalHeight: number };
export type PackOptions = { width: number; gap: number; columns: number };

const clampSpan = (span: number, columns: number): number => Math.max(1, Math.min(span, columns));

// The skyline sampled per column: heights[c] is the current filled bottom of column c.
// The best start for a span is the leftmost column whose covered shelf (max height
// across the span) is lowest — this keeps source order reading left-to-right.
const bestStart = (heights: readonly number[], span: number): { start: number; y: number } => {
  const candidates = Array.from({ length: heights.length - span + 1 }, (_, start) => ({
    start,
    y: Math.max(...heights.slice(start, start + span)),
  }));

  return candidates.reduce((best, candidate) => (candidate.y < best.y ? candidate : best));
};

type Acc = { heights: number[]; placements: Placement[] };

export const pack = (items: readonly PackItem[], options: PackOptions): PackResult => {
  const { width, gap, columns } = options;
  const colW = (width - (columns - 1) * gap) / columns;

  const seed: Acc = { heights: Array.from({ length: columns }, () => 0), placements: [] };

  const { placements } = items.reduce<Acc>((acc, item) => {
    const span = clampSpan(item.span, columns);
    const itemW = span * colW + (span - 1) * gap;
    const { start, y } = bestStart(acc.heights, span);
    const x = start * (colW + gap);
    const itemH = itemW * (item.height / item.width);
    const placement: Placement = { id: item.id, x, y, width: itemW, height: itemH };
    const nextBottom = y + itemH + gap;
    const heights = acc.heights.map((h, i) => (i >= start && i < start + span ? nextBottom : h));

    return { heights, placements: [...acc.placements, placement] };
  }, seed);

  const totalHeight = placements.reduce((max, p) => Math.max(max, p.y + p.height), 0);

  return { placements, totalHeight };
};
```

- [ ] **Step 4: テストを通す**

Run: `pnpm vitest run "src/app/(site)/gallery/_components/gallery-archive/skyline/pack.test.ts"`
Expected: PASS（全件）

- [ ] **Step 5: commit**

```bash
git add "src/app/(site)/gallery/_components/gallery-archive/skyline/pack.ts" "src/app/(site)/gallery/_components/gallery-archive/skyline/pack.test.ts"
git commit -m "feat(gallery): add column-aligned skyline packing function"
```

---

## Task 4: GalleryArchive client コンポーネント

幅計測 → `pack()` → 絶対配置描画。幅未確定時は CSS columns フォールバック。各セルは共有 `Lightbox`。

**Files:**

- Create: `src/app/(site)/gallery/_components/gallery-archive/index.tsx`
- Create: `src/app/(site)/gallery/_components/gallery-archive/styles.css.ts`
- Test: `src/app/(site)/gallery/_components/gallery-archive/gallery-archive.test.tsx`

- [ ] **Step 1: styles を作る**

`.../gallery-archive/styles.css.ts`:

```ts
import { css } from '@styled/css';

// Masonry container. Two modes via data-mode:
//  - flow: SSR / pre-measure fallback. CSS multi-columns, no JS needed.
//  - packed: skyline result applied; cells are absolutely positioned, height fixed.
// The ink background shows through the 2px seams as crisp grid lines (editorial parity).
export const root = css({
  listStyle: 'none',
  position: 'relative',
  borderWidth: 'default',
  borderStyle: 'solid',
  borderColor: 'fg.default',
  bg: 'fg.default',
  '&[data-mode=flow]': {
    columnCount: 2,
    columnGap: '[2px]',
    tablet: { columnCount: 3 },
    desktop: { columnCount: 4 },
  },
  '&[data-mode=packed]': {
    height: '[var(--total-h)]',
  },
});

export const cell = css({
  position: 'relative',
  overflow: 'hidden',
  bg: 'bg.canvas',
  '[data-mode=flow] &': {
    display: 'block',
    breakInside: 'avoid',
    marginBottom: '[2px]',
  },
  '[data-mode=packed] &': {
    position: 'absolute',
    left: '[var(--cell-x)]',
    top: '[var(--cell-y)]',
    width: '[var(--cell-w)]',
    height: '[var(--cell-h)]',
  },
});

// Identical interaction affordance to editorial: hover accent outline + two-tone
// focus ring drawn over the photo so it wins on any image.
export const trigger = css({
  display: 'block',
  width: 'full',
  height: 'full',
  cursor: 'pointer',
  border: 'none',
  bg: 'transparent',
  p: '0',
  position: 'relative',
  overflow: 'hidden',
  _hover: {
    outlineWidth: 'strong',
    outlineStyle: 'solid',
    outlineColor: 'accent.solid',
    outlineOffset: '[-3px]',
    zIndex: '[2]',
  },
  _focusVisible: {
    _after: {
      content: '""',
      position: 'absolute',
      inset: '[3px]',
      borderWidth: 'strong',
      borderStyle: 'solid',
      borderColor: 'accent.solid',
      outlineWidth: 'strong',
      outlineStyle: 'solid',
      outlineColor: 'fg.default',
      outlineOffset: '0',
      pointerEvents: 'none',
      zIndex: '[3]',
    },
  },
});

export const image = css({
  display: 'block',
  width: 'full',
  '[data-mode=flow] &': {
    height: 'auto',
  },
  '[data-mode=packed] &': {
    height: 'full',
    objectFit: 'cover',
  },
});

export const caption = css({
  position: 'absolute',
  left: '0',
  bottom: '0',
  zIndex: '[1]',
  pointerEvents: 'none',
  fontFamily: 'mono',
  fontSize: '[10px]',
  letterSpacing: 'wide',
  bg: 'fg.default',
  color: 'fg.onSolid',
  paddingInline: '[6px]',
  paddingBlock: '[1px]',
});
```

> `bg.canvas` が token に無ければ `bg.surface` を使う（`pnpm typecheck` で確認、無ければ差し替え）。

- [ ] **Step 2: 失敗テストを書く**

`.../gallery-archive/gallery-archive.test.tsx`:

```tsx
import { render } from 'vitest-browser-react';
import { describe, expect, it } from 'vitest';
import { page } from 'vitest/browser';

import { GalleryArchive } from './index';

import type { GalleryPhoto } from './index';

const photos: GalleryPhoto[] = [
  { id: '1', src: '/a.jpg', width: 400, height: 600, alt: 'flyer a', caption: 'flyer / 01' },
  { id: '2', src: '/b.jpg', width: 1600, height: 900, alt: 'vrchat b', caption: 'VRChat' },
  { id: '3', src: '/c.jpg', width: 500, height: 500, alt: 'frame c' },
];

describe('GalleryArchive', () => {
  it('renders every photo', async () => {
    await render(<GalleryArchive photos={photos} />);
    await expect.element(page.getByRole('img', { name: 'flyer a' }).first()).toBeInTheDocument();
    await expect.element(page.getByRole('img', { name: 'vrchat b' }).first()).toBeInTheDocument();
    await expect.element(page.getByRole('img', { name: 'frame c' }).first()).toBeInTheDocument();
  });

  it('renders corner captions when provided', async () => {
    await render(<GalleryArchive photos={photos} />);
    await expect.element(page.getByText('flyer / 01')).toBeInTheDocument();
    await expect.element(page.getByText('VRChat')).toBeInTheDocument();
  });

  it('switches to packed mode after measuring the container width', async () => {
    const { container } = await render(<GalleryArchive photos={photos} />);
    // ResizeObserver fires in the real browser, flipping data-mode to packed.
    await expect.poll(() => container.querySelector('ul')?.getAttribute('data-mode')).toBe('packed');
  });

  it('opens a lightbox dialog when a photo is activated', async () => {
    await render(<GalleryArchive photos={photos} />);
    await page.getByRole('button', { name: /flyer a/ }).click();
    await expect.element(page.getByRole('dialog')).toBeInTheDocument();
  });
});
```

- [ ] **Step 3: 失敗を確認**

Run: `pnpm vitest run "src/app/(site)/gallery/_components/gallery-archive/gallery-archive.test.tsx"`
Expected: FAIL（`./index` が無い）

- [ ] **Step 4: 実装**

`.../gallery-archive/index.tsx`:

```tsx
'use client';

import { useEffect, useRef, useState } from 'react';

import { Image } from '@components/image';
import { formatBlurURL } from '@components/image/helper';
import { Lightbox } from '@components/gallery/lightbox';

import { resolveColumns, spanForAspect } from './skyline/layout';
import { pack } from './skyline/pack';
import * as styles from './styles.css';

import type { Placement } from './skyline/pack';
import type { CSSProperties } from 'react';

export type GalleryPhoto = {
  id: string;
  src: string;
  width: number;
  height: number;
  alt: string;
  // Short corner label (e.g. 'flyer / 04.24' or 'VRChat').
  caption?: string;
};

type Props = {
  photos: GalleryPhoto[];
};

const GAP = 2;

// The absolute-position bridge: skyline output is published as CSS custom
// properties (the only style-prop bridge the project allows), consumed by s.cell.
const cellVars = (place: Placement): CSSProperties =>
  ({ '--cell-x': `${place.x}px`, '--cell-y': `${place.y}px`, '--cell-w': `${place.width}px`, '--cell-h': `${place.height}px` }) as CSSProperties;

const totalVars = (totalHeight: number): CSSProperties => ({ '--total-h': `${totalHeight}px` }) as CSSProperties;

export const GalleryArchive = ({ photos }: Props) => {
  const ref = useRef<HTMLUListElement | null>(null);
  const [width, setWidth] = useState<number | null>(null);

  useEffect(() => {
    const el = ref.current;
    if (el === null) return;

    const observer = new ResizeObserver((entries) => {
      const measured = entries[0]?.contentRect.width;
      if (typeof measured === 'number') setWidth(measured);
    });
    observer.observe(el);

    return () => observer.disconnect();
  }, []);

  const columns = width === null ? 0 : resolveColumns(width);
  const result =
    width === null
      ? null
      : pack(
          photos.map((photo) => ({ id: photo.id, width: photo.width, height: photo.height, span: spanForAspect(photo.width / photo.height) })),
          { width, gap: GAP, columns },
        );

  const placementOf = (id: string): Placement | undefined => result?.placements.find((p) => p.id === id);

  return (
    <ul ref={ref} className={styles.root} data-mode={result === null ? 'flow' : 'packed'} style={result === null ? undefined : totalVars(result.totalHeight)}>
      {photos.map((photo) => {
        const place = placementOf(photo.id);

        return (
          <li key={photo.id} className={styles.cell} style={place === undefined ? undefined : cellVars(place)}>
            <Lightbox src={photo.src} alt={photo.alt} width={photo.width} height={photo.height} triggerClassName={styles.trigger}>
              <Image src={photo.src} alt={photo.alt} width={photo.width} height={photo.height} className={styles.image} placeholder="blur" blurDataURL={formatBlurURL(photo.src, { width: 16, blur: 20 })} />
            </Lightbox>
            {photo.caption !== undefined ? <span className={styles.caption}>{photo.caption}</span> : null}
          </li>
        );
      })}
    </ul>
  );
};
```

- [ ] **Step 5: テストを通す**

Run: `pnpm vitest run "src/app/(site)/gallery/_components/gallery-archive/gallery-archive.test.tsx"`
Expected: PASS（4 件）

- [ ] **Step 6: lint / typecheck**

Run: `pnpm lint && pnpm typecheck`
Expected: green（`bg.canvas` が無ければ `bg.surface` 等に直す）

- [ ] **Step 7: commit**

```bash
git add "src/app/(site)/gallery/_components/gallery-archive"
git commit -m "feat(gallery): add skyline-packed masonry archive with CSS columns fallback"
```

---

## Task 5: 素材生成（Codex `$imagegen`）+ sample-gallery.ts

既存6枚を流用し、+10枚を生成して計16件のサンプルデータを作る。

**Files:**

- Create: `src/app/(site)/_assets/gallery-*.jpg`（生成10枚）
- Create: `src/app/(site)/gallery/sample-gallery.ts`

- [ ] **Step 1: 画像を生成**（headless Codex）

世界観 = booth2booth（VRChat の DJ イベント）/ electric blue + glitch + mono system 注釈 / 白地グラフィックデザイン。
横長（VRChat 16:9）と縦長（flyer ポスター）を混ぜ、可変スパンが映る構成にする。例（実行は1枚ずつでも可）:

```bash
codex exec "VRChat DJ イベントのステージを捉えた横長16:9スクリーンショット。electric blue のレーザー、glitch、観客のアバター。サイズ1600x900、保存先 ~/.codex/generated_images/gallery-vrchat-stage.jpg $imagegen"
codex exec "VRChat の DJ ブース、ターンテーブルとアバターDJ、青いネオン、横長16:9、1600x900、~/.codex/generated_images/gallery-vrchat-booth.jpg $imagegen"
codex exec "VRChat アバターの正方形ポートレート、glitch エフェクト、青赤スポット、1000x1000、~/.codex/generated_images/gallery-vrchat-portrait.jpg $imagegen"
codex exec "クラブイベントのフライヤー、白地に黒グロテスク体の巨大タイポ、electric blue と少量の赤、mono のタイムスタンプ/座標、縦長ポスター 1080x1350、~/.codex/generated_images/gallery-flyer-night.jpg $imagegen"
# 同様に計10枚（flyer 系4 / VRChat 横3 / VRChat 正方3 など）を生成する。
```

> 生成は `~/.codex/generated_images/` に保存される。世界観の参照に既存 `src/app/(site)/_assets/flyer-booth-0424.jpg` 等を `-i` で渡してもよい。

- [ ] **Step 2: assets へ移動・命名**

```bash
ls -la ~/.codex/generated_images/
# 各ファイルを規則的な名前で配置（flyer-*/vrchat-* に揃える）
cp ~/.codex/generated_images/gallery-vrchat-stage.jpg "src/app/(site)/_assets/gallery-vrchat-stage.jpg"
# ...10枚すべて
ls -1 "src/app/(site)/_assets/" | grep gallery-
```

> ⚠️ jpg import の path ミスは typecheck を通り抜ける（ambient module）。配置後は **実ファイルの存在を `ls` で必ず確認**し、後続の `pnpm build` でも検証する。

- [ ] **Step 3: sample-gallery.ts を作る**

`src/app/(site)/gallery/sample-gallery.ts`（静的 import → `GalleryPhoto[]`。既存6 + 生成10。`caption` は種別ラベル。`alt` は内容説明）:

```ts
import flyerBooth0424 from '../_assets/flyer-booth-0424.jpg';
import flyerBooth0523 from '../_assets/flyer-booth-0523.jpg';
import vrchatAlice from '../_assets/vrchat-alice.jpg';
import vrchatGlitch from '../_assets/vrchat-glitch.jpg';
import vrchatSquare from '../_assets/vrchat-square.jpg';
import vrchatWide from '../_assets/vrchat-wide.jpg';
import galleryVrchatStage from '../_assets/gallery-vrchat-stage.jpg';
// ...生成10枚すべて import

import type { GalleryPhoto } from './_components/gallery-archive';
import type { StaticImageData } from 'next/image';

// Map a static import + metadata into a GalleryPhoto.
const photo = (image: StaticImageData, id: string, alt: string, caption: string): GalleryPhoto => ({
  id,
  src: image.src,
  width: image.width,
  height: image.height,
  alt,
  caption,
});

// Sample data — replaced by Payload CMS in a later plan.
export const galleryPhotos: GalleryPhoto[] = [
  photo(flyerBooth0424, '1', 'Booth² 2026.04.24 イベントフライヤー', 'flyer / 04.24'),
  photo(vrchatWide, '2', 'VRChat ライブ会場の光跡ショット', 'VRChat'),
  photo(vrchatSquare, '3', 'VRChat アバターのフレーミングポーズ', 'frame'),
  photo(vrchatAlice, '4', 'VRChat アバター ALICE ポートレート', 'ALICE'),
  photo(flyerBooth0523, '5', 'Booth² 2026.05.23 イベントフライヤー', 'flyer / 05.23'),
  photo(vrchatGlitch, '6', 'VRChat アバターのグリッチビジュアル', 'glitch'),
  photo(galleryVrchatStage, '7', 'VRChat DJ ステージのレーザー演出', 'VRChat'),
  // ...生成残り9枚（id 8〜16）
];
```

- [ ] **Step 4: typecheck（import path 解決の確認）**

Run: `pnpm typecheck`
Expected: green（落ちたら `rm -f tsconfig.tsbuildinfo` 後再実行）。※ jpg path ミスは typecheck を通るので Step 2 の `ls` 確認を信頼する。

- [ ] **Step 5: commit**

```bash
git add "src/app/(site)/_assets/gallery-"*.jpg "src/app/(site)/gallery/sample-gallery.ts"
git commit -m "feat(gallery): add generated gallery assets and sample data (16 photos)"
```

---

## Task 6: /gallery ページ配線

RSC ページ。`PageHeader` + `GalleryArchive`。ISR。

**Files:**

- Create: `src/app/(site)/gallery/page.tsx`
- Create: `src/app/(site)/gallery/styles.css.ts`

- [ ] **Step 1: styles を作る**

`src/app/(site)/gallery/styles.css.ts`（`works/styles.css.ts` の main と同等のページ余白に倣う。実値は works を参照して合わせる）:

```ts
import { css } from '@styled/css';

export const main = css({
  display: 'flex',
  flexDirection: 'column',
  gap: 'module.6',
});

export const section = css({
  // section landmark wrapper for the archive grid
});
```

> `main` のトークン（gap 等）は `src/app/(site)/works/styles.css.ts` の `main` を開いて同じ値に合わせる。`section` が空なら省略可。

- [ ] **Step 2: page を作る**

`src/app/(site)/gallery/page.tsx`:

```tsx
import { GalleryArchive } from './_components/gallery-archive';
import { galleryPhotos } from './sample-gallery';
import * as s from './styles.css';

import { PageHeader } from '@components/page-header';

// Revalidate hourly so OpenNext serves the page via ISR.
export const revalidate = 3600;

const galleryCrumbs = [{ href: '/', label: 'home' }, { label: 'gallery' }] as const;

const GalleryPage = () => {
  return (
    <main id="main-content" className={s.main}>
      <PageHeader title="gallery" breadcrumbs={galleryCrumbs} kicker="// flyer · VRChat — 2024–2026" lead="撮ったり作ったりしたやつ、置いとくね〜😁" />
      <section className={s.section} aria-label="作品ギャラリー一覧">
        <GalleryArchive photos={galleryPhotos} />
      </section>
    </main>
  );
};

export default GalleryPage;
```

- [ ] **Step 3: lint / typecheck**

Run: `pnpm lint && pnpm typecheck`
Expected: green

- [ ] **Step 4: ビルドで /gallery を検証**

Run: `pnpm build 2>&1 | tail -30`
Expected: ビルド成功。`/gallery` が出力に現れ、`_assets/gallery-*.jpg` の解決エラーが無いこと（jpg path は build で初めて検出されるため必須）。

- [ ] **Step 5: commit**

```bash
git add "src/app/(site)/gallery/page.tsx" "src/app/(site)/gallery/styles.css.ts"
git commit -m "feat(gallery): wire /gallery page with PageHeader and skyline archive"
```

---

## Task 7: 最終検証 + difit レビュー依頼

- [ ] **Step 1: 関連テスト一括**

Run: `pnpm vitest run src/components/gallery "src/app/(site)/gallery"`
Expected: PASS（lightbox / editorial gallery / layout / pack / archive）

- [ ] **Step 2: lint / typecheck / build 最終**

Run: `pnpm lint && pnpm typecheck && pnpm build 2>&1 | tail -20`
Expected: 全 green、`/gallery` ビルド成功

- [ ] **Step 3: 目視確認（dev）**

Run: `pnpm dev`（ユーザーに `! pnpm dev` での起動を依頼してもよい）
確認: `/gallery` で skyline パック・可変スパン（VRChat 横が2列）・lightbox 開閉・キャプション・2px seam・レスポンシブ（2/3/4列）・focus ring。JS 無効時に CSS columns フォールバックが崩れないこと。

- [ ] **Step 4: difit でレビュー依頼**

ユーザーへ difit を起動して review を依頼する（CLAUDE.md: 実装完了後は difit）。

---

## Self-Review（spec 突き合わせ）

- **中身16枚/単一の流れ/種別 caption**（spec §1）→ Task 5（sample 16）+ Task 4（caption 描画）✅
- **skyline 可変幅 masonry + 列吸着 + 順序保持**（spec §2）→ Task 3 pack（bestStart leftmost・clampSpan・列吸着 x）✅
- **CSS columns フォールバック / progressive enhancement**（spec §2）→ Task 4 `data-mode=flow/packed`、Task 1 で SSR 可能な構造 ✅
- **レスポンシブ 2/3/4 列**（spec §2）→ Task 2 resolveColumns + Task 4 flow CSS の columnCount ✅
- **lightbox 共有抽出・editorial green 維持**（spec §3.3）→ Task 1（既存 `gallery.test.tsx` 不変で green）✅
- **純ロジック TDD**（spec §6）→ Task 2/3（layout・pack のユニットテスト）✅
- **PageHeader + ISR + section landmark**（spec §5）→ Task 6 ✅
- **素材生成 + jpg path 検証**（spec §4）→ Task 5（`ls` 確認）+ Task 6 Step4（build 検証）✅
- **WCAG**（spec §7）→ caption は `fg.default`/`fg.onSolid`（editorial 流用）、focus ring は editorial と同一の two-tone、lightbox は react-aria の focus trap ✅
- **配置（ページローカル skyline / gallery ファミリー lightbox）**（spec §3 注）→ Task 2-4 はページ配下、lightbox は `components/gallery/lightbox` ✅

**型整合チェック:** `PackItem/Placement/PackResult/PackOptions`（Task3）→ Task4 が import 一致。`GalleryPhoto`（Task4 export）→ Task5 が import 一致。`resolveColumns/spanForAspect`（Task2）→ Task4 で使用一致。`Lightbox` props（`src/alt/width/height/triggerClassName/children`, Task1）→ Task4/editorial の使用一致。

**プレースホルダscan:** 生成画像のファイル名（Task5）は実行時に確定する外部成果物のため可変扱い（命名規則 `gallery-*` は明示）。それ以外に TBD/TODO なし。
