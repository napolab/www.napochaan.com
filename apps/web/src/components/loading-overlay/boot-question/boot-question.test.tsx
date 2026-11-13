import { render } from 'vitest-browser-react';
import { describe, expect, it, vi } from 'vitest';

import { BootStatusProvider } from '@components/boot-status';

import { BootQuestion } from './index';
import { QUESTIONS } from '../questions';

// Isolated boot phase per test: the store observes the injected element instead
// of <html>, so removing the class here ends the boot for this tree only.
const makeBootTarget = () => {
  const target = document.createElement('div');
  target.classList.add('boot');
  return target;
};

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
