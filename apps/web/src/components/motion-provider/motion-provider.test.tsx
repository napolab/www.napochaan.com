import { render } from 'vitest-browser-react';
import { afterEach, describe, expect, it } from 'vitest';
import { page } from 'vitest/browser';

import { write } from '@utils/persistent-store';
import { useMotion } from '@hooks/use-prefers-reduced-motion';
import { MOTION_STORAGE_KEY } from '@utils/prefers-reduced-motion';

import { MotionProvider } from './index';

const Consumer = () => {
  const { reduced, toggle } = useMotion();

  return (
    <button type="button" onClick={toggle} data-testid="motion">
      {reduced ? 'reduced' : 'motion'}
    </button>
  );
};

afterEach(() => {
  // The toggle persists the override through persistent-store, which keeps an in-memory
  // module cache that localStorage.clear() alone does NOT reset — so write the null
  // (OS-following) default back through the same API to truly reset every test to
  // "no override". Also clear localStorage, drop the inline CSS var the provider writes
  // on <html>, and delete the motion cookie the toggle mirrors — none may leak forward.
  write(MOTION_STORAGE_KEY, null);
  localStorage.clear();
  document.documentElement.style.removeProperty('--motion-play');
  document.cookie = 'motion=; path=/; max-age=0';
});

describe('MotionProvider', () => {
  it('toggles the effective reduced-motion value and back', async () => {
    render(
      <MotionProvider>
        <Consumer />
      </MotionProvider>,
    );
    const button = page.getByTestId('motion');
    // Test env does not request reduce, and there is no override yet → motion on.
    await expect.element(button).toHaveTextContent('motion');

    await button.click();
    await expect.element(button).toHaveTextContent('reduced');

    await button.click();
    await expect.element(button).toHaveTextContent('motion');
  });

  it('bridges the effective preference to the --motion-play CSS variable on <html>', async () => {
    render(
      <MotionProvider>
        <Consumer />
      </MotionProvider>,
    );
    const button = page.getByTestId('motion');
    await expect.element(button).toHaveTextContent('motion');
    expect(document.documentElement.style.getPropertyValue('--motion-play')).toBe('running');

    await button.click();
    await expect.element(button).toHaveTextContent('reduced');
    expect(document.documentElement.style.getPropertyValue('--motion-play')).toBe('paused');
  });

  it('mirrors the toggled override into the motion cookie', async () => {
    render(
      <MotionProvider>
        <Consumer />
      </MotionProvider>,
    );
    const button = page.getByTestId('motion');
    await expect.element(button).toHaveTextContent('motion');

    await button.click();
    await expect.element(button).toHaveTextContent('reduced');
    expect(document.cookie).toContain('motion=off');

    await button.click();
    await expect.element(button).toHaveTextContent('motion');
    expect(document.cookie).toContain('motion=on');
  });

  it('lets a controlled reduced prop win over toggling', async () => {
    render(
      <MotionProvider reduced>
        <Consumer />
      </MotionProvider>,
    );
    const button = page.getByTestId('motion');
    await expect.element(button).toHaveTextContent('reduced');

    await button.click();
    await expect.element(button).toHaveTextContent('reduced');
  });
});
