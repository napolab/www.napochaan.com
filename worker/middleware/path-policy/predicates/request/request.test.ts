import { describe, expect, it } from 'vitest';

import { byHeaders, byMethod, byPathname, isCrossSiteNavigation, isNavigationMethod } from './index';

import type { PathRequest } from '../../types';

const crossSiteDocument = { 'Sec-Fetch-Site': 'cross-site', 'Sec-Fetch-Dest': 'document' };

const request = (overrides: Partial<PathRequest> = {}): PathRequest => ({ method: 'GET', pathname: '/', headers: new Headers(), ...overrides });

describe('selectors', () => {
  it('byPathname focuses a predicate on the pathname', () => {
    expect(byPathname((pathname) => pathname === '/x')(request({ pathname: '/x' }))).toBe(true);
    expect(byPathname((pathname) => pathname === '/x')(request())).toBe(false);
  });

  it('byHeaders focuses a predicate on the headers', () => {
    expect(byHeaders((headers) => headers.has('X-A'))(request({ headers: new Headers({ 'X-A': '1' }) }))).toBe(true);
    expect(byHeaders((headers) => headers.has('X-A'))(request())).toBe(false);
  });

  it('byMethod focuses a predicate on the method', () => {
    expect(byMethod((method) => method === 'PUT')(request({ method: 'PUT' }))).toBe(true);
    expect(byMethod((method) => method === 'PUT')(request())).toBe(false);
  });
});

describe('isNavigationMethod', () => {
  it.each(['GET', 'HEAD'])('holds for %s', (method) => {
    expect(isNavigationMethod(request({ method }))).toBe(true);
  });

  it.each(['POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'])('does not hold for %s', (method) => {
    expect(isNavigationMethod(request({ method }))).toBe(false);
  });
});

describe('isCrossSiteNavigation', () => {
  it('holds for a cross-site document GET/HEAD', () => {
    expect(isCrossSiteNavigation(request({ headers: new Headers(crossSiteDocument) }))).toBe(true);
    expect(isCrossSiteNavigation(request({ method: 'HEAD', headers: new Headers(crossSiteDocument) }))).toBe(true);
  });

  it('does not hold for a non-navigation method', () => {
    expect(isCrossSiteNavigation(request({ method: 'POST', headers: new Headers(crossSiteDocument) }))).toBe(false);
  });

  it.each(['same-origin', 'same-site', 'none'])('does not hold for a %s navigation', (site) => {
    expect(isCrossSiteNavigation(request({ headers: new Headers({ 'Sec-Fetch-Site': site, 'Sec-Fetch-Dest': 'document' }) }))).toBe(false);
  });

  it.each(['iframe', 'image', 'empty'])('does not hold for a cross-site %s request', (dest) => {
    expect(isCrossSiteNavigation(request({ headers: new Headers({ 'Sec-Fetch-Site': 'cross-site', 'Sec-Fetch-Dest': dest }) }))).toBe(false);
  });

  it('does not hold without fetch metadata', () => {
    expect(isCrossSiteNavigation(request())).toBe(false);
  });
});
