import { describe, expect, it } from 'vitest';

import { resolveExitRedirect } from './redirect-target';

const origins = { requestURL: 'https://napochaan.com/next/exit-preview?redirect=x', cmsOrigin: 'https://cms.napochaan.com' };

describe('resolveExitRedirect', () => {
  it.each([
    ['a same-origin path', '/blog/1?x=1#h', 'https://napochaan.com/blog/1?x=1#h'],
    ['a same-origin absolute URL', 'https://napochaan.com/works', 'https://napochaan.com/works'],
    ['the cms origin', 'https://cms.napochaan.com/cdn-cgi/access/logout', 'https://cms.napochaan.com/cdn-cgi/access/logout'],
    ['the cms admin login', 'https://cms.napochaan.com/admin/login', 'https://cms.napochaan.com/admin/login'],
  ])('allows %s', (_label, value, expected) => {
    expect(resolveExitRedirect(value, origins)).toBe(expected);
  });

  it.each([
    ['missing', null],
    ['empty', ''],
    ['an evil origin', 'https://evil.example/admin/login'],
    ['a protocol-relative URL', '//evil.example/x'],
    ['a backslash protocol-relative URL', '/\\evil.example/x'],
    ['a javascript: URL', 'javascript:alert(1)'],
    ['a data: URL', 'data:text/html,<script>alert(1)</script>'],
    ['a cms-lookalike host', 'https://cms.napochaan.com.evil.example/x'],
    ['the cms host over another scheme', 'http://cms.napochaan.com/admin/login'],
    ['the cms host on another port', 'https://cms.napochaan.com:8443/admin/login'],
  ])('falls back to / for %s', (_label, value) => {
    expect(resolveExitRedirect(value, origins)).toBe('/');
  });

  it.each(['', 'not a url'])('does not allow anything cross-origin when CMS_ORIGIN is %o', (cmsOrigin) => {
    expect(resolveExitRedirect('https://cms.napochaan.com/admin/login', { ...origins, cmsOrigin })).toBe('/');
    expect(resolveExitRedirect('/works', { ...origins, cmsOrigin })).toBe('https://napochaan.com/works');
  });

  // A same-origin URL whose path starts with `//` must never come back as a bare path:
  // `Location: //evil.com` is protocol-relative and leaves the site.
  it.each(['https://napochaan.com//evil.com', '/.//evil.com', '/%2e//evil.com'])('keeps %s on the web origin as an absolute URL', (value) => {
    const result = resolveExitRedirect(value, origins);
    expect(result.startsWith('//')).toBe(false);
    expect(result === '/' || new URL(result).origin === 'https://napochaan.com').toBe(true);
  });
});
