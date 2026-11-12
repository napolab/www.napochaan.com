import { describe, expect, it } from 'vitest';

import { buildWorkMarkdown } from '.';

import type { SerializedEditorState } from '@payloadcms/richtext-lexical/lexical';
import type { WorkRow } from '../work-row';

const BASE = 'https://example.com';
const body = { root: { children: [{ type: 'paragraph', children: [{ type: 'text', text: '制作の話', format: 0 }] }] } } as unknown as SerializedEditorState;

describe('buildWorkMarkdown', () => {
  it('renders frontmatter (with date), H1, description, and body', () => {
    const work: WorkRow = { id: '1', slug: 'vj-tools', no: '01', title: 'VJ tools', type: 'software', year: 2026, date: '2026-03-01', description: 'VJ 用ツール群', body };
    expect(buildWorkMarkdown(work, BASE)).toBe(
      [
        '---',
        'title: "VJ tools"',
        'type: "software"',
        'year: 2026',
        'date: "2026-03-01"',
        'url: "https://example.com/works/vj-tools"',
        '---',
        '',
        '# VJ tools',
        '',
        'VJ 用ツール群',
        '',
        '制作の話',
        '',
      ].join('\n'),
    );
  });

  it('omits date/description/body when absent', () => {
    const work: WorkRow = { id: '2', slug: 'flyer', no: '02', title: 'フライヤー', type: 'design', year: 2025 };
    expect(buildWorkMarkdown(work, BASE)).toBe(['---', 'title: "フライヤー"', 'type: "design"', 'year: 2025', 'url: "https://example.com/works/flyer"', '---', '', '# フライヤー', ''].join('\n'));
  });
});
