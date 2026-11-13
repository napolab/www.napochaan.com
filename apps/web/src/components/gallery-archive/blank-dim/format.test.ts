import { describe, expect, it } from 'vitest';

import { blankDimLabel, roundedSize } from './format';

describe('blankDimLabel', () => {
  it('shows only the reference number before the cell is measured', () => {
    expect(blankDimLabel('03', null)).toBe('NO.03');
  });

  it('shows only the reference number while the cell has no width yet', () => {
    expect(blankDimLabel('03', { width: 0, height: 120 })).toBe('NO.03');
  });

  it('prints the measured size above the reference number', () => {
    expect(blankDimLabel('03', { width: 320, height: 180 })).toBe('320×180\nNO.03');
  });
});

describe('roundedSize', () => {
  it('rounds the content rect to whole pixels', () => {
    expect(roundedSize({ width: 319.6, height: 180.2 })).toEqual({ width: 320, height: 180 });
  });
});
