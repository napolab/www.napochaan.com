import { describe, expect, it } from 'vitest';

import { buildNewsIndexMarkdown } from '.';

import type { NewsItem } from '../news-item';

const BASE = 'https://example.com';

describe('buildNewsIndexMarkdown', () => {
  it('links internal items to their .md and external items to their url', () => {
    const items: readonly NewsItem[] = [
      { id: '1', slug: 'internal', date: '2026-08-01', category: 'gig', title: '内部告知' },
      { id: '2', slug: 'external', date: '2026-07-01', category: 'release', title: '外部リリース', url: 'https://booth.pm/x' },
    ];
    expect(buildNewsIndexMarkdown(items, BASE)).toBe(
      ['# news', '', '- 2026-08-01 — [内部告知](https://example.com/news/internal.md) (gig)', '- 2026-07-01 — [外部リリース](https://booth.pm/x) (release)', ''].join('\n'),
    );
  });

  it('renders an empty-state line when there is no news', () => {
    expect(buildNewsIndexMarkdown([], BASE)).toBe('# news\n\nNo entries yet.\n');
  });
});
