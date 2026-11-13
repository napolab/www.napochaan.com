import { render } from 'vitest-browser-react';
import { describe, expect, it, vi } from 'vitest';

import { BootStatusProvider } from '@components/boot-status';

import { BootQuestion, nextIndex, shuffle } from './index';
import { QUESTIONS } from '../questions';

// Isolated boot phase per test: the store observes the injected element instead
// of <html>, so removing the class here ends the boot for this tree only.
const makeBootTarget = () => {
  const target = document.createElement('div');
  target.classList.add('boot');
  return target;
};

// Deterministic stand-in for Math.random: yields the queued values in order,
// then 0. Mutable cursor lives in a const object (no `let`), matching the
// controller pattern used elsewhere in this folder.
const seq = (values: readonly number[]) => {
  const cursor = { i: 0 };
  return () => {
    const value = values[cursor.i] ?? 0;
    cursor.i += 1;
    return value;
  };
};

describe('nextIndex', () => {
  it('advances by one and wraps back to zero past the last prompt', () => {
    expect(nextIndex(0, QUESTIONS.length)).toBe(1);
    expect(nextIndex(3, QUESTIONS.length)).toBe(4);
    expect(nextIndex(QUESTIONS.length - 1, QUESTIONS.length)).toBe(0);
  });
});

describe('shuffle', () => {
  it('orders elements by their drawn key (ascending)', () => {
    // Keys are drawn per element in order: a=0.9, b=0.5, c=0.1 → sorted [c, b, a].
    expect(shuffle(['a', 'b', 'c'], seq([0.9, 0.5, 0.1]))).toEqual(['c', 'b', 'a']);
  });

  it('preserves every element — no loss, no duplication', () => {
    const result = shuffle(QUESTIONS, seq([0.3, 0.1, 0.4, 0.15, 0.9]));
    expect([...result].sort()).toStrictEqual([...QUESTIONS].sort());
  });

  it('never mutates the input array', () => {
    const input = ['a', 'b', 'c'];
    const snapshot = [...input];
    shuffle(input, seq([0.9, 0.5, 0.1]));
    expect(input).toStrictEqual(snapshot);
  });
});

describe('BootQuestion', () => {
  it('shows a prompt in full when motion is reduced (no cycling)', async () => {
    // Reduced motion makes the hook jump straight to the full text and the cycle
    // holds on the first shuffled prompt. Pinning Math.random to a constant gives
    // every element an equal sort key, so the stable sort leaves the order
    // untouched — the first prompt shown is QUESTIONS[0], keeping this assertion
    // deterministic while the shuffle still runs.
    vi.spyOn(Math, 'random').mockReturnValue(0.5);
    vi.spyOn(window, 'matchMedia').mockReturnValue({
      matches: true,
      media: '(prefers-reduced-motion: reduce)',
      onchange: null,
      addEventListener: () => {},
      removeEventListener: () => {},
      addListener: () => {},
      removeListener: () => {},
      dispatchEvent: () => false,
    });

    // The island only animates during the boot phase.
    const screen = await render(
      <BootStatusProvider target={makeBootTarget()}>
        <BootQuestion />
      </BootStatusProvider>,
    );
    const [first] = QUESTIONS;
    await expect.element(screen.getByText(first)).toBeInTheDocument();

    vi.restoreAllMocks();
  });
});

describe('BootQuestion boot gating', () => {
  // The island lives inside the boot overlay, which is visibility:hidden once
  // `html.boot` drops — but the component itself stays mounted forever. Without
  // gating, the typewriter keeps mutating layout (and burning timers) behind an
  // invisible overlay, and every keystroke still counts toward CLS.

  const typedLength = (root: HTMLElement) => (root.textContent ?? '').length;

  it('types while the boot phase is active', async () => {
    const screen = await render(
      <BootStatusProvider target={makeBootTarget()}>
        <BootQuestion />
      </BootStatusProvider>,
    );

    await expect.poll(() => typedLength(screen.container), { timeout: 5000 }).toBeGreaterThan(2);
  });

  it('freezes the typewriter once the boot phase ends', async () => {
    const target = makeBootTarget();
    const screen = await render(
      <BootStatusProvider target={target}>
        <BootQuestion />
      </BootStatusProvider>,
    );
    await expect.poll(() => typedLength(screen.container), { timeout: 5000 }).toBeGreaterThan(2);

    target.classList.remove('boot');
    // Let any in-flight keystroke land, then take the frozen baseline.
    await new Promise((resolve) => setTimeout(resolve, 300));
    const frozen = screen.container.textContent;

    // Negative assertion: settle window long enough for several keystrokes
    // (speed=46ms) and a HOLD_MS advance to have fired if gating were broken.
    await new Promise((resolve) => setTimeout(resolve, 2500));
    expect(screen.container.textContent).toBe(frozen);
  });
});
