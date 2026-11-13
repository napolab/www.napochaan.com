import { describe, expect, it } from 'vitest';

import { renderComponent } from '../../../../test-utils/astro-container';
import { renderReactMarkup, stripIslands } from '../../../../test-utils/island-parity';
import Twin from './news-archive.astro';
import { NewsArchive } from './index';

const groups = [
  {
    key: '2026-06',
    label: '2026 / 06',
    items: [
      { id: '1', slug: 'site-renewal', date: '2026-06-05', category: 'site', title: 'サイトを全面リニューアル' },
      { id: '2', slug: 'ext', date: '2026-06-01', category: 'live', title: 'Booth²Booth 出演決定', url: 'https://x.com/status/1' },
    ],
  },
  {
    key: '2026-05',
    label: '2026 / 05',
    items: [{ id: '3', slug: 'works-page', date: '2026-05-23', category: 'release', title: 'works ページ公開', url: '/works' }],
  },
];

describe('news-archive.astro', () => {
  it('renders the same markup as the NewsArchive Server Component', async () => {
    const html = await renderComponent(Twin, { props: { groups } });
    expect(stripIslands(html)).toBe(renderReactMarkup(NewsArchive, { groups }));
  });

  it('hydrates only the row titles (ScrambleText leaves)', async () => {
    const html = await renderComponent(Twin, { props: { groups } });
    expect([...html.matchAll(/component-export="([^"]+)"/g)].map((match) => match[1])).toEqual(['ScrambleTextIsland', 'ScrambleTextIsland', 'ScrambleTextIsland']);
  });
});
