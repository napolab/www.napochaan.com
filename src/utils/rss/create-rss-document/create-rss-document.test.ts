import { describe, expect, it } from 'vitest';

import { createRssDocument } from '.';

import type { ChannelData, ItemData } from '../types';

const channel = (overrides: Partial<ChannelData> = {}): ChannelData => ({
  title: 'napochaan — news',
  link: 'https://www.napochaan.com/news',
  description: 'napochaan のお知らせ — 制作・出演・公開のアナウンス。',
  ...overrides,
});

const item = (overrides: Partial<ItemData> = {}): ItemData => ({
  title: 'sample',
  link: 'https://www.napochaan.com/news/abc',
  ...overrides,
});

describe('createRssDocument', () => {
  it('starts with the XML declaration and a namespaced rss root', () => {
    const xml = createRssDocument({ channel: channel(), items: [] });

    expect(xml.startsWith('<?xml version="1.0" encoding="UTF-8"?>')).toBe(true);
    expect(xml).toContain('xmlns:atom="http://www.w3.org/2005/Atom"');
  });

  it('renders the channel title, link and description', () => {
    const xml = createRssDocument({ channel: channel(), items: [] });

    expect(xml).toContain('<title>napochaan — news</title>');
    expect(xml).toContain('<link>https://www.napochaan.com/news</link>');
    expect(xml).toContain('<description>napochaan のお知らせ — 制作・出演・公開のアナウンス。</description>');
  });

  it('yields a valid channel with no item for an empty feed', () => {
    const xml = createRssDocument({ channel: channel(), items: [] });

    expect(xml).toContain('<rss');
    expect(xml).toContain('<channel>');
    expect(xml).not.toContain('<item>');
  });

  it('emits the optional language element only when set', () => {
    expect(createRssDocument({ channel: channel({ language: 'ja' }), items: [] })).toContain('<language>ja</language>');
    expect(createRssDocument({ channel: channel(), items: [] })).not.toContain('<language>');
  });

  it('emits the atom self link only when selfUrl is set', () => {
    const xml = createRssDocument({ channel: channel({ selfUrl: 'https://www.napochaan.com/news/rss.xml' }), items: [] });

    expect(xml).toContain('<atom:link href="https://www.napochaan.com/news/rss.xml" rel="self" type="application/rss+xml"/>');
  });

  it('omits the atom self link when selfUrl is absent', () => {
    expect(createRssDocument({ channel: channel(), items: [] })).not.toContain('<atom:link');
  });

  it('renders lastBuildDate as RFC-822 when set, and omits it when absent', () => {
    const withDate = createRssDocument({ channel: channel({ lastBuildDate: '2026-03-03' }), items: [] });
    expect(withDate).toMatch(/<lastBuildDate>\w{3}, 03 Mar 2026 \d{2}:\d{2}:\d{2} [+-]\d{4}<\/lastBuildDate>/);

    expect(createRssDocument({ channel: channel(), items: [] })).not.toContain('<lastBuildDate>');
  });

  it('escapes & and < in an item title', () => {
    const xml = createRssDocument({ channel: channel(), items: [item({ title: 'rock & <roll>' })] });

    expect(xml).toContain('<title>rock &amp; &lt;roll&gt;</title>');
    expect(xml).not.toContain('<title>rock & <roll></title>');
  });

  it('emits guid only when set, with isPermaLink="false"', () => {
    const xml = createRssDocument({ channel: channel(), items: [item({ guid: 'https://www.napochaan.com/news/abc' })] });
    expect(xml).toContain('<guid isPermaLink="false">https://www.napochaan.com/news/abc</guid>');

    const without = createRssDocument({ channel: channel(), items: [item()] });
    expect(without).not.toContain('<guid');
  });

  it('renders an RFC-822 pubDate only when set', () => {
    const xml = createRssDocument({ channel: channel(), items: [item({ pubDate: '2026-01-01' })] });
    expect(xml).toMatch(/<pubDate>\w{3}, \d{2} \w{3} \d{4} \d{2}:\d{2}:\d{2} [+-]\d{4}<\/pubDate>/);

    expect(createRssDocument({ channel: channel(), items: [item()] })).not.toContain('<pubDate>');
  });

  it('emits category and description only when set, escaping them', () => {
    const xml = createRssDocument({ channel: channel(), items: [item({ category: 'release', description: 'a & b' })] });
    expect(xml).toContain('<category>release</category>');
    expect(xml).toContain('<description>a &amp; b</description>');

    const without = createRssDocument({ channel: channel({ description: 'plain' }), items: [item()] });
    expect(without).not.toContain('<category>');
    // The channel always carries a description; only the item-level one is omitted.
    expect(without).toContain('      <link>https://www.napochaan.com/news/abc</link>\n    </item>');
  });
});
