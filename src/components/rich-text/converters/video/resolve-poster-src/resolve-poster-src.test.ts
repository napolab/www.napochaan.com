import { describe, expect, it } from 'vitest';

import { resolvePosterSrc } from './index';

const BASE_URL = 'https://napochaan.com';
const URL_PATH = '/api/media/file/clip.mp4';

describe('resolvePosterSrc', () => {
  it('prefers the explicit poster URL over auto-generation', () => {
    const result = resolvePosterSrc({
      explicitPosterURL: '/api/media/file/poster.jpg',
      videoURL: URL_PATH,
      baseURL: BASE_URL,
      enabled: true,
      meta: { duration: 30, filesize: 1024 },
    });
    expect(result).toBe('/api/media/file/poster.jpg');
  });

  it('auto-generates a mode=frame poster when eligible and enabled', () => {
    const result = resolvePosterSrc({ videoURL: URL_PATH, baseURL: BASE_URL, enabled: true, meta: { duration: 120, filesize: 1024 } });
    expect(result).toBe('https://napochaan.com/cdn-cgi/media/mode=frame,time=1s/https://napochaan.com/api/media/file/clip.mp4');
  });

  it('auto-generates a poster for a clip longer than the 60s output cap but within the 600s input cap', () => {
    // This is the whole point of having a separate input-eligibility check:
    // isTransformEligible (60s) would reject this, but mode=frame is not
    // bound by the output cap.
    const result = resolvePosterSrc({ videoURL: URL_PATH, baseURL: BASE_URL, enabled: true, meta: { duration: 300, filesize: 1024 } });
    expect(result).toBe('https://napochaan.com/cdn-cgi/media/mode=frame,time=1s/https://napochaan.com/api/media/file/clip.mp4');
  });

  it('returns undefined when the clip exceeds the 600s input duration cap', () => {
    const result = resolvePosterSrc({ videoURL: URL_PATH, baseURL: BASE_URL, enabled: true, meta: { duration: 601, filesize: 1024 } });
    expect(result).toBeUndefined();
  });

  it('returns undefined when the clip exceeds the 100MB input filesize cap', () => {
    const result = resolvePosterSrc({ videoURL: URL_PATH, baseURL: BASE_URL, enabled: true, meta: { duration: 30, filesize: 100 * 1024 * 1024 + 1 } });
    expect(result).toBeUndefined();
  });

  it('returns undefined when duration or filesize is unknown', () => {
    expect(resolvePosterSrc({ videoURL: URL_PATH, baseURL: BASE_URL, enabled: true, meta: { filesize: 1024 } })).toBeUndefined();
    expect(resolvePosterSrc({ videoURL: URL_PATH, baseURL: BASE_URL, enabled: true, meta: { duration: 30 } })).toBeUndefined();
  });

  it('returns undefined when transforms are disabled, even if eligible', () => {
    const result = resolvePosterSrc({ videoURL: URL_PATH, baseURL: BASE_URL, enabled: false, meta: { duration: 30, filesize: 1024 } });
    expect(result).toBeUndefined();
  });
});
