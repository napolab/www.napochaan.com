import { describe, expect, it } from 'vitest';

import { buildPostMarkdown } from '.';

import type { SerializedEditorState } from '@payloadcms/richtext-lexical/lexical';
import type { Post } from '../post';

const BASE = 'https://example.com';

const body = { root: { children: [{ type: 'paragraph', children: [{ type: 'text', text: '本文です', format: 0 }] }] } } as unknown as SerializedEditorState;

const post: Post = { id: '1', slug: 'v3-renewal', index: '01', title: 'v3.0.0 制作記', readMin: 5, date: '2026-01-01', excerpt: 'リニューアルの記録', body };

describe('buildPostMarkdown', () => {
  it('renders frontmatter, H1 title, and converted body', () => {
    expect(buildPostMarkdown(post, BASE)).toBe(
      [
        '---',
        'title: "v3.0.0 制作記"',
        'date: "2026-01-01"',
        'url: "https://example.com/blog/v3-renewal"',
        'excerpt: "リニューアルの記録"',
        'readMin: 5',
        '---',
        '',
        '# v3.0.0 制作記',
        '',
        '本文です',
        '',
      ].join('\n'),
    );
  });

  it('falls back to the excerpt when the body is absent', () => {
    const teaser: Post = { ...post, body: undefined };
    expect(buildPostMarkdown(teaser, BASE)).toContain('# v3.0.0 制作記\n\nリニューアルの記録\n');
  });
});
