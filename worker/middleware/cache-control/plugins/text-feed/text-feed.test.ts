import { describe, expect, it } from 'vitest';

import { TEXT_FEED_POLICY } from '../../policies';
import { isLLMsText, isMarkdown, isRSSFeed, isSecurityTxt, textFeedPlugin } from './index';

describe('isRSSFeed', () => {
  it.each(['/blog/rss.xml', '/gallery/rss.xml', '/rss.xml'])('holds for %s', (pathname) => {
    expect(isRSSFeed(pathname)).toBe(true);
  });

  it.each(['/sitemap.xml', '/rss.xml/', '/xrss.xml', '/rss.xml.bak'])('does not hold for %s', (pathname) => {
    expect(isRSSFeed(pathname)).toBe(false);
  });
});

describe('isLLMsText', () => {
  it.each(['/llms.txt', '/llms-full.txt'])('holds for %s', (pathname) => {
    expect(isLLMsText(pathname)).toBe(true);
  });

  it.each(['/llms-other.txt', '/blog/llms.txt', '/llms.txt/', '/llms'])('does not hold for %s', (pathname) => {
    expect(isLLMsText(pathname)).toBe(false);
  });
});

describe('isMarkdown', () => {
  it.each(['/about.md', '/blog/my-post.md'])('holds for %s', (pathname) => {
    expect(isMarkdown(pathname)).toBe(true);
  });

  it.each(['/about', '/about.md/', '/about.mdx', '/md'])('does not hold for %s', (pathname) => {
    expect(isMarkdown(pathname)).toBe(false);
  });
});

describe('isSecurityTxt', () => {
  it('holds only for the well-known path', () => {
    expect(isSecurityTxt('/.well-known/security.txt')).toBe(true);
    expect(isSecurityTxt('/security.txt')).toBe(false);
    expect(isSecurityTxt('/x/.well-known/security.txt')).toBe(false);
  });
});

describe('textFeedPlugin', () => {
  it.each(['/blog/rss.xml', '/llms.txt', '/llms-full.txt', '/blog/my-post.md', '/.well-known/security.txt'])('applies the text-feed policy to %s', (pathname) => {
    expect(textFeedPlugin.run(pathname)._unsafeUnwrap()).toBe(TEXT_FEED_POLICY);
  });

  it.each(['/', '/works', '/sitemap.xml', '/api/users/me'])('does not match %s', (pathname) => {
    expect(textFeedPlugin.run(pathname).isErr()).toBe(true);
  });

  it('returns the pathname as the err value on a miss', () => {
    expect(textFeedPlugin.run('/works')._unsafeUnwrapErr()).toBe('/works');
  });
});
