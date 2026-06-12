import { describe, expect, it } from 'vitest';

import { absoluteMediaUrl } from './index';

describe('absoluteMediaUrl', () => {
  it('returns undefined for an absent or empty source', () => {
    expect(absoluteMediaUrl(undefined, 'https://napochaan.com')).toBeUndefined();
    expect(absoluteMediaUrl('', 'https://napochaan.com')).toBeUndefined();
  });

  it('passes through already-absolute URLs unchanged', () => {
    expect(absoluteMediaUrl('https://r2.example.com/x.jpg', 'https://napochaan.com')).toBe('https://r2.example.com/x.jpg');
    expect(absoluteMediaUrl('http://r2.example.com/x.jpg', 'https://napochaan.com')).toBe('http://r2.example.com/x.jpg');
  });

  it('prepends the origin to a relative media path', () => {
    expect(absoluteMediaUrl('/api/media/file/x.jpg', 'https://napochaan.com')).toBe('https://napochaan.com/api/media/file/x.jpg');
    expect(absoluteMediaUrl('/api/media/file/x.jpg', 'http://localhost:3001')).toBe('http://localhost:3001/api/media/file/x.jpg');
  });
});
