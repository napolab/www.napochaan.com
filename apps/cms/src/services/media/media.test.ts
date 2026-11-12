import { describe, expect, it, vi } from 'vitest';

import { createMediaService } from './index';

const stream = () => new ReadableStream<Uint8Array>();

const fakeBucket = (object: unknown) => {
  const get = vi.fn(async () => object);
  return { bucket: { get } as unknown as R2Bucket, get };
};

describe('createMediaService', () => {
  it('returns undefined for a missing object', async () => {
    const { bucket } = fakeBucket(null);

    expect(await createMediaService(bucket).file('nope.png')).toBeUndefined();
  });

  it('maps R2 metadata to MediaFile and uses the bare filename as key', async () => {
    const body = stream();
    const { bucket, get } = fakeBucket({ body, size: 42, httpEtag: '"abc"', httpMetadata: { contentType: 'image/png' } });

    const file = await createMediaService(bucket).file('a.png');

    expect(get).toHaveBeenCalledWith('a.png');
    expect(file).toEqual({ body, contentType: 'image/png', size: 42, etag: '"abc"' });
  });

  it('falls back to application/octet-stream without contentType', async () => {
    const { bucket } = fakeBucket({ body: stream(), size: 1, httpEtag: '"e"', httpMetadata: {} });

    expect((await createMediaService(bucket).file('a.bin'))?.contentType).toBe('application/octet-stream');
  });

  it('never touches R2 for an unsafe filename', async () => {
    const { bucket, get } = fakeBucket({ body: stream(), size: 1, httpEtag: 'e' });

    expect(await createMediaService(bucket).file('../secret')).toBeUndefined();
    expect(get).not.toHaveBeenCalled();
  });
});
