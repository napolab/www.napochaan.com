import { describe, expect, it } from 'vitest';

import { buildBlogIndexMarkdown } from '.';

import type { Post } from '../post';

const BASE = 'https://example.com';

const post = (slug: string, title: string, date: string, excerpt: string): Post => ({ id: slug, slug, index: '01', title, readMin: 3, date, excerpt });

describe('buildBlogIndexMarkdown', () => {
  it('renders a heading and one linked line per post', () => {
    const posts = [post('b', '記事B', '2026-02-01', '概要B'), post('a', '記事A', '2026-01-01', '概要A')];
    expect(buildBlogIndexMarkdown(posts, BASE)).toBe(
      ['# blog', '', '- 2026-02-01 — [記事B](https://example.com/blog/b.md) — 概要B', '- 2026-01-01 — [記事A](https://example.com/blog/a.md) — 概要A', ''].join('\n'),
    );
  });

  it('renders an empty-state line when there are no posts', () => {
    expect(buildBlogIndexMarkdown([], BASE)).toBe('# blog\n\nNo entries yet.\n');
  });
});
