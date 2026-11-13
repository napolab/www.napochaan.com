import { describe, expect, it, vi } from 'vitest';

import { logManual, logPosts, logWorks } from './log-fixtures';
import LogPage from '../log.astro';
import { ORIGIN, renderPage } from '../../test-utils/astro-container';
import { CLIENT_LEAF_ISLANDS, mainIslandsOf } from '../../test-utils/island-parity';

vi.mock('@utils/request-url', () => ({ getRequestOrigin: async () => ORIGIN }));
vi.mock('@lib/cms/works', () => ({ findWorksList: vi.fn(async () => logWorks) }));
vi.mock('@lib/cms/logs', () => ({ findLogList: vi.fn(async () => logManual) }));
vi.mock('../../features/log/lib/fetch-external-posts', () => ({ fetchExternalPosts: vi.fn(async () => logPosts) }));

const render = async (): Promise<string> => (await renderPage(LogPage, '/log')).text();

describe('/log', () => {
  it('titles the page and links its feed and markdown twin', async () => {
    const html = await render();
    expect(html).toContain('<title>log — napochaan</title>');
    expect(html).toContain('<meta name="description" content="活動年表 — DJ・VJ・リリース・制作物の記録。"');
    expect(html).toContain('<link rel="canonical" href="http://localhost:8788/log"');
    expect(html).toContain('<link rel="alternate" type="application/rss+xml" href="http://localhost:8788/log/rss.xml" title="napochaan — log"');
    expect(html).toContain('<link rel="alternate" type="text/markdown" href="http://localhost:8788/log.md" title="log"');
  });

  it('renders the header, the feed link and one h2 per year, newest first', async () => {
    const html = await render();
    expect(html).toMatch(/<main id="main-content" class="[^"]+">/);
    expect(html.match(/<h1[\s>]/g)).toHaveLength(1);
    expect(html).toContain('進捗どうですか？');
    expect(html).toContain('href="/log/rss.xml"');
    const years = [...html.matchAll(/<h2 class="[^"]+">(\d{4})<\/h2>/g)].map((match) => match[1]);
    expect(years).toEqual(['2099', '2025', '2024']);
  });

  it('links entries to their works page or off-site url', async () => {
    const html = await render();
    expect(html).toContain('href="/works/vj-tools"');
    expect(html).toContain('href="https://zenn.dev/napochaan/articles/x"');
    expect(html).toContain('href="https://example.com/past"');
    expect(html).toContain('future gig');
  });

  it('places the calendar trigger before the feed link and server-renders no calendar grid', async () => {
    const html = await render();
    const main = html.slice(html.indexOf('<main'), html.indexOf('</main>'));
    expect(main).toContain('aria-label="活動カレンダーを表示"');
    expect(main.indexOf('活動カレンダーを表示')).toBeLessThan(main.indexOf('href="/log/rss.xml"'));
    // The popover is closed on the server: "today" is only ever computed in the browser.
    expect(main).not.toContain('role="grid"');
    expect(main).not.toContain('role="dialog"');
  });

  it('hydrates only client leaves inside main, with the calendar as an island', async () => {
    const islands = mainIslandsOf(await render());
    expect(islands).toContain('LogCalendarIsland');
    expect(islands.filter((name) => !CLIENT_LEAF_ISLANDS.has(name))).toEqual([]);
  });
});
