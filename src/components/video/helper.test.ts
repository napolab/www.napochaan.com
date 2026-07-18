import { describe, expect, it } from 'vitest';

import { formatPosterURL, formatVideoTransformURL, isTransformEligible, MAX_VIDEO_DURATION_SECONDS, MAX_VIDEO_FILESIZE_BYTES } from './helper';

const SRC = '/api/media/file/clip.mp4';
const BASE_URL = 'https://napochaan.com';

describe('isTransformEligible', () => {
  it('is eligible when duration and filesize are within limits', () => {
    expect(isTransformEligible({ duration: 30, filesize: 1024 })).toBe(true);
  });

  it('is eligible at the exact duration boundary (60s)', () => {
    expect(isTransformEligible({ duration: MAX_VIDEO_DURATION_SECONDS, filesize: 1024 })).toBe(true);
  });

  it('is not eligible one second past the duration boundary', () => {
    expect(isTransformEligible({ duration: MAX_VIDEO_DURATION_SECONDS + 1, filesize: 1024 })).toBe(false);
  });

  it('is eligible at the exact filesize boundary (100MB)', () => {
    expect(isTransformEligible({ duration: 30, filesize: MAX_VIDEO_FILESIZE_BYTES })).toBe(true);
  });

  it('is not eligible one byte past the filesize boundary', () => {
    expect(isTransformEligible({ duration: 30, filesize: MAX_VIDEO_FILESIZE_BYTES + 1 })).toBe(false);
  });

  it('is not eligible when duration is undefined', () => {
    expect(isTransformEligible({ duration: undefined, filesize: 1024 })).toBe(false);
  });

  it('is not eligible when filesize is undefined', () => {
    expect(isTransformEligible({ duration: 30, filesize: undefined })).toBe(false);
  });

  it('is not eligible when both duration and filesize are undefined', () => {
    expect(isTransformEligible({})).toBe(false);
  });
});

describe('formatVideoTransformURL', () => {
  it('returns the source unchanged when disabled', () => {
    const result = formatVideoTransformURL({
      src: SRC,
      baseURL: BASE_URL,
      enabled: false,
      meta: { duration: 30, filesize: 1024 },
    });
    expect(result).toBe(SRC);
  });

  it('returns the source unchanged when enabled but not eligible', () => {
    const result = formatVideoTransformURL({
      src: SRC,
      baseURL: BASE_URL,
      enabled: true,
      meta: { duration: 120, filesize: 1024 },
    });
    expect(result).toBe(SRC);
  });

  it('returns the source unchanged when duration is unknown', () => {
    const result = formatVideoTransformURL({
      src: SRC,
      baseURL: BASE_URL,
      enabled: true,
      meta: { filesize: 1024 },
    });
    expect(result).toBe(SRC);
  });

  it('builds an absolute mode=video transform URL with audio stripped when enabled and eligible', () => {
    const result = formatVideoTransformURL({
      src: SRC,
      baseURL: BASE_URL,
      enabled: true,
      width: 822,
      meta: { duration: 30, filesize: 1024 },
    });
    expect(result).toBe('https://napochaan.com/cdn-cgi/media/mode=video,width=822,audio=false/https://napochaan.com/api/media/file/clip.mp4');
  });

  it('omits the width option when width is not provided', () => {
    const result = formatVideoTransformURL({
      src: SRC,
      baseURL: BASE_URL,
      enabled: true,
      meta: { duration: 30, filesize: 1024 },
    });
    expect(result).toBe('https://napochaan.com/cdn-cgi/media/mode=video,audio=false/https://napochaan.com/api/media/file/clip.mp4');
  });

  it('resolves an absolute source URL as-is regardless of baseURL', () => {
    const absoluteSrc = 'https://cdn.example.com/clip.mp4';
    const result = formatVideoTransformURL({
      src: absoluteSrc,
      baseURL: BASE_URL,
      enabled: true,
      meta: { duration: 30, filesize: 1024 },
    });
    expect(result).toBe('https://napochaan.com/cdn-cgi/media/mode=video,audio=false/https://cdn.example.com/clip.mp4');
  });

  it('respects the staging baseURL for both host and source resolution', () => {
    const result = formatVideoTransformURL({
      src: SRC,
      baseURL: 'https://stg.napochaan.com',
      enabled: true,
      meta: { duration: 30, filesize: 1024 },
    });
    expect(result).toBe('https://stg.napochaan.com/cdn-cgi/media/mode=video,audio=false/https://stg.napochaan.com/api/media/file/clip.mp4');
  });
});

describe('formatPosterURL', () => {
  it('returns undefined when disabled', () => {
    const result = formatPosterURL({ src: SRC, baseURL: BASE_URL, enabled: false });
    expect(result).toBeUndefined();
  });

  it('builds a mode=frame transform URL with the default time when enabled', () => {
    const result = formatPosterURL({ src: SRC, baseURL: BASE_URL, enabled: true });
    expect(result).toBe('https://napochaan.com/cdn-cgi/media/mode=frame,time=1s/https://napochaan.com/api/media/file/clip.mp4');
  });

  it('uses a custom time when provided', () => {
    const result = formatPosterURL({ src: SRC, baseURL: BASE_URL, enabled: true, time: '5s' });
    expect(result).toBe('https://napochaan.com/cdn-cgi/media/mode=frame,time=5s/https://napochaan.com/api/media/file/clip.mp4');
  });

  it('includes width after time when provided', () => {
    const result = formatPosterURL({ src: SRC, baseURL: BASE_URL, enabled: true, time: '2s', width: 400 });
    expect(result).toBe('https://napochaan.com/cdn-cgi/media/mode=frame,time=2s,width=400/https://napochaan.com/api/media/file/clip.mp4');
  });
});
