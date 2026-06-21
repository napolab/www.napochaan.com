import { describe, expect, it } from 'vitest';

import { signDownloadToken, verifyDownloadToken } from './index';

const SECRET = 'test-secret';

describe('download-token', () => {
  it('verifies a token it signed', async () => {
    const input = { releaseId: '42', exp: 1_900_000_000_000 };
    const sig = await signDownloadToken(input, SECRET);
    expect(await verifyDownloadToken(input, sig, SECRET)).toBe(true);
  });

  it('rejects a tampered releaseId', async () => {
    const sig = await signDownloadToken({ releaseId: '42', exp: 1_900_000_000_000 }, SECRET);
    expect(await verifyDownloadToken({ releaseId: '43', exp: 1_900_000_000_000 }, sig, SECRET)).toBe(false);
  });

  it('rejects a tampered exp', async () => {
    const sig = await signDownloadToken({ releaseId: '42', exp: 1_900_000_000_000 }, SECRET);
    expect(await verifyDownloadToken({ releaseId: '42', exp: 1_900_000_000_001 }, sig, SECRET)).toBe(false);
  });

  it('rejects a different secret', async () => {
    const input = { releaseId: '42', exp: 1_900_000_000_000 };
    const sig = await signDownloadToken(input, SECRET);
    expect(await verifyDownloadToken(input, sig, 'other-secret')).toBe(false);
  });

  it('rejects a malformed signature without throwing', async () => {
    const input = { releaseId: '42', exp: 1_900_000_000_000 };
    expect(await verifyDownloadToken(input, 'zzzz', SECRET)).toBe(false);
  });
});
