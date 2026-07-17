import { describe, expect, it } from 'vitest';

import { populatedMediaURLOf, populatedVideoOf } from './index';

describe('populatedVideoOf', () => {
  it('narrows a fully populated media doc', () => {
    const doc = { id: 1, url: '/api/media/file/clip.mp4', mimeType: 'video/mp4', width: 1920, height: 1080, duration: 12.5, filesize: 2048 };

    expect(populatedVideoOf(doc)).toEqual({ url: '/api/media/file/clip.mp4', mimeType: 'video/mp4', width: 1920, height: 1080, duration: 12.5, filesize: 2048 });
  });

  it('omits duration/filesize when they are not numbers', () => {
    const doc = { url: '/clip.mp4', mimeType: 'video/mp4', width: 1920, height: 1080 };

    expect(populatedVideoOf(doc)).toEqual({ url: '/clip.mp4', mimeType: 'video/mp4', width: 1920, height: 1080, duration: undefined, filesize: undefined });
  });

  it('returns undefined for an unpopulated numeric id', () => {
    expect(populatedVideoOf(7)).toBeUndefined();
  });

  it('returns undefined when url is missing', () => {
    expect(populatedVideoOf({ mimeType: 'video/mp4', width: 1920, height: 1080 })).toBeUndefined();
  });

  it('returns undefined when width/height are missing', () => {
    expect(populatedVideoOf({ url: '/clip.mp4', mimeType: 'video/mp4' })).toBeUndefined();
  });

  it('returns undefined for null/undefined', () => {
    expect(populatedVideoOf(null)).toBeUndefined();
    expect(populatedVideoOf(undefined)).toBeUndefined();
  });
});

describe('populatedMediaURLOf', () => {
  it('reads the url from a populated media doc', () => {
    expect(populatedMediaURLOf({ id: 2, url: '/api/media/file/poster.jpg' })).toBe('/api/media/file/poster.jpg');
  });

  it('returns undefined for an unpopulated numeric id', () => {
    expect(populatedMediaURLOf(2)).toBeUndefined();
  });

  it('returns undefined when url is not a string', () => {
    expect(populatedMediaURLOf({ id: 2 })).toBeUndefined();
  });

  it('returns undefined for null/undefined', () => {
    expect(populatedMediaURLOf(null)).toBeUndefined();
    expect(populatedMediaURLOf(undefined)).toBeUndefined();
  });
});
