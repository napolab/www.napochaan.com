import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { TYPEWRITER_DEFAULTS, createTypewriter } from './index';

// No typos and no pauses: every tick commits exactly one correct char.
const steady = { ...TYPEWRITER_DEFAULTS, typoChance: 0, pauseChance: 0 };

describe('createTypewriter', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('starts empty and not done', () => {
    const typewriter = createTypewriter('napo', steady);
    expect(typewriter.getSnapshot()).toEqual({ displayText: '', isDone: false });
  });

  it('types the full text one keystroke at a time once started, then reports done', () => {
    const typewriter = createTypewriter('napo', steady);
    const seen: string[] = [];
    typewriter.subscribe(() => seen.push(typewriter.getSnapshot().displayText));

    typewriter.start();
    vi.runAllTimers();

    expect(seen).toEqual(['n', 'na', 'nap', 'napo', 'napo']);
    expect(typewriter.getSnapshot()).toEqual({ displayText: 'napo', isDone: true });
  });

  it('fumbles wrong chars, then deletes them and still lands on the exact text', () => {
    // A long text at a high (not certain — 1 would fumble forever) typo rate makes at
    // least one fumble a practical certainty.
    const text = 'napochaan-'.repeat(6);
    const typewriter = createTypewriter(text, { ...steady, typoChance: 0.4 });
    const seen: string[] = [];
    typewriter.subscribe(() => seen.push(typewriter.getSnapshot().displayText));

    typewriter.start();
    vi.runAllTimers();

    expect(seen.some((shown) => !text.startsWith(shown))).toBe(true);
    expect(typewriter.getSnapshot()).toEqual({ displayText: text, isDone: true });
  });

  it('jumps straight to the full text on finish', () => {
    const typewriter = createTypewriter('napo', steady);
    typewriter.start();
    typewriter.finish();

    expect(typewriter.getSnapshot()).toEqual({ displayText: 'napo', isDone: true });
    // No timer is left running after the jump.
    expect(vi.getTimerCount()).toBe(0);
  });

  it('freezes on stop and resumes from the same place on the next start', () => {
    const typewriter = createTypewriter('napo', steady);
    typewriter.start();
    vi.advanceTimersToNextTimer();
    const frozen = typewriter.getSnapshot().displayText;
    typewriter.stop();
    vi.runAllTimers();
    expect(typewriter.getSnapshot().displayText).toBe(frozen);

    typewriter.start();
    vi.runAllTimers();
    expect(typewriter.getSnapshot()).toEqual({ displayText: 'napo', isDone: true });
  });

  it('stops notifying a listener after it unsubscribes', () => {
    const typewriter = createTypewriter('napo', steady);
    const listener = vi.fn();
    const unsubscribe = typewriter.subscribe(listener);
    unsubscribe();

    typewriter.start();
    vi.runAllTimers();
    expect(listener).not.toHaveBeenCalled();
  });
});
