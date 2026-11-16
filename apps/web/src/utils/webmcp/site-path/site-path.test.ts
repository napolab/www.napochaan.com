import { describe, expect, it } from 'vitest';

import { resolveSitePath } from './index';

const ORIGIN = 'https://napochaan.com';

describe('resolveSitePath', () => {
  it('accepts a site-relative path and keeps its query', () => {
    expect(resolveSitePath('/blog', ORIGIN)).toEqual({ ok: true, path: '/blog' });
    expect(resolveSitePath('/', ORIGIN)).toEqual({ ok: true, path: '/' });
    expect(resolveSitePath('/works/foo?x=1', ORIGIN)).toEqual({ ok: true, path: '/works/foo?x=1' });
  });

  it('keeps the fragment so a navigation can land on an anchor', () => {
    expect(resolveSitePath('/about#profile', ORIGIN)).toEqual({ ok: true, path: '/about#profile' });
  });

  it('rejects anything that is not a string', () => {
    for (const input of [undefined, null, 1, {}, ['/blog']]) {
      expect(resolveSitePath(input, ORIGIN).ok).toBe(false);
    }
  });

  it('rejects absolute URLs, schemes and relative paths', () => {
    for (const input of ['https://evil.example/', 'javascript:alert(1)', 'blog', '', './blog', '?q=1']) {
      expect(resolveSitePath(input, ORIGIN).ok).toBe(false);
    }
  });

  it('rejects protocol-relative paths', () => {
    expect(resolveSitePath('//evil.example/', ORIGIN).ok).toBe(false);
  });

  // The WHATWG URL parser reads `\` as `/` and strips tab / newline, so both of these
  // resolve to another host even though they start with a single `/`.
  it('rejects paths the URL parser resolves to another origin', () => {
    expect(resolveSitePath('/\\evil.example/', ORIGIN).ok).toBe(false);
    expect(resolveSitePath('/\t/evil.example/', ORIGIN).ok).toBe(false);
    expect(resolveSitePath('/\n/evil.example/', ORIGIN).ok).toBe(false);
  });

  it('explains the rejection with the offending input', () => {
    const result = resolveSitePath('//evil.example/', ORIGIN);
    expect(result).toEqual({ ok: false, reason: expect.stringContaining('"//evil.example/"') });
    expect(result.ok === false && result.reason).toContain('site-relative path');
  });
});
