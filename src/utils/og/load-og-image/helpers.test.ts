import { describe, expect, it } from 'vitest';

import { detectImageType, isPayloadMedia, toBase64 } from './helpers';

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

describe('detectImageType', () => {
  it("returns 'jpeg' for the JPEG magic bytes", () => {
    const buffer = new Uint8Array([0xff, 0xd8, 0xff, 0x00]).buffer;

    expect(detectImageType(buffer)).toBe('jpeg');
  });

  it("returns 'png' for the PNG magic bytes", () => {
    const buffer = new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]).buffer;

    expect(detectImageType(buffer)).toBe('png');
  });

  it('returns undefined for WebP (RIFF/WEBP) bytes', () => {
    const buffer = new Uint8Array([0x52, 0x49, 0x46, 0x46, 0x00, 0x00, 0x00, 0x00, 0x57, 0x45, 0x42, 0x50]).buffer;

    expect(detectImageType(buffer)).toBeUndefined();
  });

  it('returns undefined for a buffer shorter than 3 bytes', () => {
    const buffer = new Uint8Array([0xff, 0xd8]).buffer;

    expect(detectImageType(buffer)).toBeUndefined();
  });
});
