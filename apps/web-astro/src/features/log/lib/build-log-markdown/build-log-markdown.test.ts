import { describe, expect, it } from 'vitest';

import { buildLogMarkdown } from '.';

import type { LogYearGroup } from '../build-log-timeline';

const BASE = 'https://example.com';

describe('buildLogMarkdown', () => {
  it('renders year sections with linked and plain entries', () => {
    const groups: readonly LogYearGroup[] = [
      {
        year: 2026,
        items: [
          { id: 'work-1', year: 2026, date: '03.01 (日)', meta: 'software', title: 'VJ tools', upcoming: false, href: '/works/vj-tools' },
          { id: 'post-1', year: 2026, date: '02.01 (日)', meta: 'zenn', title: '記事', upcoming: false, href: 'https://zenn.dev/x' },
          { id: 'log-1', year: 2026, date: '01.01 (木)', meta: 'gig', title: '出演', upcoming: false },
        ],
      },
      { year: 2025, items: [{ id: 'log-2', year: 2025, date: '12.31 (水)', meta: 'gig', title: '年末', upcoming: false }] },
    ];
    expect(buildLogMarkdown(groups, BASE)).toBe(
      [
        '# log',
        '',
        '## 2026',
        '',
        '- 03.01 (日) — [VJ tools](https://example.com/works/vj-tools) (software)',
        '- 02.01 (日) — [記事](https://zenn.dev/x) (zenn)',
        '- 01.01 (木) — 出演 (gig)',
        '',
        '## 2025',
        '',
        '- 12.31 (水) — 年末 (gig)',
        '',
      ].join('\n'),
    );
  });

  it('renders an empty-state line when there are no groups', () => {
    expect(buildLogMarkdown([], BASE)).toBe('# log\n\nNo entries yet.\n');
  });
});
