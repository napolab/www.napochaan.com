import { render } from 'vitest-browser-react';
import { describe, expect, it, vi } from 'vitest';
import { page } from 'vitest/browser';

import { BootStatusProvider } from '@components/boot-status';
import { MotionProvider } from '@components/motion-provider';

import { EchoText } from './index';

// vi.mock is hoisted above every import, so the spy must be built inside
// vi.hoisted or the factory would read `loadGsap` before initialisation. The spy
// delegates to the real implementation so the existing decode-behaviour tests
// below keep working — only the reduced-motion test cares about call count.
const { loadGsap } = vi.hoisted(() => ({ loadGsap: vi.fn() }));
vi.mock('@utils/gsap', async () => {
  const actual = await vi.importActual<typeof import('@utils/gsap')>('@utils/gsap');
  loadGsap.mockImplementation(actual.loadGsap);
  return { loadGsap };
});

// Isolated boot phase: the store observes the injected element, so removing the
// class here triggers bootReady (and the decode scramble) for this tree only.
const makeBootTarget = () => {
  const target = document.createElement('div');
  target.classList.add('boot');
  return target;
};

describe('EchoText', () => {
  it('renders the wordmark with an accessible label', async () => {
    await render(<EchoText>napochaan</EchoText>);
    await expect.element(page.getByText('napochaan').first()).toBeInTheDocument();
    await expect.element(page.getByRole('img', { name: 'napochaan' })).toBeInTheDocument();
  });
  it('renders the trailing red dot', async () => {
    await render(<EchoText>napochaan</EchoText>);
    await expect.element(page.getByText('.', { exact: true })).toBeInTheDocument();
  });
  it('defaults to the hero size', async () => {
    const { container } = await render(<EchoText>napochaan</EchoText>);
    expect(container.querySelector('[data-size="hero"]')).not.toBeNull();
  });
  it('renders a compact size variant', async () => {
    const { container } = await render(<EchoText size="compact">napochaan</EchoText>);
    expect(container.querySelector('[data-size="compact"]')).not.toBeNull();
  });

  it('locks the scramble box width during decode and releases it afterwards', async () => {
    // The scramble glyphs vary in advance width, so without a locked box every
    // refresh would push the trailing red dot (and the centered line) around —
    // each nudge counting toward CLS. The decode must pin the box's inline size
    // for the tween's lifetime and clear it once the wordmark settles.
    const target = makeBootTarget();
    const { container } = await render(
      <BootStatusProvider target={target}>
        <EchoText>napochaan</EchoText>
      </BootStatusProvider>,
    );
    const scramble = container.querySelector('[data-scramble]');
    if (!(scramble instanceof HTMLElement)) throw new Error('scramble span not found');
    expect(scramble.style.width).toBe('');

    target.classList.remove('boot');

    // Locked while the decode tween runs...
    await expect.poll(() => scramble.style.width, { timeout: 3000 }).toMatch(/px$/);
    // ...and released when it completes (DURATION 1.1s + revealDelay).
    await expect.poll(() => scramble.style.width, { timeout: 6000 }).toBe('');
  });

  // Spec §4: under reduced motion the gsap import itself must be skipped, not
  // merely no-op'd after loading. bootReady is already true here (no boot
  // target injected — see makeBootTarget's isolated-store comment above), so a
  // regression that only guards the imperative tween body would still call
  // loadGsap and this assertion would catch it.
  it('never imports gsap when reduced motion is on', async () => {
    loadGsap.mockClear();
    const target = makeBootTarget();
    const { container } = await render(
      <BootStatusProvider target={target}>
        <MotionProvider reduced>
          <EchoText>napochaan</EchoText>
        </MotionProvider>
      </BootStatusProvider>,
    );
    target.classList.remove('boot');

    const root = container.querySelector('[role="img"]');
    if (!(root instanceof HTMLElement)) throw new Error('root span not found');
    root.dispatchEvent(new Event('pointerenter', { bubbles: true }));

    await new Promise((resolve) => setTimeout(resolve, 50));
    expect(loadGsap).not.toHaveBeenCalled();
  });
});
