import { describe, expect, it } from 'vitest';

import { fromNormalized, toNormalized } from './coordinate';

const rect = { left: 100, top: 50, width: 800, height: 1000 };

describe('coordinate', () => {
  it('normalizes a page point against the surface box', () => {
    expect(toNormalized(rect, 500, 550)).toEqual({ nx: 0.5, ny: 0.5 });
  });

  it('maps a normalized point back into the surface box', () => {
    expect(fromNormalized(rect, { nx: 0.5, ny: 0.5 })).toEqual({ x: 500, y: 550 });
  });

  it('round-trips a page point through normalize and back', () => {
    const norm = toNormalized(rect, 340, 720);
    const back = fromNormalized(rect, norm);
    expect(back.x).toBeCloseTo(340);
    expect(back.y).toBeCloseTo(720);
  });
});
