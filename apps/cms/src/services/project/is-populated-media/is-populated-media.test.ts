import { describe, expect, it } from 'vitest';

import { isPopulatedMedia } from '.';

describe('isPopulatedMedia', () => {
  it('returns true for a populated media object carrying a url key', () => {
    const media = { id: 1, alt: 'x', url: '/media/x.jpg', updatedAt: '', createdAt: '' };
    expect(isPopulatedMedia(media)).toBe(true);
  });

  it('returns false for an unpopulated numeric id', () => {
    expect(isPopulatedMedia(5)).toBe(false);
  });

  it('returns false for null', () => {
    expect(isPopulatedMedia(null)).toBe(false);
  });

  it('returns false for undefined', () => {
    expect(isPopulatedMedia(undefined)).toBe(false);
  });

  it('returns false for an object without a url key', () => {
    expect(isPopulatedMedia({ id: 1, alt: 'x' })).toBe(false);
  });
});
