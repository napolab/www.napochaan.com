import { describe, expect, it, vi } from 'vitest';

import * as privacyMarkdown from '../privacy.md';
import { privacy } from '../../features/privacy/content';
import { buildPrivacyMarkdown } from '../../features/privacy/lib/build-privacy-markdown';
import { renderEndpoint } from '../../test-utils/astro-container';

import type { AstroComponentFactory } from 'astro/runtime/server/index.js';

describe('/privacy.md', () => {
  it('serves buildPrivacyMarkdown as text/markdown', async () => {
    // vitest mirrors Vite's `BASE_URL` ('/') into process.env; the worker gets the
    // site origin from wrangler vars.
    vi.stubEnv('BASE_URL', 'https://napochaan.com');
    const res = await renderEndpoint(privacyMarkdown as unknown as AstroComponentFactory, '/privacy.md');
    expect(res.status).toBe(200);
    expect(res.headers.get('content-type')).toBe('text/markdown; charset=utf-8');
    expect(await res.text()).toBe(buildPrivacyMarkdown(privacy, 'https://napochaan.com'));
  });
});
