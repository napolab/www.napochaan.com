import { ValidationError } from 'payload';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { MAX_UPLOAD_BYTES, signUploadURLParams } from '@lib/mcp/upload-url';

import type { UploadURLParams } from '@lib/mcp/upload-url';

const SECRET = 'test-payload-secret';
const NOW = 1_700_000_000;

const findByID = vi.fn();
const create = vi.fn();

vi.mock('@lib/payload/client', () => ({
  getPayloadClient: async () => ({ findByID, create }),
}));
vi.mock('@opennextjs/cloudflare', () => ({
  getCloudflareContext: async () => ({ env: { PAYLOAD_SECRET: SECRET } }),
}));

const { POST } = await import('./route');

const baseParams = (): UploadURLParams => ({ userID: 1, exp: NOW + 600, filename: 'cover.png', alt: 'テスト画像' });

type QueryOverrides = Partial<Record<'user' | 'exp' | 'filename' | 'alt' | 'sig', string>>;

// 実 signUploadURLParams で有効な sig を作り、URLSearchParams のクエリを組む。
// overrides で任意フィールドを上書き/削除して不正系ケースを作る。
const buildSignedURL = async (params: UploadURLParams, overrides: QueryOverrides = {}): Promise<string> => {
  const sig = await signUploadURLParams(SECRET, params);
  const search = new URLSearchParams({
    user: `${params.userID}`,
    exp: `${params.exp}`,
    filename: params.filename,
    alt: params.alt,
    sig,
  });
  for (const [key, value] of Object.entries(overrides)) {
    if (value === undefined) {
      search.delete(key);
      continue;
    }
    search.set(key, value);
  }
  return `http://localhost/api/media-upload?${search.toString()}`;
};

const postRequest = (url: string, body?: BodyInit, headers?: Record<string, string>): Request => new Request(url, { method: 'POST', body, headers });

beforeEach(() => {
  vi.useFakeTimers();
  vi.setSystemTime(NOW * 1000);
  findByID.mockReset();
  create.mockReset();
});

afterEach(() => {
  vi.useRealTimers();
});

describe('POST /api/media-upload', () => {
  describe('missing required params', () => {
    it.each(['user', 'exp', 'filename', 'alt', 'sig'] as const)('returns 400 when %s is missing', async (key) => {
      const url = await buildSignedURL(baseParams(), { [key]: undefined });

      const response = await POST(postRequest(url, new Uint8Array([1])));

      expect(response.status).toBe(400);
    });
  });

  it('returns 400 when user is non-numeric', async () => {
    const url = await buildSignedURL(baseParams(), { user: 'abc' });

    const response = await POST(postRequest(url, new Uint8Array([1])));

    expect(response.status).toBe(400);
  });

  it('returns 400 when exp is non-numeric', async () => {
    const url = await buildSignedURL(baseParams(), { exp: 'abc' });

    const response = await POST(postRequest(url, new Uint8Array([1])));

    expect(response.status).toBe(400);
  });

  // 数字のみを要求する digits-regex は parseInt の桁先頭一致(旧実装は parseInt("1abc",10)===1
  // を許してしまい、元の署名と偶然同じ数値になって検証を通り得た)より厳格。ここでは 400 になる
  // ことを固定する — 401(署名不一致)にはならない、つまり事前に弾かれる。
  it('returns 400 when user has a valid numeric prefix but trailing non-digit characters', async () => {
    const url = await buildSignedURL(baseParams(), { user: '1abc' });

    const response = await POST(postRequest(url, new Uint8Array([1])));

    expect(response.status).toBe(400);
  });

  it('returns 400 when alt is present but an empty string (treated the same as missing)', async () => {
    const url = await buildSignedURL(baseParams(), { alt: '' });

    const response = await POST(postRequest(url, new Uint8Array([1])));

    expect(response.status).toBe(400);
  });

  it('returns 401 when sig is tampered', async () => {
    const url = await buildSignedURL(baseParams(), { sig: 'deadbeef' });

    const response = await POST(postRequest(url, new Uint8Array([1])));

    expect(response.status).toBe(401);
  });

  it('returns 401 when sig was minted for a different alt', async () => {
    const params = baseParams();
    const sig = await signUploadURLParams(SECRET, { ...params, alt: '別のalt' });
    const search = new URLSearchParams({ user: `${params.userID}`, exp: `${params.exp}`, filename: params.filename, alt: params.alt, sig });

    const response = await POST(postRequest(`http://localhost/api/media-upload?${search.toString()}`, new Uint8Array([1])));

    expect(response.status).toBe(401);
  });

  it('returns 401 when a sig minted for one filename is replayed with a different filename', async () => {
    const params = baseParams();
    const sig = await signUploadURLParams(SECRET, params);
    const search = new URLSearchParams({ user: `${params.userID}`, exp: `${params.exp}`, filename: 'other.png', alt: params.alt, sig });

    const response = await POST(postRequest(`http://localhost/api/media-upload?${search.toString()}`, new Uint8Array([1])));

    expect(response.status).toBe(401);
  });

  it('returns 401 when a sig minted for one userID is replayed with a different user', async () => {
    const params = baseParams();
    const sig = await signUploadURLParams(SECRET, params);
    const search = new URLSearchParams({ user: `${params.userID + 1}`, exp: `${params.exp}`, filename: params.filename, alt: params.alt, sig });

    const response = await POST(postRequest(`http://localhost/api/media-upload?${search.toString()}`, new Uint8Array([1])));

    expect(response.status).toBe(401);
  });

  it('returns 410 when exp is expired', async () => {
    const url = await buildSignedURL({ ...baseParams(), exp: NOW - 1 });

    const response = await POST(postRequest(url, new Uint8Array([1])));

    expect(response.status).toBe(410);
  });

  it('returns 401 when the signed user is unknown (findByID -> null)', async () => {
    findByID.mockResolvedValue(null);
    const url = await buildSignedURL(baseParams());

    const response = await POST(postRequest(url, new Uint8Array([1])));

    expect(response.status).toBe(401);
    expect(create).not.toHaveBeenCalled();
  });

  it('returns 413 when content-length exceeds the 10MB cap', async () => {
    const url = await buildSignedURL(baseParams());

    const response = await POST(postRequest(url, new Uint8Array([1, 2, 3]), { 'content-length': `${MAX_UPLOAD_BYTES + 1}` }));

    expect(response.status).toBe(413);
    expect(create).not.toHaveBeenCalled();
  });

  it('returns 413 when the actual body exceeds the 10MB cap without a content-length header', async () => {
    const url = await buildSignedURL(baseParams());

    const response = await POST(postRequest(url, Buffer.alloc(MAX_UPLOAD_BYTES + 1)));

    expect(response.status).toBe(413);
    expect(create).not.toHaveBeenCalled();
  });

  // 署名検証は body の buffering(bodyLimit)より前に実行されなければならない —
  // そうしないと無署名/不正署名のリクエストでも攻撃者が任意サイズの body を
  // 送りつけてワーカーに buffering させられる(認可境界がボディ読み取りの前段にある
  // ことの固定テスト)。sig を改竄したまま 11MB(無 content-length)を送っても
  // 413(bodyLimit)ではなく 401(署名検証)が返るはず — 413 が返るなら body が
  // 先に drain されてしまっている。
  it('returns 401 (not 413) when sig is tampered and the body is 11MB without a content-length header', async () => {
    const url = await buildSignedURL(baseParams(), { sig: 'deadbeef' });

    const response = await POST(postRequest(url, Buffer.alloc(MAX_UPLOAD_BYTES + 1)));

    expect(response.status).toBe(401);
    expect(create).not.toHaveBeenCalled();
  });

  it('returns 400 for an empty body', async () => {
    const url = await buildSignedURL(baseParams());

    const response = await POST(postRequest(url, new Uint8Array(0)));

    expect(response.status).toBe(400);
  });

  it('returns 400 when a genuinely signed filename has an unresolvable MIME extension', async () => {
    const params = { ...baseParams(), filename: 'file.txt' };
    const url = await buildSignedURL(params);

    const response = await POST(postRequest(url, new Uint8Array([1, 2, 3])));

    expect(response.status).toBe(400);
    expect(create).not.toHaveBeenCalled();
  });

  it('returns 400 with joined field messages when payload.create rejects with a ValidationError', async () => {
    const user = { id: 1, email: 'dev@napochaan.com' };
    findByID.mockResolvedValue(user);
    create.mockRejectedValue(
      new ValidationError({
        errors: [
          { path: 'alt', message: 'alt is required' },
          { path: 'filename', message: 'filename is invalid' },
        ],
      }),
    );
    const url = await buildSignedURL(baseParams());

    const response = await POST(postRequest(url, new Uint8Array([1, 2, 3])));
    const body = (await response.json()) as { error: string };

    expect(response.status).toBe(400);
    expect(body.error).toContain('alt: alt is required');
    expect(body.error).toContain('filename: filename is invalid');
  });

  // formatUploadError の cause 判定は再帰的に辿る(直下だけでなく、間に素の Error が
  // 挟まっていても奥まで見る)。ここでは PayloadOperationError.cause = Error('outer') の
  // さらに .cause に ValidationError を1段深く仕込み、それでも 400 に畳まれることを確認する。
  it('returns 400 with joined field messages when the ValidationError is nested one level deeper in the cause chain', async () => {
    const user = { id: 1, email: 'dev@napochaan.com' };
    findByID.mockResolvedValue(user);
    create.mockRejectedValue(
      new Error('outer', {
        cause: new ValidationError({
          errors: [{ path: 'alt', message: 'alt is required' }],
        }),
      }),
    );
    const url = await buildSignedURL(baseParams());

    const response = await POST(postRequest(url, new Uint8Array([1, 2, 3])));
    const body = (await response.json()) as { error: string };

    expect(response.status).toBe(400);
    expect(body.error).toContain('alt: alt is required');
  });

  it('returns 500 instead of overflowing when the cause chain is cyclic', async () => {
    const user = { id: 1, email: 'dev@napochaan.com' };
    findByID.mockResolvedValue(user);
    const cyclic = new Error('outer');
    cyclic.cause = cyclic;
    create.mockRejectedValue(cyclic);
    const url = await buildSignedURL(baseParams());

    const response = await POST(postRequest(url, new Uint8Array([1, 2, 3])));

    expect(response.status).toBe(500);
  });

  it('creates the media doc and returns 201 on a valid request', async () => {
    const user = { id: 1, email: 'dev@napochaan.com' };
    findByID.mockResolvedValue(user);
    create.mockResolvedValue({ id: 42, url: '/media/cover.png' });
    const params = baseParams();
    const url = await buildSignedURL(params);
    const bytes = new Uint8Array([1, 2, 3, 4]);

    const response = await POST(postRequest(url, bytes));
    const body = (await response.json()) as { id: number; placeholder: string; url?: string };

    expect(response.status).toBe(201);
    expect(body.id).toBe(42);
    expect(body.placeholder).toBe(`![media:42](${params.alt})`);
    expect(body.url).toBe('/media/cover.png');
    expect(create).toHaveBeenCalledWith({
      collection: 'media',
      data: { alt: params.alt },
      file: { data: Buffer.from(bytes), mimetype: 'image/png', name: params.filename, size: bytes.byteLength },
      overrideAccess: false,
      user,
    });
  });

  it('round-trips a multibyte (Japanese) alt through URL encoding into the placeholder', async () => {
    const user = { id: 1, email: 'dev@napochaan.com' };
    findByID.mockResolvedValue(user);
    create.mockResolvedValue({ id: 7, url: null });
    const params = { ...baseParams(), alt: '桜と富士山の写真、とても美しい景色です' };
    const url = await buildSignedURL(params);

    const response = await POST(postRequest(url, new Uint8Array([1, 2, 3])));
    const body = (await response.json()) as { placeholder: string; url?: string };

    expect(response.status).toBe(201);
    expect(body.placeholder).toBe(`![media:7](${params.alt})`);
    expect(body.url).toBeUndefined();
  });
});
