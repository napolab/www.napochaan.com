import { describe, expect, it } from 'vitest';

import { resolveVideoSrc } from './index';

const BASE_URL = 'https://napochaan.com';
const URL_PATH = '/api/media/file/clip.mp4';

describe('resolveVideoSrc', () => {
  it('returns the raw url unchanged for the player variant, regardless of transform eligibility', () => {
    const result = resolveVideoSrc({ variant: 'player', url: URL_PATH, baseURL: BASE_URL, enabled: true, meta: { duration: 30, filesize: 1024 } });
    expect(result).toBe(URL_PATH);
  });

  it('builds a Media Transformations URL for the ambient variant when enabled and eligible', () => {
    const result = resolveVideoSrc({ variant: 'ambient', url: URL_PATH, baseURL: BASE_URL, enabled: true, meta: { duration: 10, filesize: 1024 } });
    expect(result).toBe('https://napochaan.com/cdn-cgi/media/mode=video,audio=false/https://napochaan.com/api/media/file/clip.mp4');
  });

  it('falls back to the raw url for the ambient variant when transforms are disabled', () => {
    const result = resolveVideoSrc({ variant: 'ambient', url: URL_PATH, baseURL: BASE_URL, enabled: false, meta: { duration: 10, filesize: 1024 } });
    expect(result).toBe(URL_PATH);
  });

  it('falls back to the raw url for the ambient variant when the clip exceeds the 60s output cap', () => {
    const result = resolveVideoSrc({ variant: 'ambient', url: URL_PATH, baseURL: BASE_URL, enabled: true, meta: { duration: 90, filesize: 1024 } });
    expect(result).toBe(URL_PATH);
  });
});
