import { describe, expect, it } from 'vitest';

import { sha256Digest } from './index';

describe('sha256Digest', () => {
  // Known vectors (FIPS 180-2): SHA-256("") and SHA-256("abc").
  it.each([
    ['', 'sha256:e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855'],
    ['abc', 'sha256:ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad'],
  ])('hashes %j as sha256:<lowercase hex>', async (text, expected) => {
    expect(await sha256Digest(text)).toBe(expected);
  });

  it('hashes the UTF-8 bytes of non-ASCII text', async () => {
    expect(await sha256Digest('日本語')).toBe('sha256:77710aedc74ecfa33685e33a6c7df5cc83004da1bdcef7fb280f5c2b2e97e0a5');
  });
});
