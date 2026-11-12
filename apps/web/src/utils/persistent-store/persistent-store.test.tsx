import { describe, expect, it } from 'vitest';

import { read, subscribe, write } from './index';

// `cache`/`listeners` are module-level singletons shared across tests, so each test derives a unique
// key from its own name to stay isolated and deterministic.
const keyFor = (name: string): string => `persistent-store-test:${name}`;

describe('read', () => {
  it('returns the fallback when the key is absent', () => {
    const key = keyFor('read-fallback');
    expect(read(key, 'fallback')).toBe('fallback');
  });
});

describe('write', () => {
  it('round-trips the value with a following read', () => {
    const key = keyFor('write-read-roundtrip');
    write(key, 42);
    expect(read(key, 0)).toBe(42);
  });
});

describe('subscribe', () => {
  it('fires its listener when write is called for that key', () => {
    const key = keyFor('subscribe-fires');
    const state = { count: 0 };
    const unsubscribe = subscribe(key, () => {
      state.count += 1;
    });

    write(key, 'a');
    expect(state.count).toBe(1);

    unsubscribe();
  });

  it('stops notifying after the unsubscribe function is called', () => {
    const key = keyFor('subscribe-unsubscribe');
    const state = { count: 0 };
    const unsubscribe = subscribe(key, () => {
      state.count += 1;
    });

    write(key, 'a');
    unsubscribe();
    write(key, 'b');

    expect(state.count).toBe(1);
  });

  it('does not call a listener for key A when key B is written', () => {
    const keyA = keyFor('subscribe-isolation-a');
    const keyB = keyFor('subscribe-isolation-b');
    const state = { count: 0 };
    const unsubscribe = subscribe(keyA, () => {
      state.count += 1;
    });

    write(keyB, 'b');
    expect(state.count).toBe(0);

    unsubscribe();
  });
});
