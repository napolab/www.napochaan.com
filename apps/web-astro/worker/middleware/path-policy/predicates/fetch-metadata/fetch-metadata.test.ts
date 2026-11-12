import { describe, expect, it } from 'vitest';

import { headerIs, isCrossSite, isDocumentDest } from './index';

describe('headerIs', () => {
  it('holds when the header has exactly the value', () => {
    expect(headerIs('X-A', 'b')(new Headers({ 'X-A': 'b' }))).toBe(true);
    expect(headerIs('X-A', 'b')(new Headers({ 'X-A': 'c' }))).toBe(false);
  });

  it('does not hold when the header is absent', () => {
    expect(headerIs('X-A', 'b')(new Headers())).toBe(false);
  });
});

describe('isCrossSite', () => {
  it('holds only for Sec-Fetch-Site: cross-site', () => {
    expect(isCrossSite(new Headers({ 'Sec-Fetch-Site': 'cross-site' }))).toBe(true);
    expect(isCrossSite(new Headers({ 'Sec-Fetch-Site': 'same-site' }))).toBe(false);
    expect(isCrossSite(new Headers())).toBe(false);
  });
});

describe('isDocumentDest', () => {
  it('holds only for Sec-Fetch-Dest: document', () => {
    expect(isDocumentDest(new Headers({ 'Sec-Fetch-Dest': 'document' }))).toBe(true);
    expect(isDocumentDest(new Headers({ 'Sec-Fetch-Dest': 'iframe' }))).toBe(false);
    expect(isDocumentDest(new Headers())).toBe(false);
  });
});
