import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { BOOT_SEEN_KEY, BOOT_SEEN_TTL_MS, typekitLoaderHtml } from './typekit';

const html = document.documentElement;

// The kit script tag the loader inserts would hit use.typekit.net; stub Typekit and
// neutralise script insertion so the test stays offline. The boot gate only reacts
// to html class mutations, which we drive by hand.
const runLoader = () => {
  const original = document.createElement.bind(document);
  const spy = vi.spyOn(document, 'createElement').mockImplementation((tag: string) => {
    const el = original(tag);
    if (tag === 'script') Object.defineProperty(el, 'src', { set: () => {}, get: () => '' });
    return el;
  });
  // eslint-disable-next-line no-new-func -- test-only: evaluates the build-time constant
  // script string exactly as the browser does for the inline <script>. Nothing
  // user-controlled is ever interpolated into it.
  new Function(typekitLoaderHtml.__html)();
  spy.mockRestore();
};

// Playwright's headless Chromium reports "HeadlessChrome" in its UA string, which
// matches the loader's (out-of-scope, untouched) BOT regex and would strip `boot`
// synchronously before any of the human-path assertions below run. Stub a
// human-shaped UA for the duration of these tests so they exercise the
// return-visit floor, not the bot short-circuit — restored afterwards via the
// original descriptor.
const userAgentDescriptor = Object.getOwnPropertyDescriptor(Navigator.prototype, 'userAgent');

describe('typekit boot gate', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    localStorage.clear();
    html.className = 'wf-loading boot';
    Object.defineProperty(Navigator.prototype, 'userAgent', {
      configurable: true,
      get: () => 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 Chrome/128.0.0.0 Safari/537.36',
    });
  });

  afterEach(() => {
    vi.useRealTimers();
    html.className = '';
    if (userAgentDescriptor !== undefined) Object.defineProperty(Navigator.prototype, 'userAgent', userAgentDescriptor);
  });

  it('holds boot for the 1s floor on a first visit', async () => {
    runLoader();
    html.classList.add('wf-active');
    await vi.advanceTimersByTimeAsync(500);
    expect(html.classList.contains('boot')).toBe(true);
    await vi.advanceTimersByTimeAsync(600);
    expect(html.classList.contains('boot')).toBe(false);
    expect(localStorage.getItem(BOOT_SEEN_KEY)).not.toBeNull();
  });

  it('drops boot as soon as fonts resolve on a return visit', async () => {
    localStorage.setItem(BOOT_SEEN_KEY, `${Date.now() - 60_000}`);
    runLoader();
    html.classList.add('wf-active');
    await vi.advanceTimersByTimeAsync(20);
    expect(html.classList.contains('boot')).toBe(false);
  });

  it('treats a seen-mark older than the TTL as a first visit', async () => {
    localStorage.setItem(BOOT_SEEN_KEY, `${Date.now() - BOOT_SEEN_TTL_MS - 1}`);
    runLoader();
    html.classList.add('wf-active');
    await vi.advanceTimersByTimeAsync(500);
    expect(html.classList.contains('boot')).toBe(true);
  });

  it('falls back to the floor when storage throws', async () => {
    const getItem = vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new Error('denied');
    });
    runLoader();
    html.classList.add('wf-active');
    await vi.advanceTimersByTimeAsync(500);
    expect(html.classList.contains('boot')).toBe(true);
    await vi.advanceTimersByTimeAsync(600);
    expect(html.classList.contains('boot')).toBe(false);
    getItem.mockRestore();
  });

  it('does not stamp the seen-mark on the bot path', async () => {
    Object.defineProperty(Navigator.prototype, 'userAgent', {
      configurable: true,
      get: () => 'Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)',
    });
    runLoader();
    html.classList.add('wf-active');
    await vi.advanceTimersByTimeAsync(500);
    expect(html.classList.contains('boot')).toBe(false);
    expect(localStorage.getItem(BOOT_SEEN_KEY)).toBeNull();
  });
});
