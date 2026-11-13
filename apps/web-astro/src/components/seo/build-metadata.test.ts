import { describe, expect, it } from 'vitest';

import { resolveDetailMetadata } from '@utils/seo/resolve-detail-metadata';
import { resolveSectionMetadata } from '@utils/seo/resolve-section-metadata';

import { buildMetadata } from './build-metadata';

const PROD = 'https://www.napochaan.com';
const STG = 'https://stg.napochaan.com';

describe('buildMetadata — root defaults (port of the (site) layout generateMetadata)', () => {
  const resolved = buildMetadata({}, PROD);

  it('uses the site name as the default title and the site description', () => {
    expect(resolved.title).toBe('napochaan');
    expect(resolved.description).toBe('napochaan の個人サイト。');
  });

  it('defaults canonical to the origin root', () => {
    expect(resolved.canonical).toBe('https://www.napochaan.com/');
  });

  it('emits the root Open Graph / Twitter card with the default OG image', () => {
    expect(resolved.openGraph).toEqual({
      type: 'website',
      siteName: 'napochaan',
      title: 'napochaan',
      description: 'napochaan の個人サイト。',
      url: 'https://www.napochaan.com/',
      locale: 'ja_JP',
      images: [{ url: 'https://www.napochaan.com/og-default.png', width: 1280, height: 630, type: 'image/png' }],
    });
    expect(resolved.twitter).toEqual({
      card: 'summary_large_image',
      title: 'napochaan',
      description: 'napochaan の個人サイト。',
      images: ['https://www.napochaan.com/og-default.png'],
    });
  });

  it('declares the file-convention icons', () => {
    expect(resolved.icons).toEqual([
      { rel: 'icon', href: '/icon.png', type: 'image/png', sizes: '512x512' },
      { rel: 'apple-touch-icon', href: '/apple-icon.png', type: 'image/png', sizes: '180x180' },
    ]);
  });
});

describe('buildMetadata — robots', () => {
  it('omits robots on a production host', () => {
    expect(buildMetadata({}, PROD).robots).toBeUndefined();
    expect(buildMetadata({}, 'https://napochaan.com').robots).toBeUndefined();
  });

  it('de-indexes every non-production origin', () => {
    expect(buildMetadata({}, STG).robots).toBe('noindex, nofollow');
    expect(buildMetadata({}, 'http://localhost:8788').robots).toBe('noindex, nofollow');
  });

  it('marks a page noindex on production when asked (404 / 500)', () => {
    expect(buildMetadata({ noindex: true }, PROD).robots).toBe('noindex');
    expect(buildMetadata({ noindex: true }, STG).robots).toBe('noindex, nofollow');
  });
});

describe('buildMetadata — title template', () => {
  it('applies `%s — napochaan` to a page title', () => {
    expect(buildMetadata({ title: 'about' }, PROD).title).toBe('about — napochaan');
  });

  it('bypasses the template for an absolute title', () => {
    expect(buildMetadata({ title: { absolute: 'Custom SEO title' } }, PROD).title).toBe('Custom SEO title');
  });

  it('does not template the inherited root og:title (Next only templates `title`)', () => {
    expect(buildMetadata({ title: 'colophon' }, PROD).openGraph.title).toBe('napochaan');
  });
});

describe('buildMetadata — page metadata (resolveSectionMetadata / resolveDetailMetadata output)', () => {
  it('resolves canonical, og:url and alternates against the origin', () => {
    const page = resolveSectionMetadata({
      docTitle: 'blog',
      description: 'blog desc',
      path: '/blog',
      feed: { url: '/blog/rss.xml', title: 'napochaan — blog' },
      markdown: '/blog.md',
    });
    const resolved = buildMetadata(page, STG);

    expect(resolved.title).toBe('blog — napochaan');
    expect(resolved.description).toBe('blog desc');
    expect(resolved.canonical).toBe('https://stg.napochaan.com/blog');
    expect(resolved.openGraph.url).toBe('https://stg.napochaan.com/blog');
    expect(resolved.openGraph.title).toBe('blog — napochaan');
    expect(resolved.openGraph.images).toEqual([{ url: 'https://stg.napochaan.com/og-default.png' }]);
    expect(resolved.twitter.images).toEqual(['https://stg.napochaan.com/og-default.png']);
    expect(resolved.alternates).toEqual([
      { type: 'application/rss+xml', href: 'https://stg.napochaan.com/blog/rss.xml', title: 'napochaan — blog' },
      { type: 'text/markdown', href: 'https://stg.napochaan.com/blog.md', title: 'blog' },
    ]);
  });

  it('replaces the root openGraph wholesale and keeps the default OG image when the page sets none', () => {
    const page = resolveDetailMetadata({
      docTitle: 'Post',
      path: '/blog/post',
      descriptionCandidates: ['excerpt'],
      genericDescription: 'blog',
      defaultImage: '/og-default.png',
      markdown: '/blog/post.md',
    });
    const resolved = buildMetadata(page, PROD);

    expect(resolved.title).toBe('Post — napochaan');
    expect(resolved.openGraph.url).toBe('https://www.napochaan.com/blog/post');
    expect(resolved.openGraph.title).toBe('Post — napochaan');
    expect(resolved.openGraph.description).toBe('excerpt');
    expect(resolved.openGraph.images[0]?.url).toBe('https://www.napochaan.com/og-default.png');
    expect(resolved.twitter.images).toEqual(['https://www.napochaan.com/og-default.png']);
  });

  it('uses a per-page OG image route when one is given (detail opengraph-image)', () => {
    const page = resolveDetailMetadata({ docTitle: 'Post', path: '/blog/post', genericDescription: 'blog', defaultImage: '/og-default.png' });
    const og = page.openGraph;
    if (og === undefined) throw new Error('expected openGraph');
    const resolved = buildMetadata({ ...page, openGraph: { ...og, images: [{ url: '/blog/post/opengraph-image' }] } }, PROD);

    expect(resolved.openGraph.images).toEqual([{ url: 'https://www.napochaan.com/blog/post/opengraph-image' }]);
    // Next fills twitter:image from og:image when the page's twitter card has none.
    expect(resolved.twitter.images).toEqual(['https://www.napochaan.com/blog/post/opengraph-image']);
  });

  it('keeps absolute URLs untouched', () => {
    const resolved = buildMetadata({ alternates: { canonical: 'https://example.com/x' } }, PROD);

    expect(resolved.canonical).toBe('https://example.com/x');
  });

  it('inherits root openGraph when the page only sets title / description (colophon)', () => {
    const resolved = buildMetadata({ title: 'colophon', description: 'how it is made', alternates: { canonical: '/colophon' } }, PROD);

    expect(resolved.description).toBe('how it is made');
    expect(resolved.canonical).toBe('https://www.napochaan.com/colophon');
    expect(resolved.openGraph.description).toBe('napochaan の個人サイト。');
  });
});
