import { afterEach, describe, expect, it } from 'vitest';

import { resolveSurface } from './resolve-surface';

afterEach(() => {
  for (const el of document.querySelectorAll('[data-cursor-surface]')) el.remove();
});

describe('resolveSurface', () => {
  it('prefers the CursorSurface ref when one is attached (same React root)', () => {
    const own = document.createElement('div');

    expect(resolveSurface(own)).toBe(own);
  });

  it('falls back to the Astro-rendered [data-cursor-surface] stage (separate island)', () => {
    const stage = document.createElement('div');
    stage.setAttribute('data-cursor-surface', '');
    document.body.appendChild(stage);

    expect(resolveSurface(null)).toBe(stage);
  });

  it('returns null when there is no surface at all', () => {
    expect(resolveSurface(null)).toBeNull();
  });
});
