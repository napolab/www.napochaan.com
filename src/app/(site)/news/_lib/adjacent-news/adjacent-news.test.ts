import { describe, expect, it } from 'vitest';

import { adjacentNews } from './index';

import type { NewsItem } from '../news-item';

// Deliberately out of date order so the helper must sort before pairing.
const news: readonly NewsItem[] = [
  { id: '2', slug: 'news-2', date: '2026-05-23', category: 'live', title: 'b' },
  { id: '1', slug: 'news-1', date: '2026-06-05', category: 'site', title: 'a' },
  { id: '3', slug: 'news-3', date: '2026-04-04', category: 'blog', title: 'c' },
];

describe('adjacentNews', () => {
  it('pairs a middle item with its newer (prev) and older (next) neighbours', () => {
    const { prev, next } = adjacentNews(news, '2');

    expect(prev?.id).toBe('1');
    expect(next?.id).toBe('3');
  });

  it('has no prev at the newest item', () => {
    const { prev, next } = adjacentNews(news, '1');

    expect(prev).toBeUndefined();
    expect(next?.id).toBe('2');
  });

  it('has no next at the oldest item', () => {
    const { prev, next } = adjacentNews(news, '3');

    expect(prev?.id).toBe('2');
    expect(next).toBeUndefined();
  });

  it('returns both undefined when the id is absent', () => {
    const { prev, next } = adjacentNews(news, '99');

    expect(prev).toBeUndefined();
    expect(next).toBeUndefined();
  });

  it('returns both undefined for an empty list', () => {
    const { prev, next } = adjacentNews([], '1');

    expect(prev).toBeUndefined();
    expect(next).toBeUndefined();
  });
});
