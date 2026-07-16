import { describe, expect, it } from 'vitest';

import { buildWorksIndexMarkdown } from '.';

import type { WorkRow } from '../work-row';

const BASE = 'https://example.com';

describe('buildWorksIndexMarkdown', () => {
  it('renders one linked line per work', () => {
    const works: readonly WorkRow[] = [
      { id: '1', slug: 'vj-tools', no: '01', title: 'VJ tools', type: 'software', year: 2026 },
      { id: '2', slug: 'flyer', no: '02', title: 'フライヤー', type: 'design', year: 2025 },
    ];
    expect(buildWorksIndexMarkdown(works, BASE)).toBe(
      ['# works', '', '- [VJ tools](https://example.com/works/vj-tools.md) — software · 2026', '- [フライヤー](https://example.com/works/flyer.md) — design · 2025', ''].join('\n'),
    );
  });

  it('renders an empty-state line when there are no works', () => {
    expect(buildWorksIndexMarkdown([], BASE)).toBe('# works\n\nNo entries yet.\n');
  });
});
