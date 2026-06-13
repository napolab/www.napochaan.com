import { describe, expect, it } from 'vitest';

import { toItemData } from '.';

import { richTextFromParagraphs } from '@utils/sample-rich-text';

import type { NewsItem } from '../../_lib/news-item';

const ORIGIN = 'https://www.napochaan.com';

const item = (overrides: Partial<NewsItem> = {}): NewsItem => ({
  id: 'abc',
  slug: 'sample-news',
  date: '2026-01-01',
  category: 'release',
  title: 'sample',
  ...overrides,
});

describe('toItemData', () => {
  it('maps the title, pubDate and category straight through', () => {
    const data = toItemData({ item: item(), origin: ORIGIN });

    expect(data.title).toBe('sample');
    expect(data.pubDate).toBe('2026-01-01');
    expect(data.category).toBe('release');
  });

  it('uses the external url for link but keeps the internal permalink as guid', () => {
    const data = toItemData({ item: item({ url: 'https://external.example/post' }), origin: ORIGIN });

    expect(data.link).toBe('https://external.example/post');
    expect(data.guid).toBe(`${ORIGIN}/news/sample-news`);
  });

  it('falls back to the internal permalink for link when url is absent', () => {
    const data = toItemData({ item: item(), origin: ORIGIN });

    expect(data.link).toBe(`${ORIGIN}/news/sample-news`);
  });

  it('absolutizes an internal relative url override against the origin', () => {
    const data = toItemData({ item: item({ url: '/works' }), origin: ORIGIN });

    expect(data.link).toBe(`${ORIGIN}/works`);
  });

  it('renders the body excerpt as the description', () => {
    const data = toItemData({ item: item({ body: richTextFromParagraphs(['hello world']) }), origin: ORIGIN });

    expect(data.description).toBe('hello world');
  });

  it('emits an empty description when the item has no body', () => {
    const data = toItemData({ item: item(), origin: ORIGIN });

    expect(data.description).toBe('');
  });
});
