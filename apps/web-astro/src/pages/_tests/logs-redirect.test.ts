import { describe, expect, it } from 'vitest';

import * as logs from '../logs';
import { renderEndpoint } from '../../test-utils/astro-container';

import type { AstroComponentFactory } from 'astro/runtime/server/index.js';

const endpoint = logs as unknown as AstroComponentFactory;

// Port of the Next `redirects()` entry `/logs` → `/log` (permanent). An endpoint, not
// astro.config `redirects`: the Cloudflare adapter turns those into an assets
// `_redirects` file the asset layer answers before the worker, so the worker's
// `no-store` on ≥300 responses never reached them.
describe('/logs', () => {
  it('redirects to /log with 308', async () => {
    const res = await renderEndpoint(endpoint, '/logs');
    expect(res.status).toBe(308);
    expect(res.headers.get('location')).toBe('/log');
  });

  it('keeps the query string, as Next did', async () => {
    const res = await renderEndpoint(endpoint, '/logs?a=1');
    expect(res.headers.get('location')).toBe('/log?a=1');
  });
});
