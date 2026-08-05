---
name: debugging-cumulative-layout-shift
description: Use when CLS is at or over 0.1, when DevTools CLSCulprits reports shifts with "no potential root causes identified" or blames a non-composited animation, or when many tiny layout shifts accumulate over seconds.
---

# Debugging Cumulative Layout Shift

## Overview

DevTools' CLS attribution is a pattern-matching heuristic — it only recognizes font swaps, unsized media, and CSS animations. JS-driven text mutation (typewriters, GSAP ScrambleText) comes back "no root causes identified", and the animation it DOES blame may be a bystander. **Get ground truth from `layout-shift` entry sources, never from the insight.**

## What counts toward CLS (the exact paint rules)

| State of the shifted content | Counts? |
|---|---|
| Inside a `position: fixed` overlay | **YES** — fixed exempts nothing; children that move are counted |
| At `opacity: 0` | **YES** — opacity-0 content is still painted; if its geometry moves, it counts |
| Under an opaque covering element | **YES** — being visually covered is not an exemption |
| At `visibility: hidden` | **NO** — not painted, the only practical exemption |
| Moved via `transform` | NO — transforms don't shift layout |

The killer pattern this repo hit: an overlay faded to `opacity: 0` but stayed mounted while a typewriter kept cycling inside it — **invisible keystrokes accrued CLS forever**. Fix shape: transition the overlay to `visibility: hidden` at fade end (`transition: opacity, visibility` — visible→hidden flips at transition END, so the fade looks identical) AND stop the animation loop (here: gate on `useBootReady()` from `@components/boot-status` — reuse that store, don't write a new `<html>` class observer).

## Ground-truth measurement

```js
// Run on the live page (chrome-devtools evaluate_script; for Access-gated staging
// use claude-in-chrome javascript_tool with the user's session).
const entries = [];
const po = new PerformanceObserver((l) => entries.push(...l.getEntries()));
po.observe({ type: 'layout-shift', buffered: true });
await new Promise((r) => setTimeout(r, 8000));
po.disconnect();
entries.filter((e) => !e.hadRecentInput).map((e) => ({
  t: Math.round(e.startTime),
  score: +e.value.toFixed(4),
  // Text nodes have no tagName — climb to parentElement or you'll log "unknown".
  nodes: (e.sources ?? []).map((s) => (s.node?.nodeType === 3 ? s.node.parentElement : s.node)),
}));
```

Read the timing fingerprint: dozens of evenly-spaced tiny shifts ≈ per-tick JS text mutation; one or two large discrete shifts ≈ font swap or content insertion.

## Scramble/typewriter fix pattern

Glyphs have varying advance widths, so every scramble refresh nudges following inline content (this repo: the hero's trailing red dot, ~0.02 per tick). Pin the animated span's box for the tween's lifetime:

```ts
gsap.set(el, { display: 'inline-block', width: el.offsetWidth }); // settled text is already rendered
gsap.to(el, { ..., overwrite: true, onComplete: () => gsap.set(el, { clearProps: 'display,width' }) });
```

`overwrite: true` stops a hover re-entry's stale onComplete from unlocking mid-scramble. Precedent: `src/components/echo-text` (PR #38, CLS 0.122 → 0.012).

## Common Mistakes

- Trusting CLSCulprits' named culprit — verify with sources before touching anything.
- Believing `opacity: 0` exempts content from CLS — it does not; only `visibility: hidden` does.
- Fixing the animation but leaving it running behind a dismissed overlay — cap BOTH paint (visibility) and the loop itself.
- Verifying on `next dev` — measure a production build (`pnpm build` + `next start -p <port>`).
