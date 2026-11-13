import { describe, expect, it } from 'vitest';

import { loadGsap } from './index';

// gsap's type definitions don't expose these registries: only ScrambleTextPlugin's d.ts
// augments the `gsap.plugins` namespace, and ScrollTrigger would land as a core global
// (via `_addGlobal`) rather than in `gsap.plugins`. These boundary casts let the test
// assert the real runtime registration.
type PluginRegistry = Record<string, unknown>;
type CoreGlobals = { globals: () => Record<string, unknown> };

describe('loadGsap', () => {
  it('loads the scramble kit with ScrambleTextPlugin registered on the core', async () => {
    const { gsap, ScrambleTextPlugin } = await loadGsap('scramble');

    expect(ScrambleTextPlugin).toBeDefined();
    expect(gsap.plugins.scrambleText).toBeDefined();
  });

  // The TypographyBand used to pull a 'scroll' kit; it now runs on plain rAF, and no
  // kit loads the scroll plugins any more.
  it('never registers the scroll plugins', async () => {
    const { gsap } = await loadGsap('scramble');
    const plugins = gsap.plugins as unknown as PluginRegistry;
    const core = gsap.core as unknown as CoreGlobals;

    expect(plugins.scrollTo).toBeUndefined();
    expect(core.globals().ScrollTrigger).toBeUndefined();
  });

  it('returns the same bundle on repeated calls', async () => {
    expect(await loadGsap('scramble')).toBe(await loadGsap('scramble'));
  });
});
