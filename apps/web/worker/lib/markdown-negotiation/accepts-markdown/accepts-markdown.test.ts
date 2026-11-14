import { describe, expect, it } from 'vitest';

import { acceptsMarkdown } from './index';

describe('acceptsMarkdown', () => {
  it.each([
    ['text/markdown', true],
    ['text/markdown; charset=utf-8', true],
    ['TEXT/Markdown', true],
    ['  text/html ,  text/markdown  ', true],
    // equal q: the agent named markdown explicitly, so markdown wins the tie
    ['text/markdown, text/html', true],
    ['text/html, text/markdown;q=1.0', true],
    ['text/markdown;q=0.9, text/html;q=0.8', true],
    ['text/markdown;q=0.5, text/*;q=0.5', true],
    ['text/markdown, */*;q=0.8', true],
  ])('prefers markdown for %j', (accept, expected) => {
    expect(acceptsMarkdown(accept)).toBe(expected);
  });

  it.each([
    [null],
    [''],
    // browsers and curl: no explicit text/markdown range
    ['text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8'],
    ['*/*'],
    ['text/*'],
    ['text/markdownx'],
    // explicitly refused
    ['text/markdown;q=0'],
    ['text/markdown;q=0.000, text/html'],
    // html wins on q
    ['text/markdown;q=0.5, text/html'],
    ['text/markdown;q=0.5, text/*;q=0.9'],
    ['text/markdown;q=0.5, */*'],
  ])('does not prefer markdown for %j', (accept) => {
    expect(acceptsMarkdown(accept)).toBe(false);
  });

  // A malformed q is treated as absent (q=1), per the lenient reading most servers apply.
  it('treats a malformed q as the default 1', () => {
    expect(acceptsMarkdown('text/markdown;q=abc, text/html')).toBe(true);
    expect(acceptsMarkdown('text/markdown;q=2, text/html')).toBe(true);
  });

  // The most specific range decides html's q (RFC 9110 §12.5.1).
  it('uses the most specific range for the html quality', () => {
    expect(acceptsMarkdown('text/markdown;q=0.5, text/html;q=0.1, */*')).toBe(true);
    expect(acceptsMarkdown('text/markdown;q=0.5, text/html;q=0, text/*')).toBe(true);
  });
});
