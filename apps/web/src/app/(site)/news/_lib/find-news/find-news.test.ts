import { describe, expect, it } from 'vitest';

import { findNews } from './index';

import type { NewsItem } from '../news-item';

const news: readonly NewsItem[] = [
  { id: '1', slug: 'news-1', date: '2026-06-05', category: 'site', title: 'a' },
  { id: '2', slug: 'news-2', date: '2026-05-23', category: 'live', title: 'b' },
];

describe('findNews', () => {
  it('returns the item matching the slug', () => {
    expect(findNews(news, 'news-2')?.title).toBe('b');
  });

  it('returns undefined when no item matches', () => {
    expect(findNews(news, 'news-99')).toBeUndefined();
  });

  it('returns undefined for an empty list', () => {
    expect(findNews([], 'news-1')).toBeUndefined();
  });
});
