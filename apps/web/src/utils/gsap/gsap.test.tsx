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

// Order matters: the browser context is per test file and the kits share one core, so
// the scramble-only assertion must run before anything requests the scroll kit.
describe('loadGsap', () => {
  it('loads the scramble kit without fetching the scroll plugins', async () => {
    const { gsap, ScrambleTextPlugin } = await loadGsap('scramble');
    const plugins = gsap.plugins as unknown as PluginRegistry;
    const core = gsap.core as unknown as CoreGlobals;

    expect(ScrambleTextPlugin).toBeDefined();
    expect(gsap.plugins.scrambleText).toBeDefined();
    expect(plugins.scrollTo).toBeUndefined();
    expect(core.globals().ScrollTrigger).toBeUndefined();
  });

  it('loads the scroll kit with scroll-trigger and scroll-to registered on the same core', async () => {
    const scramble = await loadGsap('scramble');
    const { gsap, ScrollTrigger, ScrollToPlugin } = await loadGsap('scroll');
    const plugins = gsap.plugins as unknown as PluginRegistry;
    const core = gsap.core as unknown as CoreGlobals;

    expect(gsap).toBe(scramble.gsap);
    expect(ScrollToPlugin).toBeDefined();
    expect(plugins.scrollTo).toBeDefined();
    expect(core.globals().ScrollTrigger).toBe(ScrollTrigger);
  });

  it('returns the same bundle on repeated calls', async () => {
    expect(await loadGsap('scramble')).toBe(await loadGsap('scramble'));
    expect(await loadGsap('scroll')).toBe(await loadGsap('scroll'));
  });
});
