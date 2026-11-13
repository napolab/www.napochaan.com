import { render } from 'vitest-browser-react';
import { afterEach, describe, expect, it } from 'vitest';
import { page } from 'vitest/browser';

import { useMotion } from '@hooks/use-prefers-reduced-motion';
import { write } from '@utils/persistent-store';
import { MOTION_STORAGE_KEY } from '@utils/prefers-reduced-motion';

import { MotionProvider } from './index';

// Every island wraps its tree in its own (uncontrolled) MotionProvider. The effective
// value is derived from the module-level persistent store + matchMedia, so a toggle
// in the SysBar root must reach a reduced-motion consumer in another root.
const Motion = ({ id }: { id: string }) => {
  const { reduced, toggle } = useMotion();

  return (
    <button type="button" data-testid={id} onClick={toggle}>
      {reduced ? 'reduced' : 'motion'}
    </button>
  );
};

afterEach(() => {
  write(MOTION_STORAGE_KEY, null);
  localStorage.clear();
  document.documentElement.style.removeProperty('--motion-play');
  document.cookie = 'motion=; path=/; max-age=0';
});

describe('motion preference across React roots', () => {
  it('propagates the toggle to a provider in another root', async () => {
    await render(
      <MotionProvider>
        <Motion id="island-a" />
      </MotionProvider>,
    );
    await render(
      <MotionProvider>
        <Motion id="island-b" />
      </MotionProvider>,
    );
    await expect.element(page.getByTestId('island-b')).toHaveTextContent('motion');

    await page.getByTestId('island-a').click();

    await expect.element(page.getByTestId('island-b')).toHaveTextContent('reduced');
    expect(document.documentElement.style.getPropertyValue('--motion-play')).toBe('paused');
  });
});
