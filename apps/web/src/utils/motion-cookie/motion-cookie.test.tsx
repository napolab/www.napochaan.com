import { afterEach, describe, expect, it } from 'vitest';

import { MOTION_COOKIE, motionBootScriptHtml, writeMotionCookie } from './index';

afterEach(() => {
  // The cookie persists on document.cookie across tests; delete it and drop the
  // inline CSS var the boot script would set so neither leaks into the next test.
  document.cookie = 'motion=; path=/; max-age=0';
  document.documentElement.style.removeProperty('--motion-play');
});

describe('writeMotionCookie', () => {
  it('writes motion=off when motion is disabled', () => {
    writeMotionCookie(false);
    expect(document.cookie).toContain('motion=off');
  });

  it('writes motion=on when motion is enabled', () => {
    writeMotionCookie(true);
    expect(document.cookie).toContain('motion=on');
  });

  it('deletes the cookie when the override is null', () => {
    writeMotionCookie(false);
    expect(document.cookie).toContain('motion=off');

    writeMotionCookie(null);
    expect(document.cookie).not.toContain('motion=');
  });
});

describe('motionBootScriptHtml', () => {
  it('embeds the cookie name and --motion-play running/paused logic', () => {
    const html = motionBootScriptHtml.__html;
    expect(typeof html).toBe('string');
    expect(html).toContain(MOTION_COOKIE);
    expect(html).toContain('--motion-play');
    expect(html).toContain('paused');
    expect(html).toContain('running');
  });
});
