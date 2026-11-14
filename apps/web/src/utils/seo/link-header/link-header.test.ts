import { describe, expect, it } from 'vitest';

import { resolveDetailMetadata } from '@utils/seo/resolve-detail-metadata';
import { resolveSectionMetadata } from '@utils/seo/resolve-section-metadata';

import { buildLinkHeader } from './index';

const SITE_LINKS = '</llms.txt>; rel="describedby"; type="text/plain", </sitemap.xml>; rel="sitemap"; type="application/xml"';

describe('buildLinkHeader', () => {
  it('points a page without alternates (home) at llms.txt and the sitemap only', () => {
    expect(buildLinkHeader({ alternates: { canonical: '/' } })).toBe(SITE_LINKS);
    expect(buildLinkHeader({})).toBe(SITE_LINKS);
  });

  it('advertises the markdown twin and the feed from the same alternates that feed <link rel="alternate">', () => {
    const metadata = resolveSectionMetadata({ docTitle: 'blog', path: '/blog', feed: { url: '/blog/rss.xml', title: 'napochaan — blog' }, markdown: '/blog.md' });
    expect(buildLinkHeader(metadata)).toBe(`</blog/rss.xml>; rel="alternate"; type="application/rss+xml", </blog.md>; rel="alternate"; type="text/markdown", ${SITE_LINKS}`);
  });

  it('advertises a detail page markdown twin', () => {
    const metadata = resolveDetailMetadata({ docTitle: 'Post', path: '/blog/a.b', genericDescription: '記事', defaultImage: '/og-default.png', markdown: '/blog/a.b.md' });
    expect(buildLinkHeader(metadata)).toBe(`</blog/a.b.md>; rel="alternate"; type="text/markdown", ${SITE_LINKS}`);
  });

  it('stays a valid ASCII header value for a Japanese slug and title (Headers.set throws on non-Latin-1)', () => {
    const metadata = resolveDetailMetadata({ docTitle: '日本語の記事 <b>', path: '/blog/日本語', genericDescription: '記事', defaultImage: '/og-default.png', markdown: '/blog/日本語 x.md' });
    const value = buildLinkHeader(metadata);
    expect(value).toMatch(/^[\x20-\x7e]+$/);
    expect(value).toContain('</blog/%E6%97%A5%E6%9C%AC%E8%AA%9E%20x.md>; rel="alternate"; type="text/markdown"');
    expect(() => new Headers({ Link: value })).not.toThrow();
  });
});
