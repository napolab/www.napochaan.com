import { afterEach, describe, expect, it } from 'vitest';

import { read, write } from '@utils/persistent-store';
import { MOTION_STORAGE_KEY } from '@utils/prefers-reduced-motion';

import { bindMotionPlay, toggleMotion } from './index';

// The header `motion:` toggle and the `--motion-play` bridge used to live only inside
// the React MotionProvider. The SysBar is a custom element now and a typical page
// mounts no React root, so both must work without React.
afterEach(() => {
  write(MOTION_STORAGE_KEY, null);
  localStorage.clear();
  document.documentElement.style.removeProperty('--motion-play');
  document.cookie = 'motion=; path=/; max-age=0';
});

const motionPlay = () => document.documentElement.style.getPropertyValue('--motion-play');

describe('toggleMotion', () => {
  it('stores the opposite of the effective preference and mirrors it into the boot cookie', () => {
    // No override and the test browser does not request reduce → motion on.
    toggleMotion();
    expect(read(MOTION_STORAGE_KEY, null)).toBe(false);
    expect(document.cookie).toContain('motion=off');

    toggleMotion();
    expect(read(MOTION_STORAGE_KEY, null)).toBe(true);
    expect(document.cookie).toContain('motion=on');
  });
});

describe('bindMotionPlay', () => {
  it('writes --motion-play on <html> now and on every change until unbound', () => {
    const unbind = bindMotionPlay();
    expect(motionPlay()).toBe('running');

    toggleMotion();
    expect(motionPlay()).toBe('paused');

    unbind();
    toggleMotion();
    expect(motionPlay()).toBe('paused');
  });
});
