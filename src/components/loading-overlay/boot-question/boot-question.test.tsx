import { render } from 'vitest-browser-react';
import { describe, expect, it, vi } from 'vitest';

import { BootQuestion, nextIndex } from './index';
import { QUESTIONS } from '../questions';

describe('nextIndex', () => {
  it('advances by one and wraps back to zero past the last prompt', () => {
    expect(nextIndex(0, QUESTIONS.length)).toBe(1);
    expect(nextIndex(3, QUESTIONS.length)).toBe(4);
    expect(nextIndex(QUESTIONS.length - 1, QUESTIONS.length)).toBe(0);
  });
});

describe('BootQuestion', () => {
  it('shows the first prompt in full when motion is reduced (no cycling)', async () => {
    // Reduced motion makes the hook jump straight to the full text and the cycle
    // holds on the first prompt, so the assertion is deterministic.
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

    const screen = await render(<BootQuestion />);
    const [first] = QUESTIONS;
    await expect.element(screen.getByText(first)).toBeInTheDocument();

    vi.restoreAllMocks();
  });
});
