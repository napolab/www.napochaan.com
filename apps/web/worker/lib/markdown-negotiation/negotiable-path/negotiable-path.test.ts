import { describe, expect, it } from 'vitest';

import { OG_IMAGE_ROUTE_SUFFIX } from '../../../../src/utils/og/og-image-route';

import { isNegotiablePath } from './index';

describe('isNegotiablePath', () => {
  it.each(['/', '/about', '/about/', '/blog', '/blog/hello', '/blog/page/2', '/gallery', '/contact', '/log', '/colophon', '/privacy'])('negotiates GET %s', (pathname) => {
    expect(isNegotiablePath({ method: 'GET', pathname })).toBe(true);
  });

  it('negotiates HEAD', () => {
    expect(isNegotiablePath({ method: 'HEAD', pathname: '/about' })).toBe(true);
  });

  it.each(['POST', 'PUT', 'DELETE', 'OPTIONS'])('never negotiates %s', (method) => {
    expect(isNegotiablePath({ method, pathname: '/contact' })).toBe(false);
  });

  // Paths with an extension are already a representation of their own (twins, feeds, OG images).
  it.each(['/about.md', '/llms.txt', '/sitemap.xml', '/blog/rss.xml', '/robots.txt'])('leaves %s alone', (pathname) => {
    expect(isNegotiablePath({ method: 'GET', pathname })).toBe(false);
  });

  // Only `page`-kind paths: drafts (deny), api, and Astro internals (keep) are never negotiated.
  it.each(['/blog/preview/1', '/news/preview', '/api/cursors', '/api/media/file/a', '/next/preview', '/_actions/submit', '/_server-islands/x', '/%62log/preview/1', '/_image', '/_next/image'])(
    'leaves non-page path %s alone',
    (pathname) => {
      expect(isNegotiablePath({ method: 'GET', pathname })).toBe(false);
    },
  );

  // OG images are extension-less routes but images, never pages with a Markdown twin
  // (varying them on Accept would split the image cache per crawler Accept value).
  it.each(Object.entries(OG_IMAGE_ROUTE_SUFFIX))('leaves the %s OG image route alone', (section, suffix) => {
    expect(isNegotiablePath({ method: 'GET', pathname: `/${section}/hello/opengraph-image-${suffix}` })).toBe(false);
  });

  // Extension-less discovery documents (RFC 9727 / 9728 / 8414) are JSON, never pages with
  // a Markdown twin: no wasted twin render, no `Vary: Accept` splitting their cache.
  it.each(['/.well-known/api-catalog', '/.well-known/oauth-protected-resource', '/.well-known/oauth-authorization-server', '/.%77ell-known/api-catalog'])(
    'leaves the discovery document %s alone',
    (pathname) => {
      expect(isNegotiablePath({ method: 'GET', pathname })).toBe(false);
    },
  );

  it('still negotiates a slug that merely starts like an OG route', () => {
    expect(isNegotiablePath({ method: 'GET', pathname: '/blog/opengraph-image-notes' })).toBe(true);
  });
});
