# Performance Tuning Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Cut napochaan.com's cold-load transfer from 3.5 MB to under 1.2 MB, make revisits paint in under 0.5 s, and serve cached HTML/images from Workers Cache without invoking the Worker, while keeping Next.js + Payload + OpenNext.

**Architecture:** Six independent, byte-level fixes on the existing Next.js 15 App Router app: correct `sizes` on `next/image`, stop bundling a Node DOM shim, lazy-load gsap and the cursor WebSocket client behind the boot overlay, skip the 1 s boot floor for returning visitors, split the Adobe Fonts kit so Ryo Gothic loads only where used, and put Workers Cache in front of the Worker with a purge hook on every CMS write.

**Tech Stack:** Next.js 15.3 (webpack + turbopack configs), React 19, Panda CSS, react-aria-components, gsap 3.15, Hono 4 (worker layer), Payload 3.84, `@opennextjs/cloudflare` 1.18, wrangler 4.98, vitest 4 (browser project = `*.test.tsx`, node project = `src/**/*.test.ts`, workers project = `worker/**/*.test.ts`).

**Spec:** `docs/superpowers/specs/2026-09-22-performance-tuning-design.md` (measurements in `reports/2026-09-22-production-perf-audit.md`)

## Global Constraints

- Never commit. The owner commits. Each task ends with `pnpm lint && pnpm typecheck && pnpm test` green and a `difit` review request instead of a commit step.
- Arrow functions only at top level; no `let`, no IIFE, no `forEach`, no `!` non-null, no `any`, no `.then()` in handlers (`async` callbacks instead). See `.claude/rules/*`.
- `tsconfig.json` `paths` are frozen. Aliases in use: `@components/*`, `@utils/*`, `@hooks/*`, `@lib/*`, `@themes/*`, `@worker/*`, `@styled/*`.
- Use `src/components/image` (never `next/image` directly) and `formatBlurURL` for blur placeholders.
- Strings must round-trip lint: `pnpm fmt` before handing over.
- Verification of bundle changes is done on the build artifact (`pnpm build` then grep `.next/static/chunks`) — tests alone do not prove a chunk is gone.
- Task 6 (kit split) is blocked until the owner provides two Adobe Fonts kit IDs. Task 7 enables Workers Cache on staging only; production is a follow-up PR after staging verification.

## Review Focus

1. A `/works` list with 30+ thumbnails at 64 px must not request anything wider than 128 px (2× DPR) — Task 1 tests pin `sizes` on the archive thumb.
2. A rich-text `Figure` with `fit="intrinsic"` and a 400 px source must never request a 1180 px candidate — Task 1 tests pin the intrinsic `sizes` branch.
3. A visitor whose `localStorage` throws (private mode) must still get the normal 1 s boot, and the page must never stay covered — Task 5 tests wrap storage access and pin the "storage throws" case.
4. A CMS write from the Payload CLI (`payload seed`/`migrate`, no Worker context) must not crash on `getCloudflareContext` — Task 7 tests pin the "outside worker" no-op.
5. A dynamic response that already says `private, no-store` (contact, admin, preview) must never be rewritten to a public policy by the worker middleware — Task 7 tests pin "existing Cache-Control wins" and "Set-Cookie wins".

---

### Task 1: Correct `sizes` on every `Image` call site

**Files:**

- Create: `src/components/gallery/sizes.ts`, `src/components/gallery/sizes.test.ts`
- Modify: `src/app/(site)/_components/works-section/index.tsx:32-40`
- Modify: `src/app/(site)/works/_components/works-archive/index.tsx:57-65`
- Modify: `src/app/(site)/works/[slug]/_components/related-works/index.tsx:39-47`
- Modify: `src/components/figure/index.tsx:9-46`
- Modify: `src/components/gallery/index.tsx:40-48`
- Modify: `src/components/gallery/lightbox/index.tsx:37-46`
- Modify: `src/components/rich-text/converters/image-row/index.tsx:42-53`
- Modify: `next.config.ts:5-15`
- Test: `src/components/figure/figure.test.tsx`, `src/components/gallery/gallery.test.tsx`, `src/components/gallery/sizes.test.ts`

**Interfaces:**

- Consumes: `Image` (`src/components/image`) forwards every `next/image` prop, including `sizes`. The test mock (`src/__mocks__/next/image.tsx`) exposes `sizes` as `data-sizes` on the rendered `<img>`.
- Produces: `Figure` gains an optional `sizes?: string` prop; `gallerySizes(area: GalleryArea): string` helper.

Rationale: without `sizes`, `next/image` emits `sizes="100vw"` and the browser picks the largest `deviceSizes` candidate (3840 on a 2.6× phone) even for a 40 px thumbnail. The site content column is capped at 1180 px (`src/components/site-shell/styles.css.ts:32`).

- [ ] **Step 1: Write the failing gallery sizes test**

```ts
// src/components/gallery/sizes.test.ts
import { describe, expect, it } from 'vitest';

import { gallerySizes } from './sizes';

describe('gallerySizes', () => {
  it('maps a 2-of-6 column area to a third of the 1180px column', () => {
    expect(gallerySizes('lead')).toBe('(min-width: 1180px) 393px, 33vw');
  });

  it('maps the 4-of-6 wide area to two thirds', () => {
    expect(gallerySizes('wide')).toBe('(min-width: 1180px) 787px, 67vw');
  });

  it('covers every named area', () => {
    for (const area of ['lead', 'sub', 'wide', 'square', 'column', 'inset'] as const) {
      expect(gallerySizes(area)).toMatch(/^\(min-width: 1180px\) \d+px, \d+vw$/);
    }
  });
});
```

- [ ] **Step 2: Run it to verify it fails**

Run: `pnpm vitest run src/components/gallery/sizes.test.ts`
Expected: FAIL — `Cannot find module './sizes'`

- [ ] **Step 3: Implement the helper**

```ts
// src/components/gallery/sizes.ts
import type { GalleryArea } from './index';

// Column span of each named template area out of the 6-column grid in styles.css.ts.
const COLUMN_SPAN: Record<GalleryArea, number> = {
  lead: 2,
  sub: 2,
  wide: 4,
  square: 2,
  column: 2,
  inset: 2,
};

const COLUMNS = 6;
// The site content column caps at 1180px (site-shell styles); above that the
// grid stops growing, so the candidate width is fixed in px.
const CONTENT_MAX_PX = 1180;

/** `sizes` attribute for a gallery cell: a fraction of the viewport below the
 * content cap, a fixed px width above it. */
export const gallerySizes = (area: GalleryArea): string => {
  const fraction = COLUMN_SPAN[area] / COLUMNS;

  return `(min-width: ${CONTENT_MAX_PX}px) ${Math.round(CONTENT_MAX_PX * fraction)}px, ${Math.round(fraction * 100)}vw`;
};
```

Note: `index.tsx` already exports `GalleryArea`; importing the type from `./index` is a type-only import (no runtime cycle).

- [ ] **Step 4: Run it to verify it passes**

Run: `pnpm vitest run src/components/gallery/sizes.test.ts`
Expected: PASS (3 tests)

- [ ] **Step 5: Add the failing Figure sizes tests**

Append to `src/components/figure/figure.test.tsx` (keep the existing tests; match its render helper — it uses `vitest-browser-react`'s `render`):

```tsx
  it('passes a content-column sizes attribute by default', async () => {
    const screen = await render(<Figure src="/a.jpg" alt="a" width={1600} height={900} />);
    const img = screen.container.querySelector('[data-testid="next-image"]');
    expect(img?.getAttribute('data-sizes')).toBe('(min-width: 1180px) 1180px, 100vw');
  });

  it('caps sizes at the intrinsic width for fit="intrinsic"', async () => {
    const screen = await render(<Figure src="/a.jpg" alt="a" width={400} height={300} variant="cover" fit="intrinsic" />);
    const img = screen.container.querySelector('[data-testid="next-image"]');
    expect(img?.getAttribute('data-sizes')).toBe('(min-width: 400px) 400px, 100vw');
  });

  it('lets a caller override sizes', async () => {
    const screen = await render(<Figure src="/a.jpg" alt="a" width={1600} height={900} sizes="50vw" />);
    const img = screen.container.querySelector('[data-testid="next-image"]');
    expect(img?.getAttribute('data-sizes')).toBe('50vw');
  });
```

- [ ] **Step 6: Run to verify they fail**

Run: `pnpm vitest run src/components/figure/figure.test.tsx`
Expected: FAIL — `data-sizes` is `null` / `sizes` prop is rejected by TypeScript

- [ ] **Step 7: Implement `sizes` in Figure**

In `src/components/figure/index.tsx`:

```tsx
type Props = {
  // ...existing props unchanged...
  zoomable?: boolean;
  // `sizes` for the responsive candidate selection. Defaults to the site content
  // column (100vw up to the 1180px cap); intrinsic fit caps at the source width
  // since the frame never renders it larger than that.
  sizes?: string;
};

const CONTENT_MAX_PX = 1180;

const resolveSizes = (fit: Props['fit'], width: number, sizes: string | undefined): string => {
  if (sizes !== undefined) return sizes;
  if (fit === 'intrinsic') return `(min-width: ${width}px) ${width}px, 100vw`;
  return `(min-width: ${CONTENT_MAX_PX}px) ${CONTENT_MAX_PX}px, 100vw`;
};

export const Figure = ({ src, alt, width, height, caption, placeholder, blurDataURL, variant = 'plain', fit = 'fill', zoomable = false, sizes }: Props) => {
  const captionClassName = variant === 'cover' ? styles.tag : styles.caption;
  const image = (
    <Image src={src} alt={alt} width={width} height={height} sizes={resolveSizes(fit, width, sizes)} placeholder={placeholder} blurDataURL={blurDataURL} className={styles.image} />
  );
  // ...rest unchanged...
```

- [ ] **Step 8: Run Figure tests**

Run: `pnpm vitest run src/components/figure/figure.test.tsx`
Expected: PASS

- [ ] **Step 9: Add the failing gallery cell test**

Append to `src/components/gallery/gallery.test.tsx` (reuse its existing fixture items; `wide` item must exist or add one):

```tsx
  it('sizes each cell by its grid area', async () => {
    const screen = await render(<Gallery items={[{ id: 'w', src: '/w.jpg', alt: 'w', width: 1600, height: 900, area: 'wide' }]} />);
    const img = screen.container.querySelector('[data-testid="next-image"]');
    expect(img?.getAttribute('data-sizes')).toBe('(min-width: 1180px) 787px, 67vw');
  });
```

- [ ] **Step 10: Run to verify it fails, then wire `sizes` in the gallery cell and lightbox**

Run: `pnpm vitest run src/components/gallery/gallery.test.tsx` → FAIL (`data-sizes` null).

`src/components/gallery/index.tsx`:

```tsx
import { gallerySizes } from './sizes';
// ...
        <Image
          src={item.src}
          alt={item.alt}
          width={item.width}
          height={item.height}
          sizes={gallerySizes(item.area)}
          className={styles.gridImage}
          placeholder="blur"
          blurDataURL={formatBlurURL(item.src, { blur: 10, width: 32, quality: 30 })}
        />
```

`src/components/gallery/lightbox/index.tsx` — the modal image is `min(80vh, 88vw / ar)` wide, so:

```tsx
                <Image
                  src={src}
                  alt={alt}
                  width={width}
                  height={height}
                  sizes="88vw"
                  className={styles.modalImage}
                  style={imageStyle}
                  placeholder="blur"
                  blurDataURL={formatBlurURL(src, { blur: 10, width: 32, quality: 30 })}
                />
```

Run: `pnpm vitest run src/components/gallery` → PASS.

- [ ] **Step 11: Fixed-size thumbnails**

`src/app/(site)/_components/works-section/index.tsx` (CSS `thumb` is 40×40):

```tsx
        <Image
          src={work.thumbnail.src}
          alt={work.title}
          width={work.thumbnail.width}
          height={work.thumbnail.height}
          sizes="40px"
          className={styles.thumb}
          placeholder="blur"
          blurDataURL={formatBlurURL(work.thumbnail.src, { blur: 20 })}
        />
```

`src/app/(site)/works/_components/works-archive/index.tsx` and `src/app/(site)/works/[slug]/_components/related-works/index.tsx` (CSS `thumb` is 64×64): add `sizes="64px"` to the `<Image>` in the same position.

If `works-archive` or `related-works` has a `.test.tsx`, add one assertion each: `expect(img?.getAttribute('data-sizes')).toBe('64px')`.

- [ ] **Step 12: image-row cells**

`src/components/rich-text/converters/image-row/index.tsx` — cells are `flex: 0 0 78%` below a 480px container and equal-split above. Pass `sizes="(min-width: 480px) 50vw, 78vw"` to the `<Figure>` in `cellFigure`:

```tsx
const cellFigure = (image: PopulatedImage, caption: unknown, key: number): React.ReactNode => (
  <div key={key} className={styles.cellRoot}>
    <Figure
      // ...existing props...
      sizes="(min-width: 480px) 50vw, 78vw"
      blurDataURL={formatBlurURL(image.url, { blur: 20 })}
    />
  </div>
);
```

(Keep the existing JSX shape; only add the `sizes` prop.)

- [ ] **Step 13: Drop the 3840 device size**

`next.config.ts`, inside `nextConfig`:

```ts
  images: {
    // 3840 is only useful for full-bleed art on a 4K display; every image here sits
    // in the ≤1180px content column, so the largest 2× candidate is 2048.
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048],
  },
```

- [ ] **Step 14: Lint, typecheck, full test**

Run: `pnpm fmt && pnpm lint && pnpm typecheck && pnpm test`
Expected: all green.

- [ ] **Step 15: Build-artifact verification**

Run: `pnpm build` then `grep -o 'sizes="[^"]*"' .next/server/app/\(site\)/\(home\)/page.html | sort | uniq -c` (if the page is prerendered) — every `<img>` shows the intended `sizes`; no `sizes="100vw"` remains on thumbnails. Note the result in `reports/2026-09-22-production-perf-audit.md` under a new "## After: Task 1" heading.

- [ ] **Step 16: Review request**

Run `difit` and ask the owner to review. Do not commit.

---

### Task 2: Keep `linkedom` out of the client bundle

**Files:**

- Create: `src/shims/empty-module.ts`
- Create: `src/config/client-aliases.ts`, `src/config/client-aliases.test.ts`
- Modify: `next.config.ts` (webpack function and `turbopack` block)

**Interfaces:**

- Produces: `applyClientAliases(config: WebpackResolveConfig, isServer: boolean): void` and `TURBOPACK_RESOLVE_ALIAS` (object for `turbopack.resolveAlias`).

Rationale: `budoux/module/html_processor.js` → `dom.js` imports `linkedom` unconditionally; `TypewriterText` ('use client') → `PhrasedText` → `@utils/phrase` → `budoux` drags 225 KB (decoded) of DOM implementation into chunk 2820. `phrase()` only calls `parser.parse(text)` and never touches the DOM.

- [ ] **Step 1: Write the failing alias tests**

```ts
// src/config/client-aliases.test.ts
import { describe, expect, it } from 'vitest';

import { applyClientAliases, TURBOPACK_RESOLVE_ALIAS } from './client-aliases';

describe('applyClientAliases', () => {
  it('maps linkedom to false for the client bundle', () => {
    const config = { resolve: { alias: { existing: './x' } } };
    applyClientAliases(config, false);
    expect(config.resolve.alias).toEqual({ existing: './x', linkedom: false });
  });

  it('leaves the server bundle alone', () => {
    const config = { resolve: { alias: {} } };
    applyClientAliases(config, true);
    expect(config.resolve.alias).toEqual({});
  });

  it('creates resolve.alias when webpack has none', () => {
    const config = { resolve: {} } as { resolve: { alias?: Record<string, string | false> } };
    applyClientAliases(config, false);
    expect(config.resolve.alias).toEqual({ linkedom: false });
  });
});

describe('TURBOPACK_RESOLVE_ALIAS', () => {
  it('points the browser condition of linkedom at the empty shim', () => {
    expect(TURBOPACK_RESOLVE_ALIAS).toEqual({ linkedom: { browser: './src/shims/empty-module.ts' } });
  });
});
```

- [ ] **Step 2: Run to verify it fails**

Run: `pnpm vitest run src/config/client-aliases.test.ts`
Expected: FAIL — module not found

- [ ] **Step 3: Implement shim + aliases**

```ts
// src/shims/empty-module.ts
// Empty module the client bundle resolves `linkedom` to. budoux's html_processor
// imports linkedom unconditionally, but our only client-reachable use
// (`@utils/phrase` → parser.parse) never touches it. See next.config.ts.
export {};
```

```ts
// src/config/client-aliases.ts
type WebpackResolveConfig = { resolve: { alias?: Record<string, string | false> } };

/** Aliases applied only to the browser bundle. `false` tells webpack to resolve
 * the module to an empty object. */
const CLIENT_ALIASES: Record<string, false> = { linkedom: false };

export const applyClientAliases = (config: WebpackResolveConfig, isServer: boolean): void => {
  if (isServer) return;
  config.resolve.alias = { ...(config.resolve.alias ?? {}), ...CLIENT_ALIASES };
};

/** Turbopack equivalent — the `browser` condition only, so server/OG code keeps the
 * real linkedom (OG `clamp-title` runs budoux on the server). */
export const TURBOPACK_RESOLVE_ALIAS = { linkedom: { browser: './src/shims/empty-module.ts' } } as const;
```

- [ ] **Step 4: Run tests**

Run: `pnpm vitest run src/config/client-aliases.test.ts`
Expected: PASS (4 tests)

- [ ] **Step 5: Wire into next.config.ts**

```ts
import { applyClientAliases, TURBOPACK_RESOLVE_ALIAS } from './src/config/client-aliases';
// ...
  turbopack: {
    resolveAlias: TURBOPACK_RESOLVE_ALIAS,
    rules: { /* unchanged */ },
  },
  webpack: (config, { isServer }) => {
    applyClientAliases(config, isServer);
    config.module.rules.push({ /* unchanged svg rule */ });
    return config;
  },
```

- [ ] **Step 6: Build and verify the chunk is gone**

Run: `pnpm build && grep -l "before-selector" .next/static/chunks/*.js | wc -l`
Expected: `0` (the cssom state-machine string that identified chunk 2820). Also `grep -l "before-selector" .next/server/**/*.js | head -1` should still find the server copy (OG path intact).

Then: `pnpm vitest run src/components/phrased-text src/components/typewriter-text` — PASS.

- [ ] **Step 7: Lint, typecheck, full test, review**

Run: `pnpm fmt && pnpm lint && pnpm typecheck && pnpm test`. Record the chunk removal in the report. Run `difit`; do not commit.

---

### Task 3: Lazy-load gsap behind a shared loader

**Files:**

- Create: `src/utils/gsap/index.ts`, `src/utils/gsap/gsap.test.tsx`
- Modify: `src/components/echo-text/index.tsx`
- Modify: `src/components/scramble-text/index.tsx`
- Modify: `src/components/typography-band/index.tsx`
- Test: existing `echo-text.test.tsx`, `scramble-text.test.tsx`, `typography-band.test.tsx` must stay green

**Interfaces:**

- Produces: `loadGsap(): Promise<GsapBundle>` where `type GsapBundle = { gsap: typeof gsap; ScrambleTextPlugin; ScrollTrigger; ScrollToPlugin }`, memoised, plugins registered once.

Rationale: the three components statically import gsap + 3 plugins (127 KB decoded) into the site layout chunk graph. Nothing animates before the boot overlay lifts, so the import can start in an effect.

- [ ] **Step 1: Write the failing loader test**

```tsx
// src/utils/gsap/gsap.test.tsx  (browser project — gsap needs a DOM)
import { describe, expect, it } from 'vitest';

import { loadGsap } from './index';

describe('loadGsap', () => {
  it('resolves gsap with the scramble, scroll-trigger and scroll-to plugins registered', async () => {
    const { gsap } = await loadGsap();
    expect(gsap.plugins.scrambleText).toBeDefined();
    expect(gsap.plugins.scrollTrigger).toBeDefined();
    expect(gsap.plugins.scrollTo).toBeDefined();
  });

  it('returns the same bundle on repeated calls', async () => {
    const a = await loadGsap();
    const b = await loadGsap();
    expect(a).toBe(b);
  });
});
```

- [ ] **Step 2: Run to verify it fails**

Run: `pnpm vitest run src/utils/gsap/gsap.test.tsx` → FAIL (module not found)

- [ ] **Step 3: Implement the loader**

```ts
// src/utils/gsap/index.ts
import type gsapType from 'gsap';
import type { ScrambleTextPlugin as ScrambleTextPluginType } from 'gsap/ScrambleTextPlugin';
import type { ScrollToPlugin as ScrollToPluginType } from 'gsap/ScrollToPlugin';
import type { ScrollTrigger as ScrollTriggerType } from 'gsap/ScrollTrigger';

export type GsapBundle = {
  gsap: typeof gsapType;
  ScrambleTextPlugin: typeof ScrambleTextPluginType;
  ScrollTrigger: typeof ScrollTriggerType;
  ScrollToPlugin: typeof ScrollToPluginType;
};

const load = async (): Promise<GsapBundle> => {
  const [{ default: gsap }, { ScrambleTextPlugin }, { ScrollTrigger }, { ScrollToPlugin }] = await Promise.all([
    import('gsap'),
    import('gsap/ScrambleTextPlugin'),
    import('gsap/ScrollTrigger'),
    import('gsap/ScrollToPlugin'),
  ]);
  gsap.registerPlugin(ScrambleTextPlugin, ScrollTrigger, ScrollToPlugin);

  return { gsap, ScrambleTextPlugin, ScrollTrigger, ScrollToPlugin };
};

// One shared promise: gsap and its plugins are loaded once per document, after the
// first component that needs them mounts. Keeps gsap out of the initial chunk graph
// (site layout) — nothing animates before the boot overlay lifts anyway.
const cache: { promise: Promise<GsapBundle> | undefined } = { promise: undefined };

export const loadGsap = (): Promise<GsapBundle> => {
  if (cache.promise === undefined) cache.promise = load();
  return cache.promise;
};
```

- [ ] **Step 4: Run loader tests** → PASS.

- [ ] **Step 5: Rewrite EchoText on the loader**

Replace the static imports and `useGSAP` in `src/components/echo-text/index.tsx`:

```tsx
'use client';

import { useCallback, useEffect, useRef } from 'react';

import { useBootReady } from '@components/boot-status';
import { loadGsap } from '@utils/gsap';
import { prefersReducedMotion } from '@utils/prefers-reduced-motion';

import * as styles from './styles.css';

import type { GsapBundle } from '@utils/gsap';

const CHARS = '█▓▒░#%&@/\\<>0123456789';
const DURATION = 1.1;

type Props = {
  children: string;
  size?: 'hero' | 'compact';
};

// The decode tween body (unchanged behaviour — see the CLS notes in git history:
// the box is pinned to the settled width for the tween's lifetime).
const decodeWith = ({ gsap }: GsapBundle, el: HTMLElement, text: string): void => {
  gsap.set(el, { display: 'inline-block', width: el.offsetWidth });
  gsap.to(el, {
    duration: DURATION,
    ease: 'none',
    overwrite: true,
    scrambleText: { text, chars: CHARS, speed: 0.45, revealDelay: 0.35, tweenLength: false },
    onComplete: () => {
      gsap.set(el, { clearProps: 'display,width' });
    },
  });
};

export const EchoText = ({ children, size = 'hero' }: Props) => {
  const rootRef = useRef<HTMLSpanElement>(null);
  const fillRef = useRef<HTMLSpanElement>(null);
  // gsap.context scoped to the root; created once the bundle has loaded and reverted on unmount.
  const contextRef = useRef<gsap.core.Context | null>(null);
  const bootReady = useBootReady();

  const decode = useCallback(async () => {
    if (prefersReducedMotion()) return;
    const bundle = await loadGsap();
    const el = fillRef.current;
    const ctx = contextRef.current;
    if (el === null || ctx === null) return;
    ctx.add(() => decodeWith(bundle, el, children));
  }, [children]);

  useEffect(() => {
    if (!bootReady) return;
    const state = { cancelled: false };
    const run = async () => {
      const bundle = await loadGsap();
      if (state.cancelled) return;
      contextRef.current = bundle.gsap.context(() => {}, rootRef);
      await decode();
    };
    void run();

    return () => {
      state.cancelled = true;
      contextRef.current?.revert();
      contextRef.current = null;
    };
  }, [bootReady, decode]);

  // pointerenter fires for every pointer type — the wordmark re-decodes on hover AND tap.
  const handleEnter = useCallback(async () => {
    await decode();
  }, [decode]);

  return (
    /* JSX unchanged */
  );
};
```

Note: `gsap.core.Context` is available as a global type once `gsap` types are in the project (already true — `typography-band` uses `gsap.core.Tween`). If the type is not visible without the value import, use `import type { gsap as gsapNs } from 'gsap'` and `gsapNs.core.Context`.

- [ ] **Step 6: Run EchoText tests**

Run: `pnpm vitest run src/components/echo-text` → PASS. If a test asserts a scramble happened synchronously after mount, switch it to `await expect.poll(...)` (the tween now starts after the dynamic import resolves).

- [ ] **Step 7: Rewrite ScrambleText on the loader**

Same shape: replace the static imports with `loadGsap`, keep every comment about the matchMedia/contextSafe cycle, and move the body into an effect:

```tsx
  useEffect(() => {
    const state = { cancelled: false };
    const run = async () => {
      const { gsap, ScrollTrigger } = await loadGsap();
      if (state.cancelled || rootRef.current === null) return;
      const ctx = gsap.context(() => {
        const runDecode = (duration: number) => { /* unchanged body, uses `gsap` from the bundle */ };
        const mm = gsap.matchMedia();
        mm.add(DESKTOP, (_ctx, contextSafe) => { /* unchanged */ });
        mm.add(MOBILE, (_ctx, contextSafe) => { /* unchanged, uses ScrollTrigger from the bundle */ });
      }, rootRef);
      state.revert = () => ctx.revert();
    };
    void run();

    return () => {
      state.cancelled = true;
      state.revert?.();
    };
  }, [children, host, bootReady]);
```

Declare `const state: { cancelled: boolean; revert?: () => void } = { cancelled: false };`. The `useGSAP` dependency list `[children, host, bootReady]` becomes the effect's dependency list. Remove `useGSAP`/`@gsap/react` imports from the file.

- [ ] **Step 8: Run ScrambleText tests** → PASS (poll where needed).

- [ ] **Step 9: Rewrite TypographyBand on the loader**

```tsx
  useEffect(() => {
    if (reduced) return;
    const state: { cancelled: boolean; cleanup?: () => void } = { cancelled: false };
    const run = async () => {
      const { gsap, ScrollTrigger } = await loadGsap();
      if (state.cancelled) return;
      /* unchanged body: reads the four track refs, creates the ticker, ScrollTrigger, snap listeners */
      state.cleanup = () => { /* the existing cleanup body */ };
    };
    void run();

    return () => {
      state.cancelled = true;
      state.cleanup?.();
    };
  }, [reduced]);
```

Use `type Tween = ReturnType<GsapBundle['gsap']['to']>` for the `snap.tween` field instead of `gsap.core.Tween`.

- [ ] **Step 10: Run TypographyBand tests** → PASS.

- [ ] **Step 11: Remove `@gsap/react`**

`grep -rn "@gsap/react" src` must be empty, then `pnpm remove @gsap/react` and delete `'@gsap/react'` from `optimizeDeps.include` in `vitest.config.ts`.

- [ ] **Step 12: Build-artifact verification**

Run: `pnpm build && grep -l "ScrambleTextPlugin\|scrambleText" .next/static/chunks/app/\(site\)/layout-*.js .next/static/chunks/app/\(site\)/\(home\)/page-*.js | wc -l` → `0`. The gsap code must live only in async chunks (`grep -l scrambleText .next/static/chunks/*.js` lists chunks that are not referenced by the layout/page entry).

- [ ] **Step 13: Lint, typecheck, full test, review**

Run: `pnpm fmt && pnpm lint && pnpm typecheck && pnpm test`. Report the JS delta. Run `difit`; do not commit.

---

### Task 4: Lazy-load the cursor WebSocket client

**Files:**

- Create: `src/lib/cursor/lazy-visitor-pointer-app.ts`, `src/lib/cursor/lazy-visitor-pointer-app.test.ts`
- Modify: `src/components/cursor-presence/index.tsx:8,32`

**Interfaces:**

- Consumes: `VisitorPointerApp`, `VisitorPointerState` from `src/lib/cursor/visitor-pointer-app.ts` (type-only).
- Produces: `createLazyVisitorPointerApp(): VisitorPointerApp` — same interface; the real app (hono/client + zod + reconnecting-websocket + durabcast) is imported on the first `start()`.

- [ ] **Step 1: Write the failing test**

```ts
// src/lib/cursor/lazy-visitor-pointer-app.test.ts
import { describe, expect, it, vi } from 'vitest';

import type { VisitorPointerApp, VisitorPointerState } from './visitor-pointer-app';

// vi.mock is hoisted above every import, so the fake must be built inside
// vi.hoisted or the factory would read `real` before initialisation.
const { real } = vi.hoisted(() => {
  const listeners = new Set<(s: VisitorPointerState) => void>();
  const state: { value: VisitorPointerState } = { value: { visitors: new Map(), count: 0 } };
  const app: VisitorPointerApp & { emit: (s: VisitorPointerState) => void } = {
    start: vi.fn(),
    end: vi.fn(),
    setChannel: vi.fn(),
    send: vi.fn(),
    getState: () => state.value,
    subscribe: (l) => {
      listeners.add(l);
      return () => {
        listeners.delete(l);
      };
    },
    emit: (s) => {
      state.value = s;
      for (const l of listeners) l(s);
    },
  };
  return { real: app };
});

vi.mock('./visitor-pointer-app', () => ({ createVisitorPointerApp: () => real }));

describe('createLazyVisitorPointerApp', () => {
  it('exposes an empty state before start()', async () => {
    const { createLazyVisitorPointerApp } = await import('./lazy-visitor-pointer-app');
    const app = createLazyVisitorPointerApp();
    expect(app.getState()).toEqual({ visitors: new Map(), count: 0 });
    expect(real.start).not.toHaveBeenCalled();
  });

  it('starts the real app on start(), replays the channel and forwards state', async () => {
    const { createLazyVisitorPointerApp } = await import('./lazy-visitor-pointer-app');
    const app = createLazyVisitorPointerApp();
    const listener = vi.fn();
    app.subscribe(listener);
    app.setChannel('/works');
    app.start();
    await vi.waitFor(() => expect(real.start).toHaveBeenCalledOnce());
    expect(real.setChannel).toHaveBeenCalledWith('/works');
    real.emit({ visitors: new Map(), count: 3 });
    expect(listener).toHaveBeenCalledWith({ visitors: new Map(), count: 3 });
    expect(app.getState().count).toBe(3);
  });

  it('does not start the real app when end() races the import', async () => {
    vi.mocked(real.start).mockClear();
    const { createLazyVisitorPointerApp } = await import('./lazy-visitor-pointer-app');
    const app = createLazyVisitorPointerApp();
    app.start();
    app.end();
    await new Promise((r) => setTimeout(r, 0));
    expect(real.start).not.toHaveBeenCalled();
  });

  it('forwards send() only once started', async () => {
    const { createLazyVisitorPointerApp } = await import('./lazy-visitor-pointer-app');
    const app = createLazyVisitorPointerApp();
    app.send({ x: 0.1, y: 0.2 });
    expect(real.send).not.toHaveBeenCalled();
    app.start();
    await vi.waitFor(() => expect(real.start).toHaveBeenCalled());
    app.send({ x: 0.3, y: 0.4 });
    expect(real.send).toHaveBeenCalledWith({ x: 0.3, y: 0.4 });
  });
});
```

- [ ] **Step 2: Run to verify it fails** — `pnpm vitest run src/lib/cursor/lazy-visitor-pointer-app.test.ts` → FAIL (module not found).

- [ ] **Step 3: Implement the lazy wrapper**

```ts
// src/lib/cursor/lazy-visitor-pointer-app.ts
'use client';

import type { VisitorPointerApp, VisitorPointerState } from './visitor-pointer-app';

type Listener = (state: VisitorPointerState) => void;

const EMPTY: VisitorPointerState = { visitors: new Map(), count: 0 };

// Same contract as createVisitorPointerApp, but the real app — and with it
// hono/client, zod (protocol), reconnecting-websocket and durabcast — is only
// imported on the first start(). Until then the state is empty and send() is a
// no-op, which is exactly what a visitor sees before the socket opens anyway.
// Keeps ~100 KB (decoded) out of the site layout's initial chunk graph.
export const createLazyVisitorPointerApp = (): VisitorPointerApp => {
  const listeners = new Set<Listener>();
  const box: { real: VisitorPointerApp | undefined; state: VisitorPointerState; channel: string | undefined; generation: number; unsubscribe: (() => void) | undefined } = {
    real: undefined,
    state: EMPTY,
    channel: undefined,
    generation: 0,
    unsubscribe: undefined,
  };

  const publish = (state: VisitorPointerState): void => {
    box.state = state;
    for (const listener of listeners) listener(state);
  };

  const boot = async (generation: number): Promise<void> => {
    const { createVisitorPointerApp } = await import('./visitor-pointer-app');
    // end() bumped the generation while the import was in flight — stay idle.
    if (generation !== box.generation) return;
    const real = box.real ?? createVisitorPointerApp();
    box.real = real;
    box.unsubscribe?.();
    box.unsubscribe = real.subscribe(publish);
    if (box.channel !== undefined) real.setChannel(box.channel);
    real.start();
    publish(real.getState());
  };

  return {
    start() {
      box.generation += 1;
      void boot(box.generation);
    },
    end() {
      box.generation += 1;
      box.real?.end();
    },
    setChannel(channel) {
      box.channel = channel;
      box.real?.setChannel(channel);
    },
    send(position) {
      box.real?.send(position);
    },
    getState: () => box.state,
    subscribe(listener) {
      listeners.add(listener);
      return () => {
        listeners.delete(listener);
      };
    },
  };
};
```

(Object-literal methods use method shorthand because they implement the `VisitorPointerApp` interface — matches how `visitor-pointer-app.ts` builds its object.)

- [ ] **Step 4: Run the test** → PASS (4 tests).

- [ ] **Step 5: Use it in CursorPresence**

`src/components/cursor-presence/index.tsx`:

```tsx
import { createLazyVisitorPointerApp } from '@lib/cursor/lazy-visitor-pointer-app';
// ...
  const app = useMemo(() => createLazyVisitorPointerApp(), []);
```

Remove the `createVisitorPointerApp` import. Everything else (START_DELAY timer, `end()` on cleanup) already fits: the StrictMode throwaway mount calls `end()` before the import resolves, and the generation check keeps it idle.

- [ ] **Step 6: Run cursor tests** — `pnpm vitest run src/components/cursor-presence src/lib/cursor` → PASS. If `cursor-presence.test.tsx` mocks `@lib/cursor/visitor-pointer-app`, keep that mock (the lazy wrapper imports the same module).

- [ ] **Step 7: Build-artifact verification**

`pnpm build && grep -l '"HMAC"' .next/static/chunks/app/\(site\)/layout-*.js | wc -l` → `0` (the hono/client HMAC string was the fingerprint of chunk 977), and `grep -c "reconnecting" .next/static/chunks/app/\(site\)/layout-*.js` → `0`.

- [ ] **Step 8: Lint, typecheck, full test, review** — `pnpm fmt && pnpm lint && pnpm typecheck && pnpm test`, `difit`, no commit.

---

### Task 5: Skip the boot floor for returning visitors

**Files:**

- Modify: `src/themes/typekit.ts` (script string + header comment)
- Create: `src/themes/typekit.test.tsx` (browser project: needs `document`, timers, `localStorage`)

**Interfaces:**

- Produces: `BOOT_SEEN_KEY = 'napochaan:boot-seen'`, `BOOT_SEEN_TTL_MS = 7 * 24 * 60 * 60 * 1000`, exported for tests and interpolated into the script string.

Behaviour: on a load where `localStorage[BOOT_SEEN_KEY]` holds a timestamp newer than 7 days, the minimum-display floor is 0 — `boot` drops as soon as Web Font Loader reports `wf-active`/`wf-inactive`. The overlay still covers first paint (no FOUT); fonts come from HTTP cache in tens of ms. Every successful boot (human path) writes the timestamp. Storage access is wrapped in try/catch so private mode / disabled storage falls back to the normal 1 s floor.

- [ ] **Step 1: Write the failing tests**

```tsx
// src/themes/typekit.test.tsx
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { BOOT_SEEN_KEY, BOOT_SEEN_TTL_MS, typekitLoaderHtml } from './typekit';

const html = document.documentElement;

// The kit script tag the loader inserts would hit use.typekit.net; stub Typekit and
// neutralise script insertion so the test stays offline. The boot gate only reacts
// to html class mutations, which we drive by hand.
const runLoader = () => {
  const original = document.createElement.bind(document);
  const spy = vi.spyOn(document, 'createElement').mockImplementation((tag: string) => {
    const el = original(tag);
    if (tag === 'script') Object.defineProperty(el, 'src', { set: () => {}, get: () => '' });
    return el;
  });
  // eslint-disable-next-line no-new-func -- test-only: evaluates the build-time constant
  // script string exactly as the browser does for the inline <script>. Nothing
  // user-controlled is ever interpolated into it.
  new Function(typekitLoaderHtml.__html)();
  spy.mockRestore();
};

describe('typekit boot gate', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    localStorage.clear();
    html.className = 'wf-loading boot';
  });

  afterEach(() => {
    vi.useRealTimers();
    html.className = '';
  });

  it('holds boot for the 1s floor on a first visit', async () => {
    runLoader();
    html.classList.add('wf-active');
    await vi.advanceTimersByTimeAsync(500);
    expect(html.classList.contains('boot')).toBe(true);
    await vi.advanceTimersByTimeAsync(600);
    expect(html.classList.contains('boot')).toBe(false);
    expect(localStorage.getItem(BOOT_SEEN_KEY)).not.toBeNull();
  });

  it('drops boot as soon as fonts resolve on a return visit', async () => {
    localStorage.setItem(BOOT_SEEN_KEY, `${Date.now() - 60_000}`);
    runLoader();
    html.classList.add('wf-active');
    await vi.advanceTimersByTimeAsync(20);
    expect(html.classList.contains('boot')).toBe(false);
  });

  it('treats a seen-mark older than the TTL as a first visit', async () => {
    localStorage.setItem(BOOT_SEEN_KEY, `${Date.now() - BOOT_SEEN_TTL_MS - 1}`);
    runLoader();
    html.classList.add('wf-active');
    await vi.advanceTimersByTimeAsync(500);
    expect(html.classList.contains('boot')).toBe(true);
  });

  it('falls back to the floor when storage throws', async () => {
    const getItem = vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new Error('denied');
    });
    runLoader();
    html.classList.add('wf-active');
    await vi.advanceTimersByTimeAsync(500);
    expect(html.classList.contains('boot')).toBe(true);
    await vi.advanceTimersByTimeAsync(600);
    expect(html.classList.contains('boot')).toBe(false);
    getItem.mockRestore();
  });
});
```

- [ ] **Step 2: Run to verify it fails**

Run: `pnpm vitest run src/themes/typekit.test.tsx`
Expected: FAIL — `BOOT_SEEN_KEY` is not exported; the return-visit test times out with `boot` still present.

- [ ] **Step 3: Implement in the script string**

In `src/themes/typekit.ts`, above `const script`:

```ts
// Returning visitors skip the aesthetic floor: once a boot has completed we stamp
// localStorage, and loads within the TTL use a 0 ms floor (boot drops the moment
// fonts resolve — they are in HTTP cache by then, so this is tens of ms). The
// overlay still covers first paint, so FOUT stays impossible. Storage failures
// (private mode, disabled) fall back to the first-visit behaviour.
export const BOOT_SEEN_KEY = 'napochaan:boot-seen';
export const BOOT_SEEN_TTL_MS = 7 * 24 * 60 * 60 * 1000;
```

And change the script (a template literal, so the two constants interpolate):

```js
  var config = { kitId: 'vmz7pfu', scriptTimeout: 3000, async: true },
      h = d.documentElement,
      SEEN_KEY = '${BOOT_SEEN_KEY}',
      SEEN_TTL = ${BOOT_SEEN_TTL_MS},
      seen = false,
      BOOT_MIN_MS = 1000,
      BOT = /bot|crawl|spider|lighthouse|headlesschrome|pagespeed|gtmetrix|slurp/i.test(navigator.userAgent),
      t0 = Date.now(),
      /* ...t, tk, f, s, a unchanged... */;
  try { seen = Date.now() - parseInt(localStorage.getItem(SEEN_KEY) || '0', 10) < SEEN_TTL; } catch (e) {}
  if (seen) BOOT_MIN_MS = 0;
  if (BOT) h.className = h.className.replace(/\\bboot\\b/g, "");
  requestAnimationFrame(function () { t0 = Date.now(); });
  var obs = new MutationObserver(function () {
    var c = h.className;
    if (c.indexOf("wf-active") > -1 || c.indexOf("wf-inactive") > -1) {
      obs.disconnect();
      var done = function () {
        var left = BOOT_MIN_MS - (Date.now() - t0);
        if (left > 0) { setTimeout(done, left); return; }
        h.className = h.className.replace(/\\bboot\\b/g, "");
        try { localStorage.setItem(SEEN_KEY, String(Date.now())); } catch (e) {}
      };
      setTimeout(done, Math.max(0, BOOT_MIN_MS - (Date.now() - t0)));
    }
  });
```

`String(Date.now())` and `var` are fine here — the string is vendor-shaped code exempt from project lint (see the file header; keep that exemption note and add a line about the seen-mark).

Update the header comment paragraph "To tune the floor…" to mention the return-visit 0 ms floor and the two exported constants.

- [ ] **Step 4: Run the tests** → PASS (4 tests). If the first test's `wf-active` add is observed before `requestAnimationFrame` re-anchors `t0`, advance timers by 16 ms before adding the class.

- [ ] **Step 5: Verify in the browser**

Run `pnpm build && pnpm start -p 3001` (see memory: `next start -p 3001` in the worktree), open `http://localhost:3001/` twice in the same tab; second load's boot overlay must disappear within ~100 ms of paint (DevTools: `html.boot` removed before `DOMContentLoaded + 200ms`).

- [ ] **Step 6: Lint, typecheck, full test, review** — `pnpm fmt && pnpm lint && pnpm typecheck && pnpm test`, `difit`, no commit.

---

### Task 6: Split the Typekit kit so Ryo Gothic loads only with PageHeader

**Blocked until the owner supplies:** `SITE_KIT_ID` (existing kit minus Ryo Gothic — may stay `vmz7pfu`) and `RYO_GOTHIC_KIT_ID` (new kit with ryo-gothic-plusn n5 + n7 only, dynamic subsetting on).

**Files:**

- Modify: `src/themes/typekit.ts` (constants + gate condition)
- Create: `src/components/page-header/typekit-kit-loader.tsx`, `src/components/page-header/typekit-kit-loader.test.tsx`
- Modify: `src/components/page-header/index.tsx` (render the loader)
- Modify: `src/themes/typekit.test.tsx` (gate waits for the extra kit)

**Interfaces:**

- Produces: `RYO_GOTHIC_KIT_ID` and `EXTRA_KIT_MARKER = 'data-typekit-extra'` from `@themes/typekit`; `<TypekitKitLoader kitId={string} family="ryo-gothic-plusn" />` client island.

Behaviour:

- The site kit is loaded by the inline `<head>` script as today.
- `PageHeader` renders `<TypekitKitLoader>`; on mount it sets `document.documentElement.setAttribute('data-typekit-extra', 'ryo-gothic-plusn')`, injects `https://use.typekit.net/<RYO_GOTHIC_KIT_ID>.js` once per document (module-scope flag), and calls `window.Typekit.load({ kitId, scriptTimeout: 3000, async: true })` on load.
- The boot gate removes `boot` only when the site kit is `wf-active|wf-inactive` **and** (no marker **or** `wf-ryo-gothic-plusn-n5-(active|inactive)` is present). The MutationObserver re-checks on every class change; the existing 3 s `scriptTimeout` also marks the extra kit inactive so the gate cannot hang.

- [ ] **Step 1: Write the failing loader island test**

```tsx
// src/components/page-header/typekit-kit-loader.test.tsx
import { render } from 'vitest-browser-react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { TypekitKitLoader } from './typekit-kit-loader';

describe('TypekitKitLoader', () => {
  afterEach(() => {
    document.documentElement.removeAttribute('data-typekit-extra');
    for (const s of document.querySelectorAll('script[data-typekit-kit]')) s.remove();
  });

  it('marks the document and injects the kit script once', async () => {
    const original = document.createElement.bind(document);
    vi.spyOn(document, 'createElement').mockImplementation((tag: string) => {
      const el = original(tag);
      if (tag === 'script') Object.defineProperty(el, 'src', { set: () => {}, get: () => 'stub' });
      return el;
    });
    await render(<TypekitKitLoader kitId="abc1234" family="ryo-gothic-plusn" />);
    await render(<TypekitKitLoader kitId="abc1234" family="ryo-gothic-plusn" />);
    expect(document.documentElement.getAttribute('data-typekit-extra')).toBe('ryo-gothic-plusn');
    expect(document.querySelectorAll('script[data-typekit-kit="abc1234"]').length).toBe(1);
    vi.restoreAllMocks();
  });
});
```

- [ ] **Step 2: Run to verify it fails** — module not found.

- [ ] **Step 3: Implement the island**

```tsx
// src/components/page-header/typekit-kit-loader.tsx
'use client';

import { useEffect } from 'react';

import { EXTRA_KIT_MARKER } from '@themes/typekit';

type Props = { kitId: string; family: string };

type TypekitGlobal = { load: (config: { kitId: string; scriptTimeout: number; async: boolean }) => void };

const injected = new Set<string>();

// Loads a second Adobe Fonts kit for pages that use a family the site kit omits
// (Ryo Gothic for PageHeader titles). Runs once per document per kit, on both hard
// and soft navigations — React does not execute inline <script> it inserts on the
// client, so this has to be an effect. The marker attribute tells the boot gate in
// @themes/typekit to wait for this family's Web Font Loader event too.
export const TypekitKitLoader = ({ kitId, family }: Props) => {
  useEffect(() => {
    document.documentElement.setAttribute(EXTRA_KIT_MARKER, family);
    if (injected.has(kitId)) return;
    injected.add(kitId);
    const script = document.createElement('script');
    script.src = `https://use.typekit.net/${kitId}.js`;
    script.async = true;
    script.dataset.typekitKit = kitId;
    script.onload = () => {
      const typekit = (window as unknown as { Typekit?: TypekitGlobal }).Typekit;
      try {
        typekit?.load({ kitId, scriptTimeout: 3000, async: true });
      } catch {
        // Web Font Loader marks the family inactive on its own timeout.
      }
    };
    document.head.append(script);
  }, [kitId, family]);

  return null;
};
```

- [ ] **Step 4: Run the island test** → PASS.

- [ ] **Step 5: Extend the gate test**

Append to `src/themes/typekit.test.tsx`:

```tsx
  it('waits for the extra kit family when the page marks one', async () => {
    html.setAttribute('data-typekit-extra', 'ryo-gothic-plusn');
    localStorage.setItem(BOOT_SEEN_KEY, `${Date.now() - 60_000}`);
    runLoader();
    html.classList.add('wf-active');
    await vi.advanceTimersByTimeAsync(50);
    expect(html.classList.contains('boot')).toBe(true);
    html.classList.add('wf-ryo-gothic-plusn-n5-active');
    await vi.advanceTimersByTimeAsync(50);
    expect(html.classList.contains('boot')).toBe(false);
    html.removeAttribute('data-typekit-extra');
  });
```

- [ ] **Step 6: Run to verify it fails, then implement the gate**

In `src/themes/typekit.ts`:

```ts
export const SITE_KIT_ID = '<owner-supplied>';
export const RYO_GOTHIC_KIT_ID = '<owner-supplied>';
export const EXTRA_KIT_MARKER = 'data-typekit-extra';
```

(Replace both placeholders with the IDs the owner provides before starting this task; the plan cannot know them.)

Script changes: `kitId: '${SITE_KIT_ID}'`, and the observer becomes:

```js
  var siteDone = function (c) { return c.indexOf("wf-active") > -1 || c.indexOf("wf-inactive") > -1; };
  var extraDone = function (c) {
    var fam = h.getAttribute('${EXTRA_KIT_MARKER}');
    if (!fam) return true;
    return c.indexOf("wf-" + fam + "-n5-active") > -1 || c.indexOf("wf-" + fam + "-n5-inactive") > -1;
  };
  var obs = new MutationObserver(function () {
    var c = h.className;
    if (siteDone(c) && extraDone(c)) {
      obs.disconnect();
      /* done() unchanged */
    }
  });
  obs.observe(h, { attributes: true, attributeFilter: ["class", "${EXTRA_KIT_MARKER}"] });
```

The extra kit's own `scriptTimeout` (3 s, set by the island) makes Web Font Loader add `wf-<family>-n5-inactive` on failure, so the gate cannot hang. Also add the family to the `bootAutoDismiss` note in `loading-overlay/styles.css.ts` (7 s no-JS fail-safe still applies).

- [ ] **Step 7: Render the island from PageHeader**

```tsx
import { RYO_GOTHIC_KIT_ID } from '@themes/typekit';
import { TypekitKitLoader } from './typekit-kit-loader';
// inside PageHeader's JSX, first child of <header>:
      <TypekitKitLoader kitId={RYO_GOTHIC_KIT_ID} family="ryo-gothic-plusn" />
```

- [ ] **Step 8: Run all gate/page-header tests** → PASS.

- [ ] **Step 9: Live verification**

Deploy to staging (owner runs `pnpm deploy:staging`). On `https://stg.napochaan.com/`: Network shows no `use.typekit.net/af/*chunks=3.320*` requests (Ryo Gothic absent), total Typekit transfer < 100 KB. On `/works/<slug>`: the two Ryo Gothic requests appear, `html.boot` is removed only after `wf-ryo-gothic-plusn-n5-active`. Record both in the report.

- [ ] **Step 10: Lint, typecheck, full test, review** — `pnpm fmt && pnpm lint && pnpm typecheck && pnpm test`, `difit`, no commit.

---

### Task 7: Workers Cache on staging with purge-on-write

**Files:**

- Modify: `wrangler.toml` (staging env)
- Create: `worker/middleware/cache-control.ts`, `worker/middleware/cache-control.test.ts`
- Modify: `worker/app.ts:20-32`
- Modify: `worker/app.test.ts` (new cases)
- Create: `src/collections/hooks/revalidate/purge-workers-cache.ts`, `src/collections/hooks/revalidate/purge-workers-cache.test.ts`
- Modify: `src/collections/hooks/revalidate/index.ts` (call purge from `dispatch`, `dispatchTagsAndPaths`, `revalidateTagsAndPaths`)
- Modify: `src/collections/hooks/revalidate/revalidate.test.ts` (purge called alongside revalidate)

**Interfaces:**

- Produces: `resolveCacheControl(pathname: string): string | undefined`, `cacheControlHeaders()` Hono middleware, `purgeWorkersCache(): void`.

- [ ] **Step 1: Write the failing cache-control tests**

```ts
// worker/middleware/cache-control.test.ts
import { Hono } from 'hono';
import { describe, expect, it } from 'vitest';

import { cacheControlHeaders, MEDIA_POLICY, resolveCacheControl, TEXT_FEED_POLICY } from './cache-control';

describe('resolveCacheControl', () => {
  it.each([
    ['/api/media/file/a.jpg', MEDIA_POLICY],
    ['/blog/rss.xml', TEXT_FEED_POLICY],
    ['/gallery/rss.xml', TEXT_FEED_POLICY],
    ['/llms.txt', TEXT_FEED_POLICY],
    ['/llms-full.txt', TEXT_FEED_POLICY],
    ['/blog/my-post.md', TEXT_FEED_POLICY],
    ['/about.md', TEXT_FEED_POLICY],
    ['/.well-known/security.txt', TEXT_FEED_POLICY],
  ])('%s → %s', (path, expected) => {
    expect(resolveCacheControl(path)).toBe(expected);
  });

  it.each(['/', '/works', '/contact', '/admin', '/api/mcp', '/sitemap.xml', '/_next/image'])('leaves %s to the upstream policy', (path) => {
    expect(resolveCacheControl(path)).toBeUndefined();
  });
});

describe('cacheControlHeaders', () => {
  const build = (upstream: () => Response) => new Hono().use('*', cacheControlHeaders()).get('*', () => upstream());

  it('adds the policy when the upstream response has none', async () => {
    const app = build(() => new Response('xml'));
    const res = await app.request('/blog/rss.xml');
    expect(res.headers.get('Cache-Control')).toBe(TEXT_FEED_POLICY);
  });

  it('never overrides an existing Cache-Control', async () => {
    const app = build(() => new Response('x', { headers: { 'Cache-Control': 'private, no-store' } }));
    const res = await app.request('/blog/rss.xml');
    expect(res.headers.get('Cache-Control')).toBe('private, no-store');
  });

  it('skips responses that set cookies', async () => {
    const app = build(() => new Response('x', { headers: { 'Set-Cookie': 'a=b' } }));
    const res = await app.request('/blog/rss.xml');
    expect(res.headers.get('Cache-Control')).toBeNull();
  });

  it('skips non-200 responses', async () => {
    const app = build(() => new Response('nope', { status: 404 }));
    const res = await app.request('/api/media/file/missing.jpg');
    expect(res.headers.get('Cache-Control')).toBeNull();
  });
});
```

- [ ] **Step 2: Run to verify it fails** — `pnpm vitest run worker/middleware/cache-control.test.ts` → FAIL (module not found).

- [ ] **Step 3: Implement the middleware**

```ts
// worker/middleware/cache-control.ts
import { createMiddleware } from 'hono/factory';

// Workers Cache (wrangler `[cache] enabled`) serves any 200 with a public
// Cache-Control straight from the edge without invoking this Worker — and, per
// RFC 9111 heuristics, ALSO caches header-less 200s for 2 hours. These policies
// make that explicit for the routes Next.js leaves header-less. Every CMS write
// purges everything (see src/collections/hooks/revalidate/purge-workers-cache),
// so long max-age values are safe. `s-maxage`/`must-revalidate` would disable
// stale-while-revalidate, so neither is used here.
export const MEDIA_POLICY = 'public, max-age=86400, stale-while-revalidate=604800';
export const TEXT_FEED_POLICY = 'public, max-age=3600, stale-while-revalidate=86400';

type Policy = { test: RegExp; value: string };

const POLICIES: readonly Policy[] = [
  { test: /^\/api\/media\/file\//, value: MEDIA_POLICY },
  { test: /\/rss\.xml$/, value: TEXT_FEED_POLICY },
  { test: /^\/llms(-full)?\.txt$/, value: TEXT_FEED_POLICY },
  { test: /\.md$/, value: TEXT_FEED_POLICY },
  { test: /^\/\.well-known\/security\.txt$/, value: TEXT_FEED_POLICY },
];

export const resolveCacheControl = (pathname: string): string | undefined => POLICIES.find((policy) => policy.test.test(pathname))?.value;

export const cacheControlHeaders = () =>
  createMiddleware(async (c, next) => {
    await next();

    const value = resolveCacheControl(new URL(c.req.url).pathname);
    if (value === undefined) return;
    if (c.res.status !== 200) return;
    // An upstream policy (Next's `private, no-store` for draft/dynamic) always wins,
    // and anything setting cookies must not be shared.
    if (c.res.headers.has('Cache-Control') || c.res.headers.has('Set-Cookie')) return;

    c.header('Cache-Control', value);
  });
```

- [ ] **Step 4: Run the middleware tests** → PASS.

- [ ] **Step 5: Wire into the app and relax the image policy**

`worker/app.ts`:

```ts
import { cacheControlHeaders } from './middleware/cache-control';
// ...
  app
    .use('*', weakenETag())
    .use('*', cacheControlHeaders())
    .get(
      '/_next/image',
      cache({
        cacheName: 'opennextjs-cloudflare-images',
        // Workers Cache serves hits without invoking the Worker; drop must-revalidate
        // so stale-while-revalidate applies. Media changes purge everything.
        cacheControl: 'public, max-age=86400, stale-while-revalidate=604800',
        vary: ['Accept', 'Accept-Encoding'],
      }),
      ...imageHandlers,
    )
```

Add to `worker/app.test.ts`:

```ts
  it('stamps a public policy on header-less feed responses from the mounted handler', async () => {
    const handlerFetch = vi.fn(async () => new Response('<rss/>'));
    const app = createWorkerApp(handlerFetch);
    const response = await app.request('/blog/rss.xml');
    expect(response.headers.get('Cache-Control')).toBe('public, max-age=3600, stale-while-revalidate=86400');
  });

  it('keeps Next.js private policies untouched', async () => {
    const handlerFetch = vi.fn(async () => new Response('form', { headers: { 'Cache-Control': 'private, no-cache, no-store, max-age=0, must-revalidate' } }));
    const app = createWorkerApp(handlerFetch);
    const response = await app.request('/contact');
    expect(response.headers.get('Cache-Control')).toBe('private, no-cache, no-store, max-age=0, must-revalidate');
  });
```

Run: `pnpm vitest run worker` → PASS.

- [ ] **Step 6: Write the failing purge helper tests**

```ts
// src/collections/hooks/revalidate/purge-workers-cache.test.ts
import { beforeEach, describe, expect, it, vi } from 'vitest';

const getCloudflareContext = vi.fn();
vi.mock('@opennextjs/cloudflare', () => ({ getCloudflareContext: () => getCloudflareContext() }));

describe('purgeWorkersCache', () => {
  beforeEach(() => {
    getCloudflareContext.mockReset();
  });

  it('purges everything through the execution context and keeps the request alive with waitUntil', async () => {
    const purge = vi.fn(async () => ({ success: true }));
    const waitUntil = vi.fn();
    getCloudflareContext.mockReturnValue({ ctx: { cache: { purge }, waitUntil } });
    const { purgeWorkersCache } = await import('./purge-workers-cache');

    purgeWorkersCache();

    expect(purge).toHaveBeenCalledWith({ purgeEverything: true });
    expect(waitUntil).toHaveBeenCalledOnce();
  });

  it('is a no-op outside a worker (CLI seed/migrate)', async () => {
    getCloudflareContext.mockImplementation(() => {
      throw new Error('no context');
    });
    const { purgeWorkersCache } = await import('./purge-workers-cache');
    expect(() => purgeWorkersCache()).not.toThrow();
  });

  it('is a no-op when the runtime has no cache binding (cache disabled)', async () => {
    const waitUntil = vi.fn();
    getCloudflareContext.mockReturnValue({ ctx: { waitUntil } });
    const { purgeWorkersCache } = await import('./purge-workers-cache');
    purgeWorkersCache();
    expect(waitUntil).not.toHaveBeenCalled();
  });
});
```

- [ ] **Step 7: Run to verify it fails** — module not found.

- [ ] **Step 8: Implement the purge helper**

```ts
// src/collections/hooks/revalidate/purge-workers-cache.ts
import { getCloudflareContext } from '@opennextjs/cloudflare';

type PurgeOptions = { purgeEverything: true };
type PurgeResult = { success: boolean; errors?: ReadonlyArray<{ code: number; message: string }> };
type WorkersCache = { purge: (options: PurgeOptions) => Promise<PurgeResult> };

// `ctx.cache` is newer than the wrangler-generated ExecutionContext type this repo
// pins, so narrow structurally instead of casting.
const readCache = (ctx: unknown): WorkersCache | undefined => {
  if (typeof ctx !== 'object' || ctx === null || !('cache' in ctx)) return undefined;
  const candidate = (ctx as { cache?: { purge?: unknown } }).cache;
  if (typeof candidate?.purge !== 'function') return undefined;
  return candidate as WorkersCache;
};

// Every CMS write invalidates the whole Workers Cache. Writes are rare on this
// site and a full purge is one API call, which beats maintaining a path→tag map
// (decision recorded in docs/superpowers/specs/2026-09-22-performance-tuning-design.md).
// Runs only inside the deployed Worker; the Payload CLI (seed/migrate) has no
// Cloudflare context and skips silently, matching the revalidateTag pattern.
export const purgeWorkersCache = (): void => {
  try {
    const { ctx } = getCloudflareContext();
    const cache = readCache(ctx);
    if (cache === undefined) return;
    ctx.waitUntil(cache.purge({ purgeEverything: true }));
  } catch {
    // Outside a worker request context. Nothing to purge.
  }
};
```

- [ ] **Step 9: Run the helper tests** → PASS.

- [ ] **Step 10: Call it from every revalidate path**

`src/collections/hooks/revalidate/index.ts`:

```ts
import { purgeWorkersCache } from './purge-workers-cache';

const dispatch = (req: PayloadRequest, tags: readonly string[]): void => {
  const context = req.context as { disableRevalidate?: boolean };
  if (context.disableRevalidate === true) return;
  for (const tag of tags) {
    try {
      revalidateTag(tag);
    } catch {
      // (existing comment)
    }
  }
  purgeWorkersCache();
};

const dispatchTagsAndPaths = (req, tags, paths): void => {
  /* existing guard + try/catch unchanged */
  purgeWorkersCache();
};

export const revalidateTagsAndPaths = (tags, paths): void => {
  /* existing try/catch unchanged */
  purgeWorkersCache();
};
```

Add to `revalidate.test.ts` (it already mocks `next/cache`; add `vi.mock('./purge-workers-cache', () => ({ purgeWorkersCache: vi.fn() }))`):

```ts
  it('purges the Workers Cache whenever tags are dispatched', () => {
    const hooks = createTagRevalidateHooks(['news']);
    hooks.afterChange({ doc: {}, req: { context: {} } } as never);
    expect(purgeWorkersCache).toHaveBeenCalledOnce();
  });

  it('respects disableRevalidate for the purge too', () => {
    const hooks = createTagRevalidateHooks(['news']);
    hooks.afterChange({ doc: {}, req: { context: { disableRevalidate: true } } } as never);
    expect(purgeWorkersCache).not.toHaveBeenCalled();
  });
```

(Match the argument shape the existing tests in that file already use for `afterChange`.)

Run: `pnpm vitest run src/collections/hooks/revalidate` → PASS.

- [ ] **Step 11: Enable the cache on staging**

`wrangler.toml`, right after the `[env.staging.vars]` block:

```toml
# Workers Cache: HITs are served from the edge without invoking the Worker. Every
# CMS write purges everything (src/collections/hooks/revalidate/purge-workers-cache).
# Staging first; production gets its own block once staging verification passes.
[env.staging.cache]
enabled = true
```

Validate: `CLOUDFLARE_ACCOUNT_ID=cda8b0a2b410e1ff3a5bcc72c7e46f72 pnpm exec wrangler deploy --dry-run --env staging --outdir /tmp/wrangler-dry` → exits 0 with no schema warning about `cache`.

- [ ] **Step 12: Lint, typecheck, full test**

Run: `pnpm fmt && pnpm lint && pnpm typecheck && pnpm test` → green.

- [ ] **Step 13: Staging verification (owner deploys; see `staging-deploy-seed` skill and the node24 deploy note in memory)**

After `pnpm deploy:staging`, run and paste into the report:

```bash
for p in / /works /blog/rss.xml /llms.txt /contact "/_next/image?url=%2Fapi%2Fmedia%2Ffile%2Fzero-to-dj-vol01-flyer.jpg&w=640&q=75"; do
  for i in 1 2; do printf "%-70s " "$p#$i"; curl -s -o /dev/null -D - "https://stg.napochaan.com$p" | grep -i "^cf-cache-status\|^cache-control" | tr -d '\r' | tr '\n' ' '; echo; done
done
```

Expected: `/`, `/works`, rss, llms, image → 2nd request `cf-cache-status: HIT`; `/contact` → `BYPASS` both times. Then publish any draft in the staging admin and re-curl `/works` → `MISS` (purge worked), next → `HIT`. Open `/` in a browser: cursor presence still connects (`/api/cursors` upgrade bypasses cache). Record TTFB from a DevTools trace before/after.

- [ ] **Step 14: Review request** — `difit`; do not commit. Production enablement (`[env.production.cache] enabled = true`) is a separate one-line PR after the owner accepts the staging numbers.

---

### Task 8: Close the loop in the report

**Files:**

- Modify: `reports/2026-09-22-production-perf-audit.md`

- [ ] **Step 1: Re-measure production (after each deploy the owner makes)**

Same procedure as the audit: Chrome DevTools MCP `performance_start_trace` on `https://napochaan.com/` (desktop, then mobile Slow 4G / CPU 4×), plus the transfer-size script from the audit. Append an "## After" table with the same rows (TTFB / LCP / CLS / total transfer / per-type bytes) next to the "Before" numbers.

- [ ] **Step 2: Note open items**

List what remains for the owner: production `[cache]` block, the `accept-ch: Sec-CH-Prefers-Color-Scheme` source (Cloudflare dashboard), and kit IDs if Task 6 is still pending.
