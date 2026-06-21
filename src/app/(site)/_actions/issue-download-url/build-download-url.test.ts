import { describe, expect, it } from 'vitest';

import { buildDownloadURL } from './build-download-url';

describe('buildDownloadURL', () => {
  it('encodes the release id, exp, and sig into the download path', () => {
    expect(buildDownloadURL({ releaseId: '42', exp: 1_900_000_000_000, sig: 'abc' })).toBe('/api/software/download?releaseId=42&exp=1900000000000&sig=abc');
  });
});
