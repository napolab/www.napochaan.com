import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { absoluteUrl } from './index';

describe('absoluteUrl', () => {
  const original = process.env.BASE_URL;

  beforeEach(() => {
    process.env.BASE_URL = 'https://www.napochaan.com';
  });

  afterEach(() => {
    process.env.BASE_URL = original;
  });

  it('prefixes the path with BASE_URL', () => {
    expect(absoluteUrl('/works/abc')).toBe('https://www.napochaan.com/works/abc');
  });

  it('falls back to localhost when BASE_URL is unset', () => {
    delete process.env.BASE_URL;
    expect(absoluteUrl('/news/1')).toBe('http://localhost:3000/news/1');
  });
});
