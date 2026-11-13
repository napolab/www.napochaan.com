import { describe, expect, it } from 'vitest';

import { buildBlogRSS } from './index';

import type { Post } from '../../post';

const post: Post = { id: '1', slug: 'a.b', index: '01', title: 'T & U', readMin: 2, date: '2026-05-10', excerpt: 'ex' };

describe('buildBlogRSS', () => {
  it('links each item and the channel under the origin', () => {
    const xml = buildBlogRSS([post], 'https://napochaan.com');
    expect(xml).toContain('<title>napochaan — blog</title>');
    expect(xml).toContain('<link>https://napochaan.com/blog/a.b</link>');
    expect(xml).toContain('https://napochaan.com/blog/rss.xml');
    expect(xml).toContain('T &amp; U');
  });

  it('builds an empty channel', () => {
    expect(buildBlogRSS([], 'https://napochaan.com')).not.toContain('<item>');
  });
});
