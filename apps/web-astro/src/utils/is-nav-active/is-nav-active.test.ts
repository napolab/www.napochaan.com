import { describe, expect, it } from 'vitest';

import { isNavActive } from './index';

describe('isNavActive', () => {
  describe('index target ("/")', () => {
    it('is active only when the pathname is exactly "/"', () => {
      expect(isNavActive('/', '/')).toBe(true);
    });

    it('is not active on any nested route', () => {
      expect(isNavActive('/works', '/')).toBe(false);
      expect(isNavActive('/works/abc', '/')).toBe(false);
    });
  });

  describe('real-route target ("/works")', () => {
    it('is active on the exact route', () => {
      expect(isNavActive('/works', '/works')).toBe(true);
    });

    it('is active on a nested route under it', () => {
      expect(isNavActive('/works/abc', '/works')).toBe(true);
    });

    it('is not active on a sibling route that only shares a prefix', () => {
      expect(isNavActive('/workshop', '/works')).toBe(false);
    });

    it('is not active on the index route', () => {
      expect(isNavActive('/', '/works')).toBe(false);
    });
  });

  describe('home-anchor target ("/#about")', () => {
    it('is never page-active, even on the home route', () => {
      expect(isNavActive('/', '/#about')).toBe(false);
    });

    it('is never page-active on other routes', () => {
      expect(isNavActive('/works', '/#about')).toBe(false);
    });
  });
});
