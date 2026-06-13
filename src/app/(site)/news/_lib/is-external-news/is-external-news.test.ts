import { describe, expect, it } from 'vitest';

import { isExternalNews } from './index';

import type { NewsItem } from '../news-item';

const internal: NewsItem = { id: '1', date: '2026-06-05', category: 'notification', title: 'a' };
const external: NewsItem = { ...internal, id: '2', url: 'https://example.com' };

describe('isExternalNews', () => {
  it('returns true when an external url is set', () => {
    expect(isExternalNews(external)).toBe(true);
  });

  it('returns false when no url is set', () => {
    expect(isExternalNews(internal)).toBe(false);
  });
});
