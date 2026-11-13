import { render } from 'vitest-browser-react';
import { afterEach, describe, expect, it } from 'vitest';
import { page } from 'vitest/browser';

import { useBootReady } from './index';

// Islands mount with no BootStatusProvider, so every root falls back to the
// module-level store observing <html>. Two roots must flip together when the boot
// class is lifted.
const Ready = ({ id }: { id: string }) => {
  const ready = useBootReady();

  return <output data-testid={id}>{`${ready}`}</output>;
};

afterEach(() => {
  document.documentElement.classList.remove('boot');
});

describe('boot status across React roots', () => {
  it('flips every root to ready when <html> drops the boot class', async () => {
    document.documentElement.classList.add('boot');
    await render(<Ready id="island-a" />);
    await render(<Ready id="island-b" />);
    await expect.element(page.getByTestId('island-a')).toHaveTextContent('false');
    await expect.element(page.getByTestId('island-b')).toHaveTextContent('false');

    document.documentElement.classList.remove('boot');

    await expect.element(page.getByTestId('island-a')).toHaveTextContent('true');
    await expect.element(page.getByTestId('island-b')).toHaveTextContent('true');
  });
});
