import { describe, expect, it } from 'vitest';

import { cmsMediaRequest, mediaFilenameOf } from './index';

describe('mediaFilenameOf', () => {
  it('returns the filename of a /api/media/file/ pathname', () => {
    expect(mediaFilenameOf('/api/media/file/a.png')).toBe('a.png');
  });

  it('percent-decodes the pathname segment', () => {
    expect(mediaFilenameOf('/api/media/file/a%20b%E5%86%99.png')).toBe('a b写.png');
  });

  it.each(['/', '/api/media/file/', '/api/media/a.png', '/images/a.png'])('returns undefined for non-media pathname %s', (pathname) => {
    expect(mediaFilenameOf(pathname)).toBeUndefined();
  });

  it('returns undefined for a malformed percent-encoding', () => {
    expect(mediaFilenameOf('/api/media/file/%E0%A4%A')).toBeUndefined();
  });
});

describe('cmsMediaRequest', () => {
  it('targets the cms /media/:filename route', () => {
    expect(cmsMediaRequest('a.png').url).toBe('https://cms.internal/media/a.png');
  });

  it('encodes the filename exactly once', () => {
    expect(cmsMediaRequest('a b写.png').url).toBe(`https://cms.internal/media/${encodeURIComponent('a b写.png')}`);
  });

  it('keeps a slash inside the filename within the single path segment', () => {
    expect(new URL(cmsMediaRequest('../x.png').url).pathname).toBe('/media/..%2Fx.png');
  });
});
