import { describe, expect, it } from 'vitest';

import { buildNewsItemMarkdown } from '.';

import type { SerializedEditorState } from '@payloadcms/richtext-lexical/lexical';
import type { NewsItem } from '../news-item';

const BASE = 'https://example.com';
const body = { root: { children: [{ type: 'paragraph', children: [{ type: 'text', text: 'お知らせ本文', format: 0 }] }] } } as unknown as SerializedEditorState;

describe('buildNewsItemMarkdown', () => {
  it('renders frontmatter with category, H1, and body', () => {
    const item: NewsItem = { id: '1', slug: 'gig-0801', date: '2026-08-01', category: 'gig', title: '出演告知', body };
    expect(buildNewsItemMarkdown(item, BASE)).toBe(
      ['---', 'title: "出演告知"', 'date: "2026-08-01"', 'category: "gig"', 'url: "https://example.com/news/gig-0801"', '---', '', '# 出演告知', '', 'お知らせ本文', ''].join('\n'),
    );
  });

  it('renders frontmatter + H1 only when the body is absent', () => {
    const item: NewsItem = { id: '2', slug: 'short', date: '2026-08-02', category: 'info', title: '短報' };
    expect(buildNewsItemMarkdown(item, BASE)).toBe(['---', 'title: "短報"', 'date: "2026-08-02"', 'category: "info"', 'url: "https://example.com/news/short"', '---', '', '# 短報', ''].join('\n'));
  });
});
