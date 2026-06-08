import { describe, expect, it } from 'vitest';

import { toBlogPost } from './index';

import type { Blog } from '@payload-types';

// A lexical body with ~10 chars of text → readingMinutes returns 1 (min).
const body = {
  root: { type: 'root', children: [{ type: 'paragraph', children: [{ type: 'text', text: '十文字ほどの本文' }] }] },
} as unknown as Blog['body'];

const base = {
  id: 3,
  title: 'Panda CSS で作る design token',
  source: 'zenn',
  publishedAt: '2026-05-10T00:00:00.000Z',
  excerpt: 'OKLCH の話',
  body,
  updatedAt: '',
  createdAt: '',
} as unknown as Blog;

describe('toBlogPost', () => {
  it('maps fields, stringifies id, formats date as YYYY-MM-DD', () => {
    const post = toBlogPost(base, '02');
    expect(post.id).toBe('3');
    expect(post.index).toBe('02');
    expect(post.title).toBe('Panda CSS で作る design token');
    expect(post.source).toBe('zenn');
    expect(post.date).toBe('2026-05-10');
    expect(post.excerpt).toBe('OKLCH の話');
  });

  it('derives readMin from the body (minimum 1)', () => {
    expect(toBlogPost(base, '01').readMin).toBe(1);
  });
});
