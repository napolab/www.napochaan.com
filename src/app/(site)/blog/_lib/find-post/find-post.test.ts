import { describe, expect, it } from 'vitest';

import { findPost } from './index';

import type { Post } from '../post';

const post = (id: string): Post => ({ id, slug: `post-${id}`, index: id, title: `t${id}`, readMin: 1, date: '2026-01-01', excerpt: '' });

describe('findPost', () => {
  it('returns the post matching the slug', () => {
    const posts = [post('1'), post('2')];
    expect(findPost(posts, 'post-2')?.slug).toBe('post-2');
  });

  it('returns undefined when no post matches', () => {
    expect(findPost([post('1')], 'post-9')).toBeUndefined();
  });

  it('returns undefined for an empty feed', () => {
    expect(findPost([], 'post-1')).toBeUndefined();
  });
});
