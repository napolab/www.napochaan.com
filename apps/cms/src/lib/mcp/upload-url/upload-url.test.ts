import { describe, expect, it } from 'vitest';

import { UploadURLExpiredError, UploadURLSignatureError } from '../errors';

import { resolveMimetypeFromFilename, signUploadURLParams, verifyUploadURLParams } from './index';

import type { UploadURLParams } from './index';

const SECRET = 'test-secret-value';
const NOW = 1_700_000_000;

const baseParams = (): UploadURLParams => ({ userID: 42, exp: NOW + 600, filename: 'cover.png', alt: 'テスト画像' });

describe('signUploadURLParams / verifyUploadURLParams', () => {
  it('round-trips: sign then verify succeeds', async () => {
    const params = baseParams();
    const sig = await signUploadURLParams(SECRET, params);

    const result = await verifyUploadURLParams(SECRET, params, sig, NOW);

    expect(result.isOk()).toBe(true);
  });

  it('produces a 64-char lowercase hex signature', async () => {
    const sig = await signUploadURLParams(SECRET, baseParams());

    expect(sig).toMatch(/^[0-9a-f]{64}$/);
  });

  it('round-trips multibyte (Japanese) alt', async () => {
    const params = { ...baseParams(), alt: '桜と富士山の写真、とても美しい景色です' };
    const sig = await signUploadURLParams(SECRET, params);

    const result = await verifyUploadURLParams(SECRET, params, sig, NOW);

    expect(result.isOk()).toBe(true);
  });

  it('fails with UploadURLSignatureError when userID is tampered', async () => {
    const params = baseParams();
    const sig = await signUploadURLParams(SECRET, params);
    const tampered = { ...params, userID: params.userID + 1 };

    const result = await verifyUploadURLParams(SECRET, tampered, sig, NOW);

    expect(result.isErr()).toBe(true);
    expect(result._unsafeUnwrapErr()).toBeInstanceOf(UploadURLSignatureError);
  });

  it('fails with UploadURLSignatureError when exp is tampered', async () => {
    const params = baseParams();
    const sig = await signUploadURLParams(SECRET, params);
    const tampered = { ...params, exp: params.exp + 1 };

    const result = await verifyUploadURLParams(SECRET, tampered, sig, NOW);

    expect(result.isErr()).toBe(true);
    expect(result._unsafeUnwrapErr()).toBeInstanceOf(UploadURLSignatureError);
  });

  it('fails with UploadURLSignatureError when filename is tampered', async () => {
    const params = baseParams();
    const sig = await signUploadURLParams(SECRET, params);
    const tampered = { ...params, filename: 'evil.png' };

    const result = await verifyUploadURLParams(SECRET, tampered, sig, NOW);

    expect(result.isErr()).toBe(true);
    expect(result._unsafeUnwrapErr()).toBeInstanceOf(UploadURLSignatureError);
  });

  it('fails with UploadURLSignatureError when alt is tampered', async () => {
    const params = baseParams();
    const sig = await signUploadURLParams(SECRET, params);
    const tampered = { ...params, alt: '差し替えられた alt' };

    const result = await verifyUploadURLParams(SECRET, tampered, sig, NOW);

    expect(result.isErr()).toBe(true);
    expect(result._unsafeUnwrapErr()).toBeInstanceOf(UploadURLSignatureError);
  });

  it('fails with UploadURLSignatureError when secret differs', async () => {
    const params = baseParams();
    const sig = await signUploadURLParams(SECRET, params);

    const result = await verifyUploadURLParams('a-different-secret', params, sig, NOW);

    expect(result.isErr()).toBe(true);
    expect(result._unsafeUnwrapErr()).toBeInstanceOf(UploadURLSignatureError);
  });

  it('fails with UploadURLExpiredError when exp has passed', async () => {
    const params = { ...baseParams(), exp: NOW - 1 };
    const sig = await signUploadURLParams(SECRET, params);

    const result = await verifyUploadURLParams(SECRET, params, sig, NOW);

    expect(result.isErr()).toBe(true);
    expect(result._unsafeUnwrapErr()).toBeInstanceOf(UploadURLExpiredError);
  });

  it('treats exp === nowSeconds as still valid (boundary is inclusive)', async () => {
    const params = { ...baseParams(), exp: NOW };
    const sig = await signUploadURLParams(SECRET, params);

    const result = await verifyUploadURLParams(SECRET, params, sig, NOW);

    expect(result.isOk()).toBe(true);
  });

  it('is unambiguous under newline-boundary shift between filename and alt', async () => {
    // filename="a\nb", alt="c" と filename="a", alt="b\nc" は、区切り文字をそのまま
    // "\n" で連結すると同一メッセージに潰れてしまう組み合わせ(review 指摘のケース)。
    // encodeURIComponent によるフィールドエンコードでこれが解消されていることを pin する。
    const paramsA = { ...baseParams(), filename: 'a\nb', alt: 'c' };
    const paramsB = { ...baseParams(), filename: 'a', alt: 'b\nc' };

    const sigA = await signUploadURLParams(SECRET, paramsA);
    const sigB = await signUploadURLParams(SECRET, paramsB);

    expect(sigA).not.toBe(sigB);

    const crossVerifyAWithB = await verifyUploadURLParams(SECRET, paramsB, sigA, NOW);
    const crossVerifyBWithA = await verifyUploadURLParams(SECRET, paramsA, sigB, NOW);

    expect(crossVerifyAWithB.isErr()).toBe(true);
    expect(crossVerifyAWithB._unsafeUnwrapErr()).toBeInstanceOf(UploadURLSignatureError);
    expect(crossVerifyBWithA.isErr()).toBe(true);
    expect(crossVerifyBWithA._unsafeUnwrapErr()).toBeInstanceOf(UploadURLSignatureError);
  });

  it('checks expiry before signature (expired + tampered signature still reports expiry)', async () => {
    const params = { ...baseParams(), exp: NOW - 1 };

    const result = await verifyUploadURLParams(SECRET, params, 'not-a-real-signature', NOW);

    expect(result.isErr()).toBe(true);
    expect(result._unsafeUnwrapErr()).toBeInstanceOf(UploadURLExpiredError);
  });

  it('fails with UploadURLSignatureError (without throwing) for malformed hex signature', async () => {
    const params = baseParams();

    const oddLength = await verifyUploadURLParams(SECRET, params, 'abc', NOW);
    const nonHex = await verifyUploadURLParams(SECRET, params, 'zz'.repeat(32), NOW);
    const empty = await verifyUploadURLParams(SECRET, params, '', NOW);
    const wrongLength = await verifyUploadURLParams(SECRET, params, 'ab'.repeat(16), NOW);

    expect(oddLength.isErr()).toBe(true);
    expect(oddLength._unsafeUnwrapErr()).toBeInstanceOf(UploadURLSignatureError);
    expect(nonHex.isErr()).toBe(true);
    expect(nonHex._unsafeUnwrapErr()).toBeInstanceOf(UploadURLSignatureError);
    expect(empty.isErr()).toBe(true);
    expect(empty._unsafeUnwrapErr()).toBeInstanceOf(UploadURLSignatureError);
    expect(wrongLength.isErr()).toBe(true);
    expect(wrongLength._unsafeUnwrapErr()).toBeInstanceOf(UploadURLSignatureError);
  });
});

describe('resolveMimetypeFromFilename', () => {
  it.each([
    ['photo.jpg', 'image/jpeg'],
    ['photo.JPG', 'image/jpeg'],
    ['photo.jpeg', 'image/jpeg'],
    ['photo.JPEG', 'image/jpeg'],
    ['photo.png', 'image/png'],
    ['photo.PNG', 'image/png'],
    ['photo.webp', 'image/webp'],
    ['photo.WEBP', 'image/webp'],
    ['photo.gif', 'image/gif'],
    ['photo.GIF', 'image/gif'],
    ['photo.avif', 'image/avif'],
    ['photo.AVIF', 'image/avif'],
  ])('resolves %s -> %s', (filename, expected) => {
    expect(resolveMimetypeFromFilename(filename)).toBe(expected);
  });

  it.each([['photo.bmp'], ['photo.tiff'], ['photo'], ['photo.']])('returns undefined for unknown/missing extension: %s', (filename) => {
    expect(resolveMimetypeFromFilename(filename)).toBeUndefined();
  });
});
