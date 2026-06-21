import { describe, expect, it } from 'vitest';

import { signDownloadToken } from '@lib/software/download-token';

import { resolveDownloadRequest } from './resolve-download';

const SECRET = 'test-secret';
const NOW = 1_900_000_000_000;

const params = (entries: Record<string, string>): URLSearchParams => new URLSearchParams(entries);

describe('resolveDownloadRequest', () => {
  it('accepts a valid, unexpired, correctly-signed request', async () => {
    const exp = NOW + 10_000;
    const sig = await signDownloadToken({ releaseId: '42', exp }, SECRET);
    const result = await resolveDownloadRequest(params({ releaseId: '42', exp: `${exp}`, sig }), SECRET, NOW);
    expect(result).toEqual({ ok: true, releaseId: '42' });
  });

  it('rejects an expired request', async () => {
    const exp = NOW - 1;
    const sig = await signDownloadToken({ releaseId: '42', exp }, SECRET);
    expect(await resolveDownloadRequest(params({ releaseId: '42', exp: `${exp}`, sig }), SECRET, NOW)).toEqual({ ok: false });
  });

  it('rejects a bad signature', async () => {
    const exp = NOW + 10_000;
    expect(await resolveDownloadRequest(params({ releaseId: '42', exp: `${exp}`, sig: 'deadbeef' }), SECRET, NOW)).toEqual({ ok: false });
  });

  it('rejects missing params', async () => {
    expect(await resolveDownloadRequest(params({ releaseId: '42' }), SECRET, NOW)).toEqual({ ok: false });
  });
});
