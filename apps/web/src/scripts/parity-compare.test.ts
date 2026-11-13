import { describe, expect, it } from 'vitest';

import {
  applyWhitelist,
  buildRecord,
  classifyCacheControl,
  diffRecords,
  extractHTMLFields,
  normalizeContentType,
  normalizeTextBody,
  pngDimensions,
  stripQuery,
} from '../../scripts/parity/compare.mjs';
import { WHITELIST } from '../../scripts/parity/whitelist.mjs';

const headers = (values: Record<string, string>) => ({ get: (name: string) => values[name.toLowerCase()] ?? null });

describe('classifyCacheControl', () => {
  it.each([
    ['private, no-cache, no-store, max-age=0, must-revalidate', 'uncacheable'],
    ['no-store', 'uncacheable'],
    [null, 'none'],
    ['', 'none'],
  ])('%s → %s', (value, expected) => {
    expect(classifyCacheControl(value)).toBe(expected);
  });

  it('keeps cacheable directives, sorted, so order does not matter', () => {
    expect(classifyCacheControl('s-maxage=31536000, public, max-age=0')).toBe(classifyCacheControl('public, max-age=0, s-maxage=31536000'));
  });

  it('distinguishes different edge lifetimes', () => {
    expect(classifyCacheControl('public, max-age=0, s-maxage=3600')).not.toBe(classifyCacheControl('public, max-age=0, s-maxage=31536000'));
  });
});

describe('normalizeContentType', () => {
  it('ignores case and spacing of parameters', () => {
    expect(normalizeContentType('text/plain;charset=UTF-8')).toBe('text/plain; charset=utf-8');
  });

  it('keeps a missing charset distinct', () => {
    expect(normalizeContentType('text/plain')).not.toBe(normalizeContentType('text/plain; charset=utf-8'));
  });
});

describe('extractHTMLFields', () => {
  const html = `<html><head><title>blog — napochaan</title>
    <meta name="description" content="a &amp; b"/>
    <meta name="robots" content="noindex"/><meta name="robots" content="noindex, nofollow"/>
    <link rel="canonical" href="http://x/blog"/>
    <link rel="alternate" type="application/rss+xml" href="http://x/blog/rss.xml">
    <meta property="og:image" content="http://x/og.png?abc"/>
    <meta name="twitter:image" content='http://x/tw.png'/>
    </head><body><svg><title>icon</title></svg><h1 class="a">blog <span>!</span></h1></body></html>`;

  it('reads the first occurrence of each field, decoding entities', () => {
    expect(extractHTMLFields(html)).toMatchObject({
      title: 'blog — napochaan',
      description: 'a & b',
      robots: 'noindex',
      canonical: 'http://x/blog',
      alternates: 'application/rss+xml http://x/blog/rss.xml',
      'og:image': 'http://x/og.png',
      'twitter:image': 'http://x/tw.png',
      h1: 'blog !',
    });
  });

  it('ignores <title> inside inline SVG', () => {
    expect(extractHTMLFields('<svg><title>icon</title></svg><title>page</title>').title).toBe('page');
  });
});

describe('stripQuery', () => {
  it('drops the cache-buster query', () => {
    expect(stripQuery('http://x/a.png?08f1')).toBe('http://x/a.png');
    expect(stripQuery(undefined)).toBeUndefined();
  });
});

describe('normalizeTextBody', () => {
  it('normalizes CRLF, trailing whitespace and lastBuildDate', () => {
    const a = '<rss>\r\n<lastBuildDate>Mon, 01 Jan 2026</lastBuildDate>  \r\n</rss>\n';
    const b = '<rss>\n<lastBuildDate>Tue, 02 Jan 2026</lastBuildDate>\n</rss>';
    expect(normalizeTextBody(a)).toBe(normalizeTextBody(b));
  });

  it('keeps content differences', () => {
    expect(normalizeTextBody('# a')).not.toBe(normalizeTextBody('# b'));
  });
});

describe('pngDimensions', () => {
  it('reads IHDR width and height', () => {
    const bytes = new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0, 0, 0, 13, 0x49, 0x48, 0x44, 0x52, 0, 0, 4, 176, 0, 0, 2, 118]);
    expect(pngDimensions(bytes)).toBe('1200x630');
  });

  it('flags a non-PNG body', () => {
    expect(pngDimensions(new TextEncoder().encode('<html>not a png</html>'))).toBe('invalid');
  });
});

describe('buildRecord', () => {
  it('records Location for redirects instead of a body', () => {
    const record = buildRecord({ status: 308, headers: headers({ location: '/log', 'cache-control': 'no-store' }), text: '' });
    expect(record).toEqual({ status: '308', 'content-type': 'n/a', 'cache-control': 'uncacheable', location: '/log' });
  });

  it('compares markdown by normalized body', () => {
    const record = buildRecord({ status: 200, headers: headers({ 'content-type': 'text/markdown; charset=utf-8' }), text: '# about  \n' });
    expect(record).toMatchObject({ body: '# about' });
  });
});

describe('diffRecords', () => {
  it('lists differing fields, with ∅ for missing ones', () => {
    expect(diffRecords({ status: '200', h1: 'x' }, { status: '404' })).toEqual([
      { field: 'status', a: '200', b: '404' },
      { field: 'h1', a: 'x', b: '∅' },
    ]);
  });
});

describe('applyWhitelist', () => {
  it('accepts a diff only when path, field and both values match an entry', () => {
    const diffs = [
      { field: 'og:image', a: 'http://x/opengraph-image-12o0cb.png', b: 'http://x/og-default.png' },
      { field: 'og:image', a: 'http://x/opengraph-image-12o0cb.png', b: 'http://x/something-else.png' },
    ];
    const { accepted, mismatches } = applyWhitelist('/colophon', diffs, WHITELIST);
    expect(accepted.map((result: { entry?: { id: string } }) => result.entry?.id)).toEqual(['default-og-image-url']);
    expect(mismatches).toEqual([diffs[1]]);
  });

  it('does not let a path-scoped entry leak to other paths', () => {
    const diff = { field: 'status', a: '200', b: '404' };
    expect(applyWhitelist('/blog/page/3', [diff], WHITELIST).mismatches).toEqual([]);
    expect(applyWhitelist('/blog/page/2', [diff], WHITELIST).mismatches).toEqual([diff]);
  });

  describe('missing-slug-og-image', () => {
    const diff = { field: 'og:image', a: 'http://x/blog/post-1/opengraph-image-fx5gi7', b: 'http://x/og-default.png' };
    const notFound = { a: { status: '404' }, b: { status: '404' } };

    it('accepts the segment OG leak only on the 404 probe paths', () => {
      expect(applyWhitelist('/blog/does-not-exist', [{ ...diff, a: 'http://x/blog/does-not-exist/opengraph-image-fx5gi7' }], WHITELIST, notFound).mismatches).toEqual([]);
    });

    it('does NOT accept a valid slug whose og:image fell back to the default', () => {
      const ok = { a: { status: '200' }, b: { status: '200' } };
      expect(applyWhitelist('/blog/post-1', [diff], WHITELIST, ok).mismatches).toEqual([diff]);
    });

    it('does NOT accept the missing-slug path unless both sides answer 404', () => {
      const leak = { ...diff, a: 'http://x/blog/does-not-exist/opengraph-image-fx5gi7' };
      expect(applyWhitelist('/blog/does-not-exist', [leak], WHITELIST, { a: { status: '404' }, b: { status: '200' } }).mismatches).toEqual([leak]);
      expect(applyWhitelist('/blog/does-not-exist', [leak], WHITELIST).mismatches).toEqual([leak]);
    });
  });

  it('every entry carries an id and a reason, ids unique', () => {
    const ids = WHITELIST.map((entry) => entry.id);
    expect(new Set(ids).size).toBe(ids.length);
    for (const entry of WHITELIST) expect(entry.reason.length).toBeGreaterThan(10);
  });
});
