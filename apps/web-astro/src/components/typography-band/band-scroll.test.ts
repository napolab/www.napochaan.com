import { describe, expect, it } from 'vitest';
import { wrap } from './band-scroll';

describe('band wrap', () => {
  it('keeps value within (-range, 0]', () => {
    expect(wrap(0, 100)).toBe(0);
    expect(wrap(150, 100)).toBe(-50);
    expect(wrap(-30, 100)).toBe(-30);
    expect(wrap(-130, 100)).toBe(-30);
  });
  it('returns 0 when range is 0', () => {
    expect(wrap(50, 0)).toBe(0);
  });
});
