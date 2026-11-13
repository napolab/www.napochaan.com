import { describe, expect, it } from 'vitest';

import { blogPageHref, PAGE_SIZE, paginatePosts } from './index';

import type { Post } from '../../post';

const post = (n: number): Post => ({
  id: `${n}`,
  slug: `post-${n}`,
  index: `${n}`.padStart(2, '0'),
  title: `post ${n}`,
  readMin: 1,
  date: `2026-01-${`${n}`.padStart(2, '0')}`,
  excerpt: '',
});

const feed = Array.from({ length: 23 }, (_, i) => post(i + 1));

describe('paginatePosts', () => {
  it('sorts newest first and slices PAGE_SIZE per page', () => {
    const first = paginatePosts(feed, 1);
    expect(first?.posts.map((p) => p.slug)).toEqual(
      feed
        .slice(-PAGE_SIZE)
        .map((p) => p.slug)
        .reverse(),
    );
    expect(first?.totalPages).toBe(3);
    expect(paginatePosts(feed, 3)?.posts.map((p) => p.slug)).toEqual(['post-3', 'post-2', 'post-1']);
  });

  it('returns undefined past the last page', () => {
    expect(paginatePosts(feed, 4)).toBeUndefined();
  });

  it('keeps page 1 for an empty feed', () => {
    expect(paginatePosts([], 1)).toEqual({ posts: [], current: 1, totalPages: 1 });
  });
});

describe('blogPageHref', () => {
  it('keeps page 1 on the bare path', () => {
    expect(blogPageHref(1)).toBe('/blog');
    expect(blogPageHref(2)).toBe('/blog/page/2');
  });
});
