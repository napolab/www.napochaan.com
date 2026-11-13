import { describe, expect, it } from 'vitest';

import { spanForAspect } from './layout';

describe('spanForAspect', () => {
  it('spans 2 columns for wide images (ratio >= 1.6)', () => {
    expect(spanForAspect(1.6)).toBe(2);
    expect(spanForAspect(16 / 9)).toBe(2);
  });
  it('spans 1 column for portrait and near-square images', () => {
    expect(spanForAspect(1)).toBe(1);
    expect(spanForAspect(400 / 600)).toBe(1);
    expect(spanForAspect(1.59)).toBe(1);
  });
});
