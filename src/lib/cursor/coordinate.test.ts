import { describe, expect, it } from 'vitest';

import { fromNormalized, toNormalized } from './coordinate';

const wide = { left: 100, top: 0, width: 800, height: 2000 };
const narrow = { left: 20, top: 0, width: 320, height: 4000 };

describe('coordinate', () => {
  it('normalizes a point relative to the surface bbox', () => {
    expect(toNormalized(wide, 500, 1000)).toEqual({ nx: 0.5, ny: 0.5 });
  });

  it('round-trips through a different rect preserving relative position', () => {
    const n = toNormalized(wide, 500, 1000);
    expect(fromNormalized(narrow, n)).toEqual({ x: 20 + 0.5 * 320, y: 0.5 * 4000 });
  });

  it('allows out-of-column overshoot (no clamping)', () => {
    expect(toNormalized(wide, 100 - 80, 0).nx).toBeCloseTo(-0.1);
  });
});
