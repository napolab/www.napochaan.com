import { afterAll, afterEach, beforeAll, describe, expect, it, vi } from 'vitest';

import { write } from '@utils/persistent-store';
import { MOTION_STORAGE_KEY } from '@utils/prefers-reduced-motion';

import { BOOT_QUESTION_TAG, defineBootQuestionElement } from './element';
import { QUESTIONS } from '../questions';

// The shared defaultBootStore latches READY for the rest of the file once the boot
// class drops, so the whole file runs inside one boot phase and the test that ends it
// comes last.

const markup = `<p><${BOOT_QUESTION_TAG}><span data-caret></span></${BOOT_QUESTION_TAG}></p>`;

const mount = () => {
  const container = document.createElement('div');
  container.innerHTML = markup;
  document.body.appendChild(container);
  return container;
};

const typedOf = (container: HTMLElement) => container.textContent ?? '';
const flush = (ms = 50) => new Promise((resolve) => setTimeout(resolve, ms));

describe('<boot-question>', () => {
  beforeAll(() => {
    document.documentElement.classList.add('boot');
    defineBootQuestionElement();
  });

  afterAll(() => {
    document.documentElement.classList.remove('boot');
  });

  afterEach(() => {
    vi.restoreAllMocks();
    write(MOTION_STORAGE_KEY, null);
    document.body.replaceChildren();
  });

  it('registers once (re-running the bundled script is a no-op)', () => {
    expect(() => defineBootQuestionElement()).not.toThrow();
    expect(customElements.get(BOOT_QUESTION_TAG)).toBeDefined();
  });

  it('types a prompt in front of the caret while the boot phase is active', async () => {
    const container = mount();
    await expect.poll(() => typedOf(container).length, { timeout: 5000 }).toBeGreaterThan(2);
    expect(container.querySelector(BOOT_QUESTION_TAG)?.lastElementChild?.hasAttribute('data-caret')).toBe(true);
  });

  it('shows the first shuffled prompt in full when motion is reduced, and holds on it', async () => {
    // A constant Math.random gives every prompt an equal sort key, so the stable sort
    // keeps QUESTIONS' order and the first prompt shown is QUESTIONS[0].
    vi.spyOn(Math, 'random').mockReturnValue(0.5);
    write(MOTION_STORAGE_KEY, false);
    const container = mount();
    const [first] = QUESTIONS;

    expect(typedOf(container)).toBe(first);
    await flush(2500); // past HOLD_MS: no cycling under reduced motion
    expect(typedOf(container)).toBe(first);
  });

  // Toggling reduced motion on during a hold and back off must resume the cycle, not
  // leave a cancelled hold timer that blocks every later advance.
  it('resumes cycling after reduced motion is toggled during a hold', async () => {
    const container = mount();
    const isPrompt = (text: string) => QUESTIONS.some((question) => question === text);
    await expect.poll(() => isPrompt(typedOf(container)), { timeout: 8000 }).toBe(true);
    const first = typedOf(container);

    write(MOTION_STORAGE_KEY, false);
    write(MOTION_STORAGE_KEY, null);

    await expect.poll(() => typedOf(container) !== first, { timeout: 8000 }).toBe(true);
  });

  // The element lives inside the boot overlay, which is visibility:hidden once
  // `html.boot` drops — but it stays connected forever. Without gating, the typewriter
  // keeps mutating (invisible) layout and burning timers, and every keystroke still
  // counts toward CLS.
  it('freezes the typewriter once the boot phase ends', async () => {
    const container = mount();
    await expect.poll(() => typedOf(container).length, { timeout: 5000 }).toBeGreaterThan(2);

    document.documentElement.classList.remove('boot');
    // Let the MutationObserver deliver, then take the frozen baseline.
    await flush(300);
    const frozen = typedOf(container);

    // Long enough for several keystrokes (46ms) and a HOLD_MS advance.
    await flush(2500);
    expect(typedOf(container)).toBe(frozen);
  });
});
