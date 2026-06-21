import { describe, expect, it } from 'vitest';

import { toSoftwareRelease } from './to-software-download';

describe('toSoftwareRelease', () => {
  it('maps a populated release doc, coercing nullish changelog to undefined', () => {
    const result = toSoftwareRelease({ id: 7, version: '1.1.0', releasedAt: '2026-02-01T00:00:00.000Z', changelog: null, filename: 'app-1.1.0.zip' });
    expect(result).toEqual({ id: '7', version: '1.1.0', releasedAt: '2026-02-01T00:00:00.000Z', changelog: undefined, filename: 'app-1.1.0.zip' });
  });

  it('keeps a non-empty changelog', () => {
    const result = toSoftwareRelease({ id: 8, version: '1.2.0', releasedAt: '2026-03-01T00:00:00.000Z', changelog: 'fix bug', filename: 'app-1.2.0.zip' });
    expect(result.changelog).toBe('fix bug');
  });
});
