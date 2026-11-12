import { beforeEach, describe, expect, it, vi } from 'vitest';

import { createFakeCMSBinding, createFakeCMSServices } from '../../../../../__mocks__/cms-services';

import { GET } from './route';

import type { MediaFile } from '@napochaan/cms-api/services';

const context = vi.hoisted(() => ({ env: {} as { CMS?: { fetch: (input: RequestInfo | URL, init?: RequestInit) => Promise<Response> } } }));

vi.mock('@opennextjs/cloudflare', () => ({
  getCloudflareContext: (options?: { async?: boolean }) => {
    if (options?.async !== true) throw new Error('getCloudflareContext called in sync mode');
    return Promise.resolve(context);
  },
}));

const PNG = new Uint8Array([0x89, 0x50, 0x4e, 0x47]);

const toFile = (): MediaFile => ({
  body: new Response(PNG).body ?? new ReadableStream(),
  contentType: 'image/png',
  size: PNG.byteLength,
  etag: '"abc"',
});

const requested = vi.fn<(filename: string) => void>();

const useMedia = (files: Record<string, true>) => {
  const services = createFakeCMSServices({
    media: {
      file: async (filename) => {
        requested(filename);
        return files[filename] === true ? toFile() : undefined;
      },
    },
  });
  context.env = { CMS: createFakeCMSBinding(services) };
};

const call = async (filename: string) => GET(new Request(`http://localhost/api/media/file/${encodeURIComponent(filename)}`), { params: Promise.resolve({ filename }) });

beforeEach(() => {
  requested.mockClear();
});

describe('GET /api/media/file/[filename]', () => {
  it('streams the cms media body with its Content-Type, Content-Length and ETag', async () => {
    useMedia({ 'a.png': true });

    const res = await call('a.png');

    expect(res.status).toBe(200);
    expect(res.headers.get('Content-Type')).toBe('image/png');
    expect(res.headers.get('Content-Length')).toBe(`${PNG.byteLength}`);
    expect(res.headers.get('ETag')).toBe('"abc"');
    expect(new Uint8Array(await res.arrayBuffer())).toEqual(PNG);
  });

  it('passes a cms 404 through as 404', async () => {
    useMedia({});

    const res = await call('nope.png');

    expect(res.status).toBe(404);
  });

  it('hands cms the decoded filename exactly once even with spaces or non-ASCII', async () => {
    useMedia({ 'a b 写真.png': true });

    const res = await call('a b 写真.png');

    expect(res.status).toBe(200);
    expect(requested).toHaveBeenCalledWith('a b 写真.png');
  });
});
