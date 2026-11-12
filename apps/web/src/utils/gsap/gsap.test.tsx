import { describe, expect, it } from 'vitest';

import { loadGsap } from './index';

// gsap's own type definitions are incomplete for this: only ScrambleTextPlugin's
// d.ts augments the `gsap.plugins` namespace (so `gsap.plugins.scrambleText` is
// typed), while ScrollToPlugin registers into the same runtime registry without a
// matching type augmentation, and ScrollTrigger never lands in `gsap.plugins` at
// all — it is not a tween-property plugin, so registerPlugin instead installs it
// as a core global via `_addGlobal` and calls its static `.register(gsap)`. These
// boundary casts bridge that gap to assert the real runtime registration.
type PluginRegistry = Record<string, unknown>;
type CoreGlobals = { globals: () => Record<string, unknown> };

describe('loadGsap', () => {
  it('resolves gsap with the scramble, scroll-trigger and scroll-to plugins registered', async () => {
    const { gsap, ScrollTrigger } = await loadGsap();
    const plugins = gsap.plugins as unknown as PluginRegistry;
    const core = gsap.core as unknown as CoreGlobals;

    expect(gsap.plugins.scrambleText).toBeDefined();
    expect(plugins.scrollTo).toBeDefined();
    expect(core.globals().ScrollTrigger).toBe(ScrollTrigger);
  });

  it('returns the same bundle on repeated calls', async () => {
    const a = await loadGsap();
    const b = await loadGsap();
    expect(a).toBe(b);
  });
});
