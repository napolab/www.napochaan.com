# Design System Token Foundation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** scaffold の既存トークン（dark-first / pink ブランド / Zen Kaku）を、確定 spec（light-first / クールニュートラル265° / 電撃ブルー266°＋赤25° / digibop・M PLUS 1・Config Mono / グリッド一体型 spacing / radius 0+pill / デュアル type スケール / stepped+glitch モーション）へ置き換え、WCAG AA をテストで機械的に保証する。

**Architecture:** Panda CSS の `tokens`（primitive ランプ）＋ `semanticTokens`（役割）を `src/themes/tokens/index.ts` に再定義。OKLCH→sRGB→WCAG コントラスト計算を純関数ユーティリティ（`src/themes/contrast.ts`）として実装し、semantic の全テキストペアが AA(≥4.5) を満たすことを vitest unit テストでガードする。フォントは next/font(M PLUS 1) ＋ Adobe Typekit kit `izz7men`（digibop / config-mono-vf）を layout で読み込む。

**Tech Stack:** Panda CSS 1.11（`strictTokens: true`）, vitest 4（unit プロジェクト = `*.test.ts` / node）, `@typescript/native-preview`(tsgo), oxfmt/oxlint, Next.js 15(App Router)。

**単一ソース spec:** `docs/design-system/tokens.md`

---

## サブプロジェクト分割（このプランは [1] のみ）

| #     | プラン                       | 内容                                                                                                                         |
| ----- | ---------------------------- | ---------------------------------------------------------------------------------------------------------------------------- |
| **1** | **Token Foundation**（本書） | Panda tokens / semanticTokens / contrast util + AA テスト / フォント配線 / global-css・layout を light-first 化              |
| 2     | Core Primitives              | Button / Link / Tag(pill) / Badge / Card(frame) / SystemAnnotation（react-aria + recipe）                                    |
| 3     | Layout & Signature           | GridBackground / GameOfLife canvas / TypographyBand(四辺フレーム) / SectionHeading / SiteFrame / Footer / echo・marquee 組版 |
| 4     | Content Components           | Hero / NewsLog / WorksTable / GigTimeline / Gallery(grid-snap+lightbox) / BlogIndex / AboutWhoami                            |
| 5     | CMS Integration              | Payload collections（news/works/gigs/gallery/blog）＋ 取得層                                                                 |
| 6     | Live Cursor                  | DurableObjects + WebSocket presence（✕+id）                                                                                  |

各プランは単体で動作・テスト可能。Plan 2 以降は本プラン完了後に都度作成する。

---

## File Structure（このプランで触るファイル）

- Create: `src/themes/contrast.ts` — OKLCH 文字列→sRGB→相対輝度→コントラスト比（純関数）
- Create: `src/themes/contrast.test.ts` — 既知値テスト（unit）
- Create: `src/themes/tokens/tokens.test.ts` — トークン値 + semantic AA ガード（unit）
- Modify: `src/themes/tokens/index.ts` — `tokens` / `semanticTokens` を spec へ全面置換
- Modify: `src/themes/fonts.ts` — Zen Kaku 廃止、M PLUS 1 のみ next/font
- Modify: `src/app/(site)/layout.tsx` — `dark` クラス撤去・Typekit link 追加・themeColor 変更
- Modify: `src/themes/global-css.ts` — light スキーム・見出しを display フォント・行間 spec 化
- Modify: `panda.config.ts` — keyframes に `blink` / `glitchShift` 追加

> `strictTokens: true` のため、トークン名を変更すると既存参照がコンパイルエラーになる。既存参照は scaffold の `src/app/(site)/_components/fade-in-heading*`・`src/themes/provider/*`・`src/themes/global-css.ts`・`src/app/(site)/styles.css.ts` 程度。各タスクで影響を確認し、壊れた参照は同タスク内で修正する。

---

## Task 1: WCAG コントラスト計算ユーティリティ

OKLCH 文字列をパースして sRGB に変換し、相対輝度とコントラスト比を返す純関数群。`functional-programming.md`（`let`/`forEach`/`any` 禁止、アロー関数）と `type-coercion.md`（`parseFloat`）に従う。

**Files:**

- Create: `src/themes/contrast.ts`
- Test: `src/themes/contrast.test.ts`

- [ ] **Step 1: 失敗するテストを書く**

`src/themes/contrast.test.ts`:

```ts
import { describe, expect, it } from 'vitest';

import { contrastRatio, oklchToSrgb, relativeLuminance } from './contrast';

describe('oklchToSrgb', () => {
  it('converts white', () => {
    const { r, g, b } = oklchToSrgb('oklch(1 0 0)');
    expect(r).toBeCloseTo(255, -0.5);
    expect(g).toBeCloseTo(255, -0.5);
    expect(b).toBeCloseTo(255, -0.5);
  });

  it('converts black', () => {
    const { r, g, b } = oklchToSrgb('oklch(0 0 0)');
    expect(r).toBe(0);
    expect(g).toBe(0);
    expect(b).toBe(0);
  });

  it('converts electric blue-9 near #1a34ff', () => {
    const { r, g, b } = oklchToSrgb('oklch(0.490 0.287 266)');
    // 許容: ±6 / 255（OKLCH→sRGB の実装差）
    expect(r).toBeGreaterThanOrEqual(0);
    expect(r).toBeLessThan(60);
    expect(b).toBeGreaterThan(220);
  });
});

describe('contrastRatio', () => {
  it('white vs black is 21:1', () => {
    expect(contrastRatio('oklch(1 0 0)', 'oklch(0 0 0)')).toBeCloseTo(21, 0);
  });

  it('blue-9 on paper passes AA normal (>=4.5)', () => {
    expect(contrastRatio('oklch(0.490 0.287 266)', 'oklch(0.963 0.003 265)')).toBeGreaterThanOrEqual(4.5);
  });

  it('ink on red-9 passes AA normal (black text on vivid red)', () => {
    expect(contrastRatio('oklch(0.145 0.020 265)', 'oklch(0.630 0.256 25)')).toBeGreaterThanOrEqual(4.5);
  });

  it('red-9 on paper fails AA normal (documents why red text must use red-11)', () => {
    expect(contrastRatio('oklch(0.630 0.256 25)', 'oklch(0.963 0.003 265)')).toBeLessThan(4.5);
  });
});

describe('relativeLuminance', () => {
  it('white is ~1, black is 0', () => {
    expect(relativeLuminance({ r: 255, g: 255, b: 255 })).toBeCloseTo(1, 2);
    expect(relativeLuminance({ r: 0, g: 0, b: 0 })).toBe(0);
  });
});
```

- [ ] **Step 2: テスト失敗を確認**

Run: `pnpm test -- --project unit src/themes/contrast.test.ts`
Expected: FAIL（`Cannot find module './contrast'`）

- [ ] **Step 3: ユーティリティを実装**

`src/themes/contrast.ts`:

```ts
export type Rgb = { r: number; g: number; b: number };

// "oklch(L C H)" → [L, C, H]
const parseOklch = (value: string): readonly [number, number, number] => {
  const match = value.match(/oklch\(\s*([\d.]+)\s+([\d.]+)\s+([\d.]+)/i);
  if (!match) throw new Error(`invalid oklch: ${value}`);
  const [, l, c, h] = match;
  return [parseFloat(l), parseFloat(c), parseFloat(h)] as const;
};

const clamp01 = (n: number): number => (n < 0 ? 0 : n > 1 ? 1 : n);

// linear sRGB component → gamma-encoded 0-255
const encode = (lin: number): number => {
  const c = clamp01(lin);
  const v = c <= 0.0031308 ? 12.92 * c : 1.055 * c ** (1 / 2.4) - 0.055;
  return Math.round(clamp01(v) * 255);
};

export const oklchToSrgb = (oklch: string): Rgb => {
  const [L, C, Hdeg] = parseOklch(oklch);
  const h = (Hdeg * Math.PI) / 180;
  const a = C * Math.cos(h);
  const bb = C * Math.sin(h);

  // OKLab → LMS
  const l_ = L + 0.3963377774 * a + 0.2158037573 * bb;
  const m_ = L - 0.1055613458 * a - 0.0638541728 * bb;
  const s_ = L - 0.0894841775 * a - 1.291485548 * bb;

  const l = l_ ** 3;
  const m = m_ ** 3;
  const s = s_ ** 3;

  // LMS → linear sRGB
  const rLin = 4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s;
  const gLin = -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s;
  const bLin = -0.0041960863 * l - 0.7034186147 * m + 1.707614701 * s;

  return { r: encode(rLin), g: encode(gLin), b: encode(bLin) };
};

const channelLuminance = (c8: number): number => {
  const c = c8 / 255;
  return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
};

export const relativeLuminance = ({ r, g, b }: Rgb): number =>
  0.2126 * channelLuminance(r) + 0.7152 * channelLuminance(g) + 0.0722 * channelLuminance(b);

export const contrastRatio = (fg: string, bg: string): number => {
  const lf = relativeLuminance(oklchToSrgb(fg));
  const lb = relativeLuminance(oklchToSrgb(bg));
  const hi = Math.max(lf, lb);
  const lo = Math.min(lf, lb);
  return (hi + 0.05) / (lo + 0.05);
};
```

- [ ] **Step 4: テスト合格を確認**

Run: `pnpm test -- --project unit src/themes/contrast.test.ts`
Expected: PASS（全 6 ケース）

- [ ] **Step 5: コミット**

```bash
git add src/themes/contrast.ts src/themes/contrast.test.ts
git commit -m "feat(theme): add OKLCH→sRGB WCAG contrast utility with tests"
```

---

## Task 2: カラーランプ（gray 265 / blue 266 / red 25）へ置換

`tokens.colors` を spec の 3 ランプ＋white/black に置換。既存の `oklchScale`/`grayScale` ジェネレータと pink/violet/cyan/green/yellow は削除し、spec の確定 OKLCH 値を直値で定義（再現性・検証容易性のため）。

**Files:**

- Modify: `src/themes/tokens/index.ts`（`tokens.colors` ブロックと先頭のジェネレータ/HUE 定義）
- Test: `src/themes/tokens/tokens.test.ts`

- [ ] **Step 1: 失敗するテストを書く**

`src/themes/tokens/tokens.test.ts`:

```ts
import { describe, expect, it } from 'vitest';

import { contrastRatio } from '../contrast';
import { tokens } from './index';

const val = (group: 'gray' | 'blue' | 'red', step: number): string => {
  const scale = tokens.colors[group] as Record<number, { value: string }>;
  return scale[step].value;
};

describe('color ramps', () => {
  it('blue-9 is the electric brand blue', () => {
    expect(val('blue', 9)).toBe('oklch(0.490 0.287 266)');
  });
  it('red-9 is the vivid danger red', () => {
    expect(val('red', 9)).toBe('oklch(0.630 0.256 25)');
  });
  it('gray is a cool neutral (hue 265)', () => {
    expect(val('gray', 1)).toContain('265');
  });
  it('only blue, red, gray ramps exist (no pink/violet/cyan)', () => {
    expect(tokens.colors).not.toHaveProperty('pink');
    expect(tokens.colors).not.toHaveProperty('violet');
  });
});

describe('raw ramp WCAG (on paper gray-1)', () => {
  it('ink (gray-12) on paper >= 4.5', () => {
    expect(contrastRatio(val('gray', 12), val('gray', 1))).toBeGreaterThanOrEqual(4.5);
  });
  it('blue-9 on paper >= 4.5 (link text safe)', () => {
    expect(contrastRatio(val('blue', 9), val('gray', 1))).toBeGreaterThanOrEqual(4.5);
  });
  it('ink on red-9 >= 4.5 (black label on red button)', () => {
    expect(contrastRatio(val('gray', 12), val('red', 9))).toBeGreaterThanOrEqual(4.5);
  });
});
```

- [ ] **Step 2: テスト失敗を確認**

Run: `pnpm test -- --project unit src/themes/tokens/tokens.test.ts`
Expected: FAIL（`tokens.colors.blue` 不在 / pink が存在）

- [ ] **Step 3: `tokens.colors` を置換**

`src/themes/tokens/index.ts` の先頭ジェネレータ（`oklchScale`/`grayScale`/`HUE`）を削除し、`tokens = defineTokens({ colors: {...} })` の `colors` を以下へ置換（`white`/`black` は残す）:

```ts
colors: {
  white: { value: 'oklch(1.000 0 0)' },
  black: { value: 'oklch(0.000 0 0)' },

  // cool neutral — hue 265, tiny chroma. paper(1) → ink(12)
  gray: {
    1: { value: 'oklch(0.963 0.003 265)' },
    2: { value: 'oklch(0.945 0.004 265)' },
    3: { value: 'oklch(0.918 0.005 265)' },
    4: { value: 'oklch(0.900 0.006 265)' },
    5: { value: 'oklch(0.884 0.007 265)' },
    6: { value: 'oklch(0.845 0.008 265)' },
    7: { value: 'oklch(0.785 0.010 265)' },
    8: { value: 'oklch(0.700 0.013 265)' },
    9: { value: 'oklch(0.560 0.016 265)' },
    10: { value: 'oklch(0.510 0.017 265)' },
    11: { value: 'oklch(0.430 0.018 265)' },
    12: { value: 'oklch(0.145 0.020 265)' },
  },

  // electric blue accent — hue 266
  blue: {
    1: { value: 'oklch(0.972 0.012 266)' },
    2: { value: 'oklch(0.955 0.024 266)' },
    3: { value: 'oklch(0.925 0.046 266)' },
    4: { value: 'oklch(0.892 0.070 266)' },
    5: { value: 'oklch(0.850 0.100 266)' },
    6: { value: 'oklch(0.788 0.142 266)' },
    7: { value: 'oklch(0.700 0.192 266)' },
    8: { value: 'oklch(0.600 0.245 266)' },
    9: { value: 'oklch(0.490 0.287 266)' },
    10: { value: 'oklch(0.450 0.270 266)' },
    11: { value: 'oklch(0.520 0.225 266)' },
    12: { value: 'oklch(0.330 0.150 266)' },
  },

  // danger / spot red — hue 25
  red: {
    1: { value: 'oklch(0.972 0.013 25)' },
    2: { value: 'oklch(0.957 0.024 25)' },
    3: { value: 'oklch(0.930 0.044 25)' },
    4: { value: 'oklch(0.898 0.066 25)' },
    5: { value: 'oklch(0.858 0.098 25)' },
    6: { value: 'oklch(0.800 0.140 25)' },
    7: { value: 'oklch(0.728 0.182 25)' },
    8: { value: 'oklch(0.672 0.225 25)' },
    9: { value: 'oklch(0.630 0.256 25)' },
    10: { value: 'oklch(0.585 0.250 25)' },
    11: { value: 'oklch(0.530 0.205 25)' },
    12: { value: 'oklch(0.350 0.130 25)' },
  },
},
```

- [ ] **Step 4: テスト合格を確認**

Run: `pnpm test -- --project unit src/themes/tokens/tokens.test.ts`
Expected: PASS（color ramps + raw WCAG）。
注: semantic 側はまだ pink を参照しているので `pnpm typecheck` は Task 7 まで赤のまま。ここでは unit テストのみ確認する。

- [ ] **Step 5: コミット**

```bash
git add src/themes/tokens/index.ts src/themes/tokens/tokens.test.ts
git commit -m "feat(theme): replace color ramps with cool-neutral + electric blue + red (spec)"
```

---

## Task 3: spacing / radii / borderWidths / sizes を spec へ

**Files:**

- Modify: `src/themes/tokens/index.ts`（`spacing` は据え置き可。`radii`/`borderWidths`/`sizes` と末尾 `semanticTokens.spacing` を更新）
- Test: `src/themes/tokens/tokens.test.ts`（追記）

- [ ] **Step 1: テスト追記（失敗確認用）**

`tokens.test.ts` に追記:

```ts
describe('shape tokens', () => {
  it('radius is sharp by default + pill only', () => {
    expect(tokens.radii.none.value).toBe('0');
    expect(tokens.radii.pill.value).toBe('9999px');
  });
  it('border widths are hairline/default/strong', () => {
    expect(tokens.borderWidths.hairline.value).toBe('1px');
    expect(tokens.borderWidths.default.value).toBe('2px');
    expect(tokens.borderWidths.strong.value).toBe('3px');
  });
  it('grid cell is the 24px module', () => {
    expect(tokens.sizes.gridCell.value).toBe('24px');
  });
});
```

- [ ] **Step 2: 失敗を確認**

Run: `pnpm test -- --project unit src/themes/tokens/tokens.test.ts`
Expected: FAIL（`radii.pill` 不在）

- [ ] **Step 3: トークン更新**

`radii` を置換:

```ts
radii: {
  none: { value: '0' },
  pill: { value: '9999px' },
},
```

`borderWidths` を置換:

```ts
borderWidths: {
  none: { value: '0' },
  hairline: { value: '1px' },
  default: { value: '2px' },
  strong: { value: '3px' },
},
```

`sizes` を置換:

```ts
sizes: {
  gridCell: { value: '24px' },
  band: { value: '24px' },
  targetMin: { value: '24px' },
  targetComfortable: { value: '44px' },
  headerHeight: { value: '72px' },
},
```

`semanticTokens.spacing`（ファイル末尾）を spec へ:

```ts
spacing: {
  inline: { value: '{spacing.2}' },   // 8px
  element: { value: '{spacing.3}' },   // 12px
  block: { value: '{spacing.6}' },     // 24px = module
  section: { value: '{spacing.12}' },  // 48px
  page: { value: '{spacing.6}' },      // 24px
},
```

> `spacing` の primitive スケール（0〜24）は据え置き（4px base、module=spacing.6=1.5rem）。

- [ ] **Step 4: 合格を確認**

Run: `pnpm test -- --project unit src/themes/tokens/tokens.test.ts`
Expected: PASS

- [ ] **Step 5: コミット**

```bash
git add src/themes/tokens/index.ts src/themes/tokens/tokens.test.ts
git commit -m "feat(theme): grid-module spacing, radius 0+pill, 1/2/3px borders"
```

---

## Task 4: タイポグラフィ（デュアルスケール / 行間エディトリアル / フォント）

**Files:**

- Modify: `src/themes/tokens/index.ts`（`fontSizes`/`lineHeights`/`letterSpacings`/`fontWeights`/`fonts`）
- Test: `src/themes/tokens/tokens.test.ts`（追記）

- [ ] **Step 1: テスト追記**

```ts
describe('typography tokens', () => {
  it('text scale base + explosive display clamp', () => {
    expect(tokens.fontSizes.md.value).toBe('1rem');
    expect(tokens.fontSizes.xl.value).toBe('1.4375rem'); // 23px
    expect(tokens.fontSizes.hero.value).toContain('clamp(');
  });
  it('editorial line-heights', () => {
    expect(tokens.lineHeights.none.value).toBe('0.9');
    expect(tokens.lineHeights.body.value).toBe('1.7');
    expect(tokens.lineHeights.jp.value).toBe('1.9');
  });
  it('font families: display digibop, mono config-mono-vf', () => {
    expect(tokens.fonts.display.value).toContain('digibop');
    expect(tokens.fonts.mono.value).toContain('config-mono-vf');
  });
});
```

- [ ] **Step 2: 失敗を確認**

Run: `pnpm test -- --project unit src/themes/tokens/tokens.test.ts`
Expected: FAIL（`fontSizes.hero` 不在 等）

- [ ] **Step 3: トークン更新**

`fontSizes` を置換（px は rem 換算: 11=0.6875, 12=0.75, 14=0.875, 16=1, 19=1.1875, 23=1.4375rem）:

```ts
fontSizes: {
  '2xs': { value: '0.6875rem' }, // 11
  xs: { value: '0.75rem' },      // 12 caption/mono
  sm: { value: '0.875rem' },     // 14
  md: { value: '1rem' },         // 16 body
  lg: { value: '1.1875rem' },    // 19
  xl: { value: '1.4375rem' },    // 23 (= h3)
  h3: { value: '1.4375rem' },    // 23
  h2: { value: 'clamp(1.75rem, 3.5vw, 2.0625rem)' },  // 28→33
  h1: { value: 'clamp(2.0625rem, 5vw, 3.1875rem)' },  // 33→51
  display: { value: 'clamp(3.5rem, 9vw, 6rem)' },     // 56→96
  hero: { value: 'clamp(4.5rem, 13vw, 10rem)' },      // 72→160
},
```

`lineHeights` を置換:

```ts
lineHeights: {
  none: { value: '0.9' },   // hero/display
  tight: { value: '1.2' },  // heading
  snug: { value: '1.4' },   // mono/system
  body: { value: '1.7' },   // body (Latin)
  jp: { value: '1.9' },     // 和文本文 / blog
},
```

`letterSpacings` を置換:

```ts
letterSpacings: {
  tighter: { value: '-0.04em' }, // hero/display
  tight: { value: '-0.02em' },   // heading
  normal: { value: '0' },
  wide: { value: '0.04em' },     // mono label
  wider: { value: '0.12em' },    // uppercase system kicker
},
```

`fontWeights` は spec 上 digibop=400 / M PLUS 1=400,500 / mono=400,500,600 のみ使用。最小化:

```ts
fontWeights: {
  normal: { value: '400' },
  medium: { value: '500' },
  semibold: { value: '600' },
},
```

`fonts` を置換（M PLUS 1 は next/font の CSS 変数、digibop/config-mono は Typekit のファミリ名）:

```ts
fonts: {
  display: { value: '"digibop", system-ui, sans-serif' },
  body: { value: 'var(--font-mplus1), system-ui, -apple-system, sans-serif' },
  mono: { value: '"config-mono-vf", ui-monospace, "Cascadia Code", monospace' },
},
```

> `heading` トークンは廃止し `display` に統一。`src/themes/global-css.ts` や `src/app/(site)/styles.css.ts` で `fontFamily: 'heading'` 参照があれば `display` へ置換（Task 8 で対応）。`lineHeights.relaxed/loose`・`letterSpacings.widest` など旧名を参照している箇所も同様に Task 8 で潰す。

- [ ] **Step 4: 合格を確認**

Run: `pnpm test -- --project unit src/themes/tokens/tokens.test.ts`
Expected: PASS

- [ ] **Step 5: コミット**

```bash
git add src/themes/tokens/index.ts src/themes/tokens/tokens.test.ts
git commit -m "feat(theme): dual type scale, editorial line-heights, digibop/mplus1/config-mono fonts"
```

---

## Task 5: モーション（durations / easings / keyframes）

**Files:**

- Modify: `src/themes/tokens/index.ts`（`durations`/`easings`）
- Modify: `panda.config.ts`（`keyframes` に `blink`/`glitchShift`）
- Test: `src/themes/tokens/tokens.test.ts`（追記）

- [ ] **Step 1: テスト追記**

```ts
describe('motion tokens', () => {
  it('stepped easing for mechanical feel', () => {
    expect(tokens.easings.stepSnap.value).toBe('steps(3, end)');
    expect(tokens.easings.step1.value).toBe('steps(1)');
  });
  it('durations include glitch', () => {
    expect(tokens.durations.base.value).toBe('150ms');
    expect(tokens.durations.glitch.value).toBe('630ms');
  });
});
```

- [ ] **Step 2: 失敗を確認**

Run: `pnpm test -- --project unit src/themes/tokens/tokens.test.ts`
Expected: FAIL（`easings.stepSnap` 不在）

- [ ] **Step 3: トークン更新**

`durations` を置換:

```ts
durations: {
  instant: { value: '0ms' },
  fast: { value: '90ms' },
  base: { value: '150ms' },
  snap: { value: '180ms' },
  slow: { value: '280ms' },
  glitch: { value: '630ms' },
},
```

`easings` を置換:

```ts
easings: {
  linear: { value: 'linear' },
  step1: { value: 'steps(1)' },          // 点滅/即時カット
  stepSnap: { value: 'steps(3, end)' },  // hover スナップ
},
```

`panda.config.ts` の `keyframes` に追加（既存 `fadeInUp` は残す）:

```ts
keyframes: {
  fadeInUp: {
    '0%': { opacity: '0', transform: 'translateY(16px)' },
    '100%': { opacity: '1', transform: 'translateY(0)' },
  },
  blink: {
    '50%': { opacity: '0' },
  },
  glitchShift: {
    '0%, 92%, 100%': { textShadow: 'none', transform: 'none' },
    '93%': { textShadow: '2px 0 var(--colors-red-9), -2px 0 var(--colors-blue-9)', transform: 'translateX(1px)' },
    '97%': { textShadow: '-1px 0 var(--colors-red-9), 1px 0 var(--colors-blue-9)', transform: 'translateX(-1px)' },
  },
},
```

- [ ] **Step 4: 合格を確認**

Run: `pnpm test -- --project unit src/themes/tokens/tokens.test.ts`
Expected: PASS

- [ ] **Step 5: コミット**

```bash
git add src/themes/tokens/index.ts panda.config.ts src/themes/tokens/tokens.test.ts
git commit -m "feat(theme): stepped motion tokens + blink/glitch keyframes"
```

---

## Task 6: フォント配線（next/font M PLUS 1 + Adobe Typekit）

**Files:**

- Modify: `src/themes/fonts.ts`（Zen Kaku 削除、M PLUS 1 のみ）
- Modify: `src/app/(site)/layout.tsx`（Typekit `<link>` 追加・`dark` クラス撤去・themeColor）

- [ ] **Step 1: `fonts.ts` を更新**

```ts
import { M_PLUS_1 } from 'next/font/google';

const mplus1 = M_PLUS_1({
  weight: ['400', '500'],
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-mplus1',
});

/** CSS class string to apply font variables to the root element */
export const fontVariables = mplus1.variable;
```

- [ ] **Step 2: `layout.tsx` を更新**

`html` の `className` から `'dark'` を削除し、`<head>` に Typekit kit を追加。`viewport.themeColor` を電撃ブルーへ。

`SiteLayout` を以下へ:

```tsx
export default async function SiteLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="ja" className={fontVariables}>
      <head>
        <link rel="stylesheet" href="https://use.typekit.net/izz7men.css" />
      </head>
      <ThemeProvider asChild>
        <body>{children}</body>
      </ThemeProvider>
    </html>
  );
}
```

`viewport` の themeColor を変更:

```ts
themeColor: 'oklch(0.490 0.287 266)',
```

- [ ] **Step 3: 型チェック（この時点では semantic 未修正で赤の可能性）**

Run: `pnpm typecheck`
Expected: `src/themes/tokens/index.ts` の semantic（pink 参照）と global-css 由来のエラーのみ。fonts.ts/layout.tsx 自体に新規エラーが無いことを確認。

- [ ] **Step 4: コミット**

```bash
git add src/themes/fonts.ts "src/app/(site)/layout.tsx"
git commit -m "feat(theme): wire M PLUS 1 (next/font) + Adobe Typekit (digibop/config-mono), light root"
```

---

## Task 7: semantic tokens を light-first へ全面置換

**Files:**

- Modify: `src/themes/tokens/index.ts`（`mix` ヘルパー削除、`semanticTokens.colors` 全置換）
- Test: `src/themes/tokens/tokens.test.ts`（semantic AA ガード追記）

- [ ] **Step 1: semantic AA ガードテストを追記**

```ts
import { semanticTokens, tokens } from './index';

// "{colors.blue.9}" → 実 OKLCH 値へ解決
const resolve = (ref: string): string => {
  const m = ref.match(/\{colors\.(\w+)\.(\d+)\}/);
  if (!m) throw new Error(`unresolvable: ${ref}`);
  const [, group, step] = m;
  const scale = tokens.colors[group as 'gray' | 'blue' | 'red'] as Record<number, { value: string }>;
  return scale[parseInt(step, 10)].value;
};
const sem = (path: string): string => {
  const node = path.split('.').reduce<unknown>((acc, k) => (acc as Record<string, unknown>)[k], semanticTokens.colors);
  return (node as { value: string }).value;
};

describe('semantic tokens WCAG AA (light theme)', () => {
  const canvas = resolve(sem('bg.canvas'));
  it('fg.default on bg.canvas >= 4.5', () => {
    expect(contrastRatio(resolve(sem('fg.default')), canvas)).toBeGreaterThanOrEqual(4.5);
  });
  it('fg.muted on bg.canvas >= 4.5', () => {
    expect(contrastRatio(resolve(sem('fg.muted')), canvas)).toBeGreaterThanOrEqual(4.5);
  });
  it('accent.text on bg.canvas >= 4.5', () => {
    expect(contrastRatio(resolve(sem('accent.text')), canvas)).toBeGreaterThanOrEqual(4.5);
  });
  it('danger.text on bg.canvas >= 4.5', () => {
    expect(contrastRatio(resolve(sem('danger.text')), canvas)).toBeGreaterThanOrEqual(4.5);
  });
  it('fg.onSolid on accent.solid >= 4.5 (white on blue button)', () => {
    expect(contrastRatio(resolve(sem('fg.onSolid')), resolve(sem('accent.solid')))).toBeGreaterThanOrEqual(4.5);
  });
  it('fg.onDanger on danger.solid >= 4.5 (black on red button)', () => {
    expect(contrastRatio(resolve(sem('fg.onDanger')), resolve(sem('danger.solid')))).toBeGreaterThanOrEqual(4.5);
  });
});
```

- [ ] **Step 2: 失敗を確認**

Run: `pnpm test -- --project unit src/themes/tokens/tokens.test.ts`
Expected: FAIL（`accent.text`/`fg.onDanger` 等が未定義 or pink 解決失敗）

- [ ] **Step 3: `semanticTokens` を置換**

ファイル末尾、`mix(...)` ヘルパー定義を削除し、`semanticTokens = defineSemanticTokens({...})` の `colors` を以下へ全置換（`spacing` は Task 3 のまま残す）:

```ts
colors: {
  bg: {
    canvas: { value: '{colors.gray.1}' },
    subtle: { value: '{colors.gray.2}' },
    muted: { value: '{colors.gray.3}' },
    emphasis: { value: '{colors.gray.5}' },
  },
  fg: {
    default: { value: '{colors.gray.12}' },
    muted: { value: '{colors.gray.11}' },
    subtle: { value: '{colors.gray.9}' }, // 大文字/UI のみ
    onSolid: { value: '{colors.gray.1}' }, // 青 solid 上の白文字
    onDanger: { value: '{colors.gray.12}' }, // 赤 solid 上は黒文字
  },
  border: {
    subtle: { value: '{colors.gray.6}' },
    default: { value: '{colors.gray.7}' },
    strong: { value: '{colors.gray.8}' },
    focus: { value: '{colors.blue.7}' },
  },
  grid: {
    line: { value: '{colors.gray.5}' },
  },
  accent: {
    solid: { value: '{colors.blue.9}' },
    solidHover: { value: '{colors.blue.10}' },
    text: { value: '{colors.blue.9}' },
    border: { value: '{colors.blue.7}' },
  },
  danger: {
    solid: { value: '{colors.red.9}' },
    solidHover: { value: '{colors.red.10}' },
    text: { value: '{colors.red.11}' },
    border: { value: '{colors.red.7}' },
    spot: { value: '{colors.red.9}' },
  },
},
```

- [ ] **Step 4: 合格を確認**

Run: `pnpm test -- --project unit src/themes/tokens/tokens.test.ts`
Expected: PASS（semantic AA 全ケース）

- [ ] **Step 5: コミット**

```bash
git add src/themes/tokens/index.ts src/themes/tokens/tokens.test.ts
git commit -m "feat(theme): light-first semantic tokens with WCAG AA guard tests"
```

---

## Task 8: global-css・参照修正・codegen・全体検証

旧トークン名（`bg`/`fg`/`heading`/`relaxed` 等）の参照を新名へ修正し、light スキーム化。Panda 再生成して lint/typecheck/test を全通過させる。

**Files:**

- Modify: `src/themes/global-css.ts`
- Modify: 旧トークン参照が残る箇所（`pnpm typecheck` が指す全ファイル。想定: `src/app/(site)/styles.css.ts`, `src/app/(site)/_components/fade-in-heading.css.ts`, `src/themes/provider/styles.css.ts`）

- [ ] **Step 1: `global-css.ts` を light-first・spec 化**

```ts
import type { GlobalStyleObject } from '@pandacss/dev';

export const globalCss: GlobalStyleObject = {
  'html, body': {
    bg: 'bg.canvas',
    color: 'fg.default',
    fontFamily: 'body',
    colorScheme: 'light',
    lineHeight: 'jp',
  },
  'h1, h2, h3, h4, h5, h6, p, li, dt, dd, th, td, label, figcaption, blockquote, caption': {
    wordBreak: 'auto-phrase',
  },
  'h1, h2, h3, h4, h5, h6': { fontFamily: 'display', fontWeight: 'normal' },
  h1: { lineHeight: 'tight', letterSpacing: 'tighter' },
  h2: { lineHeight: 'tight', letterSpacing: 'tight' },
  h3: { lineHeight: 'tight' },
};
```

- [ ] **Step 2: Panda 再生成**

Run: `pnpm panda codegen`
Expected: `styled-system/` 再生成（エラーなし）

- [ ] **Step 3: typecheck で残存参照を洗い出して修正**

Run: `pnpm typecheck`
旧トークン名を使う箇所を新名へ機械的に置換:

- `bg` → `bg.canvas` / `fg` → `fg.default`
- `fontFamily: 'heading'` → `'display'`
- `lineHeight: 'relaxed' | 'loose'` → `'body' | 'jp'`
- `letterSpacing: 'widest'` → `'wider'`
- `borderWidth: 'thin'|'medium'|'thick'` → `'hairline'|'default'|'strong'`
- `radii: 'sm'|'md'|...` → `'none'|'pill'`
- 色 `accent`/`accent.fg`/`danger.fg` → `accent.solid`/`accent.text`/`danger.text`
- `bg.glass`・`success`・`warning` 参照は削除 or 代替（該当箇所をその文脈に合う新トークンへ）

各ファイルを修正後、再度 `pnpm typecheck` まで繰り返し、Expected: エラー 0。

- [ ] **Step 4: lint・全テスト**

Run: `pnpm lint`
Expected: pass（`.tmp-mockups/` は .gitignore 済み）

Run: `pnpm test`
Expected: 全プロジェクト pass（unit の contrast/tokens、browser の既存 image テスト）

- [ ] **Step 5: dev 起動で目視（任意）**

Run: `pnpm dev`
確認: トップが白地・黒文字・電撃ブルーで表示され、ダーク基調・ピンクが消えていること。確認後 Ctrl-C。

- [ ] **Step 6: コミット**

```bash
git add -A
git commit -m "feat(theme): light-first global css, migrate token references, regenerate panda"
```

---

## Self-Review

- **Spec coverage:** color(§1)=Task2/7、spacing(§4)=Task3、radius/border(§5)=Task3、type(§2/スケール)=Task4/6、motion(§3)=Task5、WCAG=Task1/2/7。component(§6)/typography-band/組版は Plan 2–3。✅ 本プラン範囲は網羅。
- **Placeholder scan:** 各コード手順に実値・実コードを記載。`tokens.test.ts` は Task ごとに追記する同一ファイル（重複定義に注意: `import` は最初の追記時のみ、以降は describe ブロックのみ追加）。
- **Type consistency:** `tokens.colors.{gray|blue|red}[step].value`、semantic は `{colors.<group>.<step>}` 参照で統一。`fonts.display`/`fonts.mono`/`fonts.body` 名はタスク間一致。`easings.stepSnap`/`step1`、`durations.base/glitch` 一致。
- **strictTokens 注意:** トークン rename は全参照を Task 8 で解決してから codegen→typecheck を緑にする設計。

## 注意（実装者向け）

- `tokens.test.ts` は Task 2→7 で**追記**していく単一ファイル。`import` 行は Task 2 で `contrastRatio`/`tokens`、Task 7 で `semanticTokens` を足す（重複 import を作らない）。
- OKLCH→sRGB は実装系により ±数 LSB ずれる。テストは比率の AA 閾値（≥4.5）と緩い許容（`toBeCloseTo`）で判定し、ピクセル一致は要求しない。
- Adobe Typekit kit `izz7men` は napochaan 所有。CI/headless で外部 CSS が落ちても description テストに影響しないよう、フォントはあくまで表示のみ。
