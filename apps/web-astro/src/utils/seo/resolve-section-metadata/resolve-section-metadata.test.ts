import { describe, expect, it } from 'vitest';

import { resolveSectionMetadata } from '.';

describe('resolveSectionMetadata', () => {
  it('returns the bare docTitle so the root template appends the suffix', () => {
    const meta = resolveSectionMetadata({ docTitle: 'about', path: '/about' });

    expect(meta.title).toBe('about');
  });

  it('uses the display title (docTitle + suffix) in og and twitter', () => {
    const meta = resolveSectionMetadata({ docTitle: 'about', path: '/about' });

    expect(meta.openGraph?.title).toBe('about — napochaan');
    expect(meta.twitter?.title).toBe('about — napochaan');
  });

  it('passes the description through to top-level, og, and twitter', () => {
    const meta = resolveSectionMetadata({ docTitle: 'about', path: '/about', description: '紹介文' });

    expect(meta.description).toBe('紹介文');
    expect(meta.openGraph?.description).toBe('紹介文');
    expect(meta.twitter?.description).toBe('紹介文');
  });

  it('defaults og/twitter images to the shared OG card', () => {
    const meta = resolveSectionMetadata({ docTitle: 'about', path: '/about' });

    expect(meta.openGraph?.images).toEqual([{ url: '/og-default.png' }]);
    expect(meta.twitter?.images).toEqual(['/og-default.png']);
  });

  it('overrides the image when a custom one is provided', () => {
    const meta = resolveSectionMetadata({ docTitle: 'about', path: '/about', image: '/media/custom.png' });

    expect(meta.openGraph?.images).toEqual([{ url: '/media/custom.png' }]);
    expect(meta.twitter?.images).toEqual(['/media/custom.png']);
  });

  it('restores the shared og fields wiped by shallow metadata merging', () => {
    const meta = resolveSectionMetadata({ docTitle: 'works', path: '/works' });

    expect(meta.openGraph && 'type' in meta.openGraph ? meta.openGraph.type : undefined).toBe('website');
    expect(meta.openGraph?.siteName).toBe('napochaan');
    expect(meta.openGraph?.locale).toBe('ja_JP');
    expect(meta.openGraph?.url).toBe('/works');
  });

  it('sets the twitter card to summary_large_image', () => {
    const meta = resolveSectionMetadata({ docTitle: 'works', path: '/works' });

    expect(meta.twitter && 'card' in meta.twitter ? meta.twitter.card : undefined).toBe('summary_large_image');
  });

  it('sets the canonical to the path', () => {
    const meta = resolveSectionMetadata({ docTitle: 'works', path: '/works' });

    expect(meta.alternates?.canonical).toBe('/works');
  });

  it('surfaces the feed via alternates.types when provided', () => {
    const meta = resolveSectionMetadata({
      docTitle: 'works',
      path: '/works',
      feed: { url: '/works/rss.xml', title: 'napochaan — works' },
    });

    expect(meta.alternates?.types?.['application/rss+xml']).toEqual([{ url: '/works/rss.xml', title: 'napochaan — works' }]);
  });

  it('omits the types key entirely when no feed is provided', () => {
    const meta = resolveSectionMetadata({ docTitle: 'about', path: '/about' });

    expect(meta.alternates?.types).toBeUndefined();
    expect(meta.alternates && 'types' in meta.alternates).toBe(false);
  });

  it('adds a text/markdown alternate when markdown is given', () => {
    const result = resolveSectionMetadata({ docTitle: 'blog', path: '/blog', markdown: '/blog.md' });
    expect(result.alternates?.types).toMatchObject({ 'text/markdown': [{ url: '/blog.md', title: 'blog' }] });
    // canonical is preserved
    expect(result.alternates?.canonical).toBe('/blog');
  });

  it('keeps the rss alternate alongside the markdown one', () => {
    const result = resolveSectionMetadata({ docTitle: 'blog', path: '/blog', feed: { url: '/blog/rss.xml', title: 'blog feed' }, markdown: '/blog.md' });
    expect(result.alternates?.types).toMatchObject({
      'application/rss+xml': [{ url: '/blog/rss.xml', title: 'blog feed' }],
      'text/markdown': [{ url: '/blog.md', title: 'blog' }],
    });
  });
});
