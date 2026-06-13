import { describe, expect, it } from 'vitest';

import { isPayloadMedia, toBase64 } from './helpers';

const ORIGIN = 'https://stg.napochaan.com';

describe('isPayloadMedia', () => {
  it('is true for a same-origin /api/media/file/ URL', () => {
    expect(isPayloadMedia(`${ORIGIN}/api/media/file/x.png`, ORIGIN)).toBe(true);
  });

  it('is false for a cross-origin URL', () => {
    expect(isPayloadMedia('https://cdn.example.com/api/media/file/x.png', ORIGIN)).toBe(false);
  });

  it('is false for a same-origin non-media path', () => {
    expect(isPayloadMedia(`${ORIGIN}/images/x.png`, ORIGIN)).toBe(false);
  });
});

describe('toBase64', () => {
  it('encodes the bytes as a base64 string', () => {
    const buffer = new Uint8Array([1, 2, 3, 4]).buffer;

    expect(toBase64(buffer)).toBe('AQIDBA==');
  });
});
