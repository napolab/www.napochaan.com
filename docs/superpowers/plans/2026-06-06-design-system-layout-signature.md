# Design System — Layout & Signature Implementation Plan (Plan 3)

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development to implement task-by-task. Checkbox (`- [ ]`) steps.

**Goal:** napochaan.com の "署名的レイアウト"（生きた方眼背景・四辺タイポバンド・エコー見出し・マーキー・セクション見出し・フッター・サイトシェル）を、確定 token と既存 primitive の上に実装する。

**Architecture:** 各部品は `src/components/<name>/{index.tsx, styles.css.ts, <name>.test.tsx}`（既存 primitive と同パターン）。アニメーション部（Game of Life・TypographyBand）は **純粋ロジックを切り出して unit テスト**し、Canvas/DOM 副作用は `'use client'` コンポーネントに閉じる。`prefers-reduced-motion`・`visibilitychange`・`IntersectionObserver`・cleanup を必須。最終的に `SiteShell` が四辺バンド＋ライフ背景＋本文 inset を合成し、`src/app/(site)/layout.tsx` から使う。挙動は検証済みプロト `/.tmp-mockups/prototype-v2.html`（life 7fps / band scroll-reactive / echo / marquee）を React 化したもの。

**Tech Stack:** React 19（`'use client'` + `useEffect`/`useRef`/`requestAnimationFrame`）, Panda CSS（`@styled/css`）, vitest（unit: 純ロジック / browser: 描画）。GSAP 不要（vanilla rAF）。

**前提 token:** colors（bg.canvas/fg.default/accent.solid/grid.line/...）, fonts（display/mono/body）, fontSizes（hero/display/h2/...）, spacing（block/section/page + 0..24）, sizes（band=24px, gridCell=24px, headerHeight=72px）, lineHeights（none/tight/jp）, borderWidths, durations, easings, layerStyle focusRing。

---

## File Structure

| 部品                             | files                                                                                                                  | UI/手段                                                |
| -------------------------------- | ---------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------ |
| GameOfLife（生きた背景）         | `src/components/game-of-life/{index.tsx,life.ts,life.test.ts,styles.css.ts,game-of-life.test.tsx}`                     | 純ロジック `life.ts`(unit) + `'use client'` Canvas     |
| TypographyBand（四辺フレーム）   | `src/components/typography-band/{index.tsx,band-scroll.ts,band-scroll.test.ts,styles.css.ts,typography-band.test.tsx}` | 純ロジック wrap(unit) + `'use client'` scroll-reactive |
| Marquee（横帯・反復）            | `src/components/marquee/{index.tsx,styles.css.ts,marquee.test.tsx}`                                                    | 2トラック seamless CSS                                 |
| EchoText（T2 エコー見出し）      | `src/components/echo-text/{index.tsx,styles.css.ts,echo-text.test.tsx}`                                                | 多層オフセット重ね                                     |
| SectionHeading（番号+title）     | `src/components/section-heading/{index.tsx,styles.css.ts,section-heading.test.tsx}`                                    | mono番号 + display title + 2px rule                    |
| Footer（システムステータスバー） | `src/components/site-footer/{index.tsx,styles.css.ts,site-footer.test.tsx}`                                            | mono status                                            |
| SiteShell（合成）                | `src/components/site-shell/{index.tsx,styles.css.ts,site-shell.test.tsx}`                                              | band + life + content inset を合成                     |

共通: 各 component に showcase `src/app/(design-system)/components/<name>/page.tsx`。`.claude/rules/` 全順守（root style 名、namespace import、no-child-selectors → data-\* / `_before` / `_marker`、semantic-html、arrow、no let/forEach/any/!）。per-task commit 承認済（husky 通過必須・--no-verify 禁止・CLAUDE.md は add しない）。`pnpm panda codegen` は不要（config 変更時のみ）。

---

## Task 1: Game of Life — 純ロジック `life.ts`（TDD）

**Files:** `src/components/game-of-life/life.ts`, `src/components/game-of-life/life.test.ts`

- [ ] **Step 1: 失敗テスト** — `life.test.ts`

```ts
import { describe, expect, it } from 'vitest';

import { createGrid, step, countAlive } from './life';

describe('game of life', () => {
  it('createGrid makes a cols*rows Uint8Array', () => {
    const g = createGrid(3, 2);
    expect(g.cols).toBe(3);
    expect(g.rows).toBe(2);
    expect(g.cells.length).toBe(6);
  });

  it('a block (2x2) is stable', () => {
    // 4x4 with a block at (1,1),(2,1),(1,2),(2,2)
    const g = createGrid(4, 4);
    for (const [x, y] of [[1, 1], [2, 1], [1, 2], [2, 2]] as const) g.cells[y * 4 + x] = 1;
    const next = step(g);
    expect([...next.cells]).toEqual([...g.cells]);
  });

  it('a blinker oscillates (horizontal -> vertical)', () => {
    const g = createGrid(5, 5);
    for (const [x, y] of [[1, 2], [2, 2], [3, 2]] as const) g.cells[y * 5 + x] = 1;
    const next = step(g);
    // becomes vertical: (2,1),(2,2),(2,3)
    expect(next.cells[1 * 5 + 2]).toBe(1);
    expect(next.cells[2 * 5 + 2]).toBe(1);
    expect(next.cells[3 * 5 + 2]).toBe(1);
    expect(next.cells[2 * 5 + 1]).toBe(0);
    expect(next.cells[2 * 5 + 3]).toBe(0);
  });

  it('lone cell dies (underpopulation)', () => {
    const g = createGrid(3, 3);
    g.cells[1 * 3 + 1] = 1;
    expect(countAlive(step(g))).toBe(0);
  });
});
```

- [ ] **Step 2: 失敗確認** — `pnpm test -- --project unit src/components/game-of-life/life.test.ts` → FAIL
- [ ] **Step 3: 実装** — `life.ts`

```ts
export type Grid = { cols: number; rows: number; cells: Uint8Array };

export const createGrid = (cols: number, rows: number): Grid => ({ cols, rows, cells: new Uint8Array(cols * rows) });

export const seedRandom = (grid: Grid, density: number, rand: () => number): Grid => {
  const cells = new Uint8Array(grid.cells.length);
  for (let i = 0; i < cells.length; i++) cells[i] = rand() < density ? 1 : 0;
  return { ...grid, cells };
};

const at = (grid: Grid, x: number, y: number): number => {
  const xx = (x + grid.cols) % grid.cols;
  const yy = (y + grid.rows) % grid.rows;
  return grid.cells[yy * grid.cols + xx] ?? 0;
};

export const step = (grid: Grid): Grid => {
  const next = new Uint8Array(grid.cells.length);
  for (let y = 0; y < grid.rows; y++) {
    for (let x = 0; x < grid.cols; x++) {
      let n = 0;
      for (let dy = -1; dy <= 1; dy++) {
        for (let dx = -1; dx <= 1; dx++) {
          if (dx === 0 && dy === 0) continue;
          n += at(grid, x + dx, y + dy);
        }
      }
      const alive = grid.cells[y * grid.cols + x] === 1;
      next[y * grid.cols + x] = alive ? (n === 2 || n === 3 ? 1 : 0) : n === 3 ? 1 : 0;
    }
  }
  return { ...grid, cells: next };
};

export const countAlive = (grid: Grid): number => {
  let n = 0;
  for (let i = 0; i < grid.cells.length; i++) n += grid.cells[i] ?? 0;
  return n;
};
```

> NOTE: `let` は `.claude/rules/functional-programming.md` で禁止。ただしホットパス(二重ループのカウント)は例外的に必要。**`for...of` + reduce で書けない部分のみ** `let` を使い、可能な箇所は `reduce` を使う。lint(oxlint)が `let` を許可するか確認し、禁止なら `reduce`/`Array.from` で書き換える（例: `countAlive` は `grid.cells.reduce((a, c) => a + c, 0)`；近傍カウントは `[-1,0,1]` の配列を `flatMap`+`reduce` で）。**実装者は lint を通すこと最優先**で、TDD のテストが緑になる範囲で規約準拠の書き方にする。

- [ ] **Step 4: 合格確認** → PASS
- [ ] **Step 5: コミット** `feat(ui): Game of Life pure logic (createGrid/step/countAlive) with tests`

---

## Task 2: Game of Life — Canvas コンポーネント

**Files:** `src/components/game-of-life/index.tsx`, `styles.css.ts`, `game-of-life.test.tsx`, showcase

- [ ] **Step 1: 描画テスト** — `game-of-life.test.tsx`（canvas が存在し aria-hidden であること）

```tsx
import { render } from 'vitest-browser-react';
import { describe, expect, it } from 'vitest';
import { page } from 'vitest/browser';

import { GameOfLife } from './index';

describe('GameOfLife', () => {
  it('renders a decorative canvas', async () => {
    render(<GameOfLife />);
    const canvas = page.getByTestId('game-of-life');
    await expect.element(canvas).toBeInTheDocument();
    await expect.element(canvas).toHaveAttribute('aria-hidden', 'true');
  });
});
```

- [ ] **Step 2: 失敗確認** → FAIL
- [ ] **Step 3: 実装** — `index.tsx`（`'use client'`）

要件（プロト `prototype-v2.html` の life ロジックを移植、純 `life.ts` を使用）:

- `<canvas data-testid="game-of-life" aria-hidden="true" className={styles.root} />`。
- `useEffect` で: 2D context 取得、`resize`(devicePixelRatio 上限2, cols/rows を `sizes.gridCell`=24 から算出, `createGrid`+`seedRandom(0.16, Math.random)`)、rAF + 時間アキュムレータで **7fps**(`step`)、描画は生セルのみ `fillRect`(色 `rgba(blue,0.11)`, 稀に `rgba(red,0.10)`)。
- 停滞/全滅検知で再シード（`countAlive` を使用）。
- `prefers-reduced-motion` → 1世代だけ描画しループ無し。`document.hidden`(visibilitychange) と `IntersectionObserver`(画面外) で停止。`resize` 購読。
- **cleanup**: `cancelAnimationFrame` + removeEventListener + observer.disconnect を return。
- 省略可: gen/alive を `onStats?({gen,alive})` で親へ渡す（YAGNI なら省略）。色は CSS 変数 `getComputedStyle` から取得 or 直値 `rgba(26,52,255,0.11)`。
- `styles.css.ts`: `root = css({ position:'fixed', inset:'band', zIndex:'0', pointerEvents:'none' })`（band=24px、四辺バンドの内側）。

- [ ] **Step 4: 合格確認** → PASS（canvas 描画は jsdom/browser で context 取得可能。失敗するなら context 取得を guard し、テストは存在+aria-hidden のみ検証）
- [ ] **Step 5: showcase** `src/app/(design-system)/components/game-of-life/page.tsx`（`<main><h1>` + 相対配置のボックス内で GameOfLife を見せる。fixed なので showcase 用に container 相対化の注記）
- [ ] **Step 6: コミット** `feat(ui): GameOfLife canvas background (7fps, reduced-motion, visibility/observer pause)`

---

## Task 3: TypographyBand — wrap 純ロジック（TDD）

**Files:** `src/components/typography-band/band-scroll.ts`, `band-scroll.test.ts`

- [ ] **Step 1: テスト** — `band-scroll.test.ts`

```ts
import { describe, expect, it } from 'vitest';

import { wrap } from './band-scroll';

describe('band wrap', () => {
  it('keeps value within (-range, 0]', () => {
    expect(wrap(0, 100)).toBe(0);
    expect(wrap(150, 100)).toBe(-50);
    expect(wrap(-30, 100)).toBe(-30);
    expect(wrap(-130, 100)).toBe(-30);
  });
  it('returns 0 when range is 0', () => {
    expect(wrap(50, 0)).toBe(0);
  });
});
```

- [ ] **Step 2: FAIL確認**
- [ ] **Step 3: 実装** — `band-scroll.ts`

```ts
/** Seamless wrap: maps any offset into the (-range, 0] window for a duplicated track. */
export const wrap = (value: number, range: number): number => {
  if (range === 0) return 0;
  const mod = value % range;
  return mod > 0 ? mod - range : mod;
};
```

- [ ] **Step 4: PASS** — [ ] **Step 5: コミット** `feat(ui): typography band scroll wrap util with tests`

---

## Task 4: TypographyBand — 四辺フレームコンポーネント

**Files:** `src/components/typography-band/index.tsx`, `styles.css.ts`, `typography-band.test.tsx`, showcase

- [ ] **Step 1: テスト** — 4辺の帯が aria-hidden で描かれ、テキストを含む

```tsx
import { render } from 'vitest-browser-react';
import { describe, expect, it } from 'vitest';
import { page } from 'vitest/browser';

import { TypographyBand } from './index';

describe('TypographyBand', () => {
  it('renders four decorative bands with the text', async () => {
    render(<TypographyBand text="NAPOCHAAN · DJ × VJ · " />);
    const bands = page.getByTestId('typography-band');
    await expect.element(bands.first()).toBeInTheDocument();
    // すべて aria-hidden
    await expect.element(bands.first()).toHaveAttribute('aria-hidden', 'true');
  });
});
```

（`getByTestId` が複数返る場合の API は実環境に合わせて調整。4要素それぞれ `data-testid="typography-band"`。）

- [ ] **Step 2: FAIL**
- [ ] **Step 3: 実装** — `index.tsx`（`'use client'`、プロトの band ロジック移植）
      要件:
- props `{ text: string }`（既定例 `"NAPOCHAAN · DJ × VJ · GRAPHIC × DIGITAL · SINCE 2020 · 静かなインターネット · "`）。
- 4つの fixed 帯（top/bottom 横, left/right 縦 `writingMode: vertical-rl`）。各 `aria-hidden="true" data-testid="typography-band" pointerEvents:none userSelect:none`。各帯に track（`text.repeat(n)` を**2スパン**で seamless）。
- `useEffect`: scroll 速度を蓄積し rAF で `wrap`(band-scroll) を使って translate。top/left は順方向、bottom/right は逆方向。静止時の微ドリフト。`prefers-reduced-motion` で停止（transform 更新しない）。cleanup で rAF/listener 解除。
- `styles.css.ts`: bandTop/bandBottom/bandLeft/bandRight（bg `accent.solid`, color `fg.onSolid`, font `mono`, fontSize sm 相当, textTransform uppercase, height/width `band`=24px, border `blue.10` hairline, zIndex `sticky`, safe-area-inset 対応 `[env(safe-area-inset-*)]`）、track（flex nowrap willChange transform）。
- [ ] **Step 4: PASS** — [ ] **Step 5: showcase** — [ ] **Step 6: コミット** `feat(ui): TypographyBand 4-edge scroll-reactive frame`

---

## Task 5: Marquee（横帯・反復）

**Files:** `src/components/marquee/{index.tsx,styles.css.ts,marquee.test.tsx}` + showcase

- [ ] **Step 1: テスト**

```tsx
import { render } from 'vitest-browser-react';
import { describe, expect, it } from 'vitest';
import { page } from 'vitest/browser';

import { Marquee } from './index';

describe('Marquee', () => {
  it('renders the text duplicated for a seamless loop', async () => {
    render(<Marquee>napochaan ✕ graphic</Marquee>);
    const items = page.getByText('napochaan ✕ graphic');
    await expect.element(items.first()).toBeInTheDocument();
    // 2 copies for seamless scroll
    expect(items.all().length).toBeGreaterThanOrEqual(2);
  });
  it('exposes reverse via data attribute', async () => {
    render(<Marquee reverse>x</Marquee>);
    await expect.element(page.getByTestId('marquee')).toHaveAttribute('data-reverse', 'true');
  });
});
```

- [ ] **Step 2: FAIL**
- [ ] **Step 3: 実装** — CSS アニメ（`@keyframes` を panda.config に追加 or styles 内 keyframes）。`data-testid="marquee" aria-hidden="true"`。track に children を**2回**描画、`translateX(0 -> -50%)` linear infinite。`data-reverse` で逆方向。`prefers-reduced-motion`(`_motionReduce`) で停止。border-block hairline、bg `paper`、font display italic（T1 准拠）。children を2回出すため `<span className={item}>{children}</span>` を2つ。
- NOTE: keyframe `marquee` を panda.config に足す場合は codegen 必要。styles.css.ts 内で `css.keyframes` が使えないなら panda.config に追加（既存 keyframes に `marquee: { to: { transform: 'translateX(-50%)' } }`）→ `pnpm panda codegen`。
- [ ] **Step 4: PASS** — [ ] **Step 5: showcase** — [ ] **Step 6: コミット** `feat(ui): Marquee band (seamless 2-track, reverse, reduced-motion safe)`

---

## Task 6: EchoText（T2 エコー見出し）

**Files:** `src/components/echo-text/{index.tsx,styles.css.ts,echo-text.test.tsx}` + showcase

- [ ] **Step 1: テスト**

```tsx
import { render } from 'vitest-browser-react';
import { describe, expect, it } from 'vitest';
import { page } from 'vitest/browser';

import { EchoText } from './index';

describe('EchoText', () => {
  it('renders the visible text once accessibly (echoes hidden)', async () => {
    render(<EchoText>napochaan</EchoText>);
    // 表示テキストは存在
    await expect.element(page.getByText('napochaan').first()).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: FAIL**
- [ ] **Step 3: 実装** — エコー重ね（fill + blue offset + outline offset）。aria 的に**1回だけ読まれる**よう、echo 層は `aria-hidden="true"`。display=digibop italic。`styles.css.ts`: root(position relative inline-block), layer(共通 font), fill(ink, z 3), echoBlue(accent.solid, translate(10px,10px), z1, aria-hidden), echoOut(transparent + -webkit-text-stroke ink, translate(20px,20px), z0, aria-hidden)。`-webkit-text-stroke` は arbitrary。props `{ children: string }`。
- [ ] **Step 4: PASS** — [ ] **Step 5: showcase** — [ ] **Step 6: コミット** `feat(ui): EchoText layered echo display (T2 treatment)`

---

## Task 7: SectionHeading（番号 + title）

**Files:** `src/components/section-heading/{index.tsx,styles.css.ts,section-heading.test.tsx}` + showcase

- [ ] **Step 1: テスト**

```tsx
import { render } from 'vitest-browser-react';
import { describe, expect, it } from 'vitest';
import { page } from 'vitest/browser';

import { SectionHeading } from './index';

describe('SectionHeading', () => {
  it('renders the number and title as a heading', async () => {
    render(<SectionHeading no="01" level={2}>works</SectionHeading>);
    await expect.element(page.getByText('01')).toBeInTheDocument();
    await expect.element(page.getByRole('heading', { level: 2, name: /works/ })).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: FAIL**
- [ ] **Step 3: 実装** — `<div className={root}>` に mono の番号(`no`, accent.text) + 既存 `@components/heading` `Heading`(level, title)。下に 2px ink rule（root の `borderBottomWidth: 'default'`）。props `{ no: string; level?: 1..6; children: ReactNode; more?: ReactNode }`（`more` は右寄せ mono リンク等、任意）。番号は `aria-hidden`? いや内容として読ませてよい。Heading を使うことで見出しセマンティクス保証。
- [ ] **Step 4: PASS** — [ ] **Step 5: showcase** — [ ] **Step 6: コミット** `feat(ui): SectionHeading (mono number + Heading + 2px rule)`

---

## Task 8: SiteFooter（システムステータスバー）

**Files:** `src/components/site-footer/{index.tsx,styles.css.ts,site-footer.test.tsx}` + showcase

- [ ] **Step 1: テスト** — `<footer>` landmark + copyright

```tsx
import { render } from 'vitest-browser-react';
import { describe, expect, it } from 'vitest';
import { page } from 'vitest/browser';

import { SiteFooter } from './index';

describe('SiteFooter', () => {
  it('renders a contentinfo footer with copyright', async () => {
    render(<SiteFooter />);
    await expect.element(page.getByRole('contentinfo')).toBeInTheDocument();
    await expect.element(page.getByText(/napochaan/)).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: FAIL**
- [ ] **Step 3: 実装** — `<footer className={root}>`：2px 上 ink rule、mono、左に `© 2026 napochaan — graphic / digital`、右に `build … · life: running`（accent.text 部分）。props 最小（`buildId?: string`）。semantic: `<footer>` = contentinfo landmark。
- [ ] **Step 4: PASS** — [ ] **Step 5: showcase** — [ ] **Step 6: コミット** `feat(ui): SiteFooter system status bar`

---

## Task 9: SiteShell（合成）＋ (site) layout 統合

**Files:** `src/components/site-shell/{index.tsx,styles.css.ts,site-shell.test.tsx}` + showcase、`src/app/(site)/layout.tsx` 統合

- [ ] **Step 1: テスト**

```tsx
import { render } from 'vitest-browser-react';
import { describe, expect, it } from 'vitest';
import { page } from 'vitest/browser';

import { SiteShell } from './index';

describe('SiteShell', () => {
  it('renders children inside the main content region', async () => {
    render(<SiteShell><p>hello</p></SiteShell>);
    await expect.element(page.getByText('hello')).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: FAIL**
- [ ] **Step 3: 実装** — `SiteShell`：`<TypographyBand text=... />` + `<GameOfLife />` + `<div className={stage}>{children}</div>`。stage は band 幅ぶん inset（padding `band`）、`maxW` + `mx auto`。グリッド背景は global-css(body) で既に出るが、stage は relative zIndex 1。`game-of-life` は band の内側(`inset: band`)。children は本文。
- [ ] **Step 4: PASS**
- [ ] **Step 5: (site) layout 統合** — `src/app/(site)/layout.tsx` の `<body>{children}</body>` を `<body><SiteShell>{children}</SiteShell></body>` に。既存 `ThemeProvider asChild` 構造を壊さない。`pnpm test`(既存全件) と `pnpm dev` 目視で band+life+grid が出ることを確認（dev は任意）。
- [ ] **Step 6: showcase** — [ ] **Step 7: コミット** `feat(ui): SiteShell composes band + life + inset content; wire into (site) layout`

---

## Self-Review

- **Spec coverage:** §6 typography-band ✅(T4) / footer ✅(T8) / hero タイポ主役の素材=EchoText(T6)・GameOfLife(T2)・SectionHeading(T7) ✅。組版 T1 marquee ✅(T5) / T2 echo ✅(T6)。grid 背景は global-css 既存。
- **Placeholder scan:** 各 Task に test+実装要件。アニメ部は純ロジック(life/wrap)を TDD、副作用は client に隔離。
- **Type consistency:** `life.ts` の `Grid`/`step`/`countAlive`、`band-scroll.wrap` をコンポーネントが使用。`@components/heading` を SectionHeading が、`@components/game-of-life`/`typography-band` を SiteShell が使用。
- **規約注意:** `life.ts` のホットループは lint(no `let`/`forEach`)と衝突しうる → reduce/for-of で書くか、パフォと規約の両立を実装者が解決（テスト緑優先）。Canvas/scroll は `'use client'`+cleanup 必須。reduced-motion/visibility/observer を全アニメに。

## 注意（実装者向け）

- アニメ系(GameOfLife/TypographyBand/Marquee)の**視覚的正しさは unit テストで担保できない** → 純ロジック(life step/wrap)を厚くテストし、コンポーネントは「描画される/aria-hidden/cleanup される」ことを検証。視覚確認は `pnpm dev` + showcase で人間が行う前提。
- `fixed` 配置の GameOfLife/TypographyBand を showcase(通常フロー)で見せる際は、showcase 側で相対コンテナに入れるか、fixed のまま注記する。
- keyframe を足す Task(Marquee)は `panda.config.ts` 編集 → `pnpm panda codegen`。
