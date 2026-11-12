import { describe, expect, it } from 'vitest';

import { parseFeed } from '.';

// Zenn-style feed: multiple items, CDATA titles, guid present, RFC-822 pubDate.
const ZENN_FEED = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title><![CDATA[naporitan のフィード]]></title>
    <link>https://zenn.dev/naporin24690</link>
    <item>
      <title><![CDATA[TypeScript の話]]></title>
      <link>https://zenn.dev/naporin24690/articles/aaa111</link>
      <guid>https://zenn.dev/naporin24690/articles/aaa111</guid>
      <pubDate>Wed, 31 Dec 2025 16:33:58 GMT</pubDate>
    </item>
    <item>
      <title><![CDATA[Cloudflare Workers の話]]></title>
      <link>https://zenn.dev/naporin24690/articles/bbb222</link>
      <guid>https://zenn.dev/naporin24690/articles/bbb222</guid>
      <pubDate>Mon, 01 Dec 2025 09:00:00 GMT</pubDate>
    </item>
  </channel>
</rss>`;

// Sizu-style feed: a single item (fast-xml-parser yields an object, not an array).
const SIZU_FEED = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title><![CDATA[napochaan のしずく]]></title>
    <link>https://sizu.me/naporin24690</link>
    <item>
      <title><![CDATA[日記 & 雑記]]></title>
      <link>https://sizu.me/naporin24690/posts/zzz999</link>
      <guid>https://sizu.me/naporin24690/posts/zzz999</guid>
      <pubDate>Sun, 15 Jun 2025 03:00:00 GMT</pubDate>
    </item>
  </channel>
</rss>`;

describe('parseFeed', () => {
  it('parses every item from a multi-item (zenn-style) feed', () => {
    const items = parseFeed(ZENN_FEED);

    expect(items).toHaveLength(2);
  });

  it('unwraps a CDATA title, reads the link, and uses guid as the id', () => {
    const [first] = parseFeed(ZENN_FEED);

    expect(first?.title).toBe('TypeScript の話');
    expect(first?.link).toBe('https://zenn.dev/naporin24690/articles/aaa111');
    expect(first?.id).toBe('https://zenn.dev/naporin24690/articles/aaa111');
  });

  it('converts the RFC-822 pubDate to an ISO string', () => {
    const [first] = parseFeed(ZENN_FEED);

    // 2025-12-31 16:33:58 GMT
    expect(first?.date).toBe('2025-12-31T16:33:58.000Z');
  });

  it('handles a single-item (sizu-style) feed by normalizing the object to one item', () => {
    const items = parseFeed(SIZU_FEED);

    expect(items).toHaveLength(1);
    expect(items[0]?.title).toBe('日記 & 雑記');
    expect(items[0]?.link).toBe('https://sizu.me/naporin24690/posts/zzz999');
    expect(items[0]?.id).toBe('https://sizu.me/naporin24690/posts/zzz999');
  });

  it('falls back to the link as the id when guid is absent', () => {
    const feed = `<rss version="2.0"><channel><item><title>no guid</title><link>https://example.com/x</link><pubDate>Sun, 15 Jun 2025 03:00:00 GMT</pubDate></item></channel></rss>`;

    expect(parseFeed(feed)[0]?.id).toBe('https://example.com/x');
  });

  it('skips an item missing a pubDate', () => {
    const feed = `<rss version="2.0"><channel><item><title>dateless</title><link>https://example.com/x</link></item></channel></rss>`;

    expect(parseFeed(feed)).toEqual([]);
  });

  it('skips an item missing a link', () => {
    const feed = `<rss version="2.0"><channel><item><title>linkless</title><pubDate>Sun, 15 Jun 2025 03:00:00 GMT</pubDate></item></channel></rss>`;

    expect(parseFeed(feed)).toEqual([]);
  });

  it('returns [] for malformed XML', () => {
    expect(parseFeed('<rss><channel><item>')).toEqual([]);
  });

  it('returns [] for a feed with no items', () => {
    const feed = `<rss version="2.0"><channel><title>empty</title></channel></rss>`;

    expect(parseFeed(feed)).toEqual([]);
  });
});
