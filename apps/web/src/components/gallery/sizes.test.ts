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
