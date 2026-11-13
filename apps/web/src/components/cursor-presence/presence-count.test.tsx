import { afterEach, describe, expect, it, vi } from 'vitest';

import { write } from '@utils/persistent-store';

import { getPresenceCount, isPresenceEnabled, PRESENCE_ENABLED_KEY, publishPresenceCount, subscribePresenceCount, subscribePresenceEnabled, togglePresenceEnabled } from './presence-count';

// The framework-free half of the presence store: the <cursor-presence> element publishes
// the visitor count, the <sys-bar> element shows it and flips the opt-out — no React.
afterEach(() => {
  publishPresenceCount(0);
  write(PRESENCE_ENABLED_KEY, true);
  localStorage.clear();
});

describe('presence count', () => {
  it('notifies subscribers of a changed count only', () => {
    const listener = vi.fn();
    const unsubscribe = subscribePresenceCount(listener);

    publishPresenceCount(3);
    publishPresenceCount(3);
    expect(listener).toHaveBeenCalledTimes(1);
    expect(getPresenceCount()).toBe(3);

    unsubscribe();
    publishPresenceCount(4);
    expect(listener).toHaveBeenCalledTimes(1);
  });
});

describe('presence opt-out', () => {
  it('defaults to enabled and toggles through the persistent store', () => {
    const listener = vi.fn();
    const unsubscribe = subscribePresenceEnabled(listener);
    expect(isPresenceEnabled()).toBe(true);

    togglePresenceEnabled();
    expect(isPresenceEnabled()).toBe(false);
    expect(localStorage.getItem(PRESENCE_ENABLED_KEY)).toBe('false');
    expect(listener).toHaveBeenCalledTimes(1);

    togglePresenceEnabled();
    expect(isPresenceEnabled()).toBe(true);
    unsubscribe();
  });
});
