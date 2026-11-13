import { describe, expect, it, vi } from 'vitest';

import { logManual, logPosts, logWorks } from './log-fixtures';
import * as logMarkdown from '../log.md';
import * as rss from '../log/rss.xml';
import { renderEndpoint } from '../../test-utils/astro-container';

import type { AstroComponentFactory } from 'astro/runtime/server/index.js';

vi.mock('@lib/cms/works', () => ({ findWorksList: vi.fn(async () => logWorks) }));
vi.mock('@lib/cms/logs', () => ({ findLogList: vi.fn(async () => logManual) }));
vi.mock('../../features/log/lib/fetch-external-posts', () => ({ fetchExternalPosts: vi.fn(async () => logPosts) }));

const endpoint = (module: unknown) => module as AstroComponentFactory;
const BASE = 'https://napochaan.com';

describe('/log.md', () => {
  it('serves the chronicle as markdown with absolute internal links', async () => {
    vi.stubEnv('BASE_URL', BASE);
    const res = await renderEndpoint(endpoint(logMarkdown), '/log.md');
    expect(res.status).toBe(200);
    expect(res.headers.get('content-type')).toBe('text/markdown; charset=utf-8');
    const body = await res.text();
    expect(body.startsWith('# log\n')).toBe(true);
    expect(body).toContain('## 2099');
    expect(body).toContain('[VJ tools](https://napochaan.com/works/vj-tools) (software)');
    expect(body).toContain('— future gig (gig)');
  });
});

describe('/log/rss.xml', () => {
  it('serves the chronicle feed', async () => {
    vi.stubEnv('BASE_URL', BASE);
    const res = await renderEndpoint(endpoint(rss), '/log/rss.xml');
    expect(res.status).toBe(200);
    expect(res.headers.get('content-type')).toBe('application/rss+xml; charset=utf-8');
    const xml = await res.text();
    expect(xml).toContain('<title>napochaan — log</title>');
    expect(xml).toContain('<link>https://napochaan.com/works/vj-tools</link>');
    expect(xml).toContain('https://napochaan.com/log#log-l1</guid>');
  });
});
