import { describe, expect, it } from 'vitest';

import { adjacentPosts } from './index';

import type { Post } from '../post';

const post = (id: string, date: string): Post => ({ id, slug: `post-${id}`, index: id, title: `t${id}`, readMin: 1, date, excerpt: '' });

// Feed deliberately out of order to prove the helper sorts by date descending.
const feed = [post('b', '2026-01-01'), post('a', '2026-03-01'), post('c', '2025-12-01')];

describe('adjacentPosts', () => {
  it('returns the newer neighbour as prev and the older neighbour as next', () => {
    const { prev, next } = adjacentPosts(feed, 'post-b');
    expect(prev?.slug).toBe('post-a');
    expect(next?.slug).toBe('post-c');
  });

  it('has no prev for the newest post', () => {
    const { prev, next } = adjacentPosts(feed, 'post-a');
    expect(prev).toBeUndefined();
    expect(next?.slug).toBe('post-b');
  });

  it('has no next for the oldest post', () => {
    const { prev, next } = adjacentPosts(feed, 'post-c');
    expect(prev?.slug).toBe('post-b');
    expect(next).toBeUndefined();
  });

  it('returns empty when the slug is absent', () => {
    expect(adjacentPosts(feed, 'post-x')).toEqual({});
  });
});
