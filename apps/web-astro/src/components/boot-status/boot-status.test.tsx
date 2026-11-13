import { render } from 'vitest-browser-react';
import { describe, expect, it } from 'vitest';
import { page } from 'vitest/browser';

import { BootStatusProvider, useBootReady } from './index';

const Consumer = () => {
  const ready = useBootReady();
  return <div data-testid="value">{`${ready}`}</div>;
};

describe('boot-status', () => {
  it('reports ready when the target is not booting at mount', async () => {
    const target = document.createElement('div');
    render(
      <BootStatusProvider target={target}>
        <Consumer />
      </BootStatusProvider>,
    );
    await expect.element(page.getByTestId('value')).toHaveTextContent('true');
  });

  it('waits while booting then flips ready when the boot class is removed', async () => {
    const target = document.createElement('div');
    target.classList.add('boot');
    render(
      <BootStatusProvider target={target}>
        <Consumer />
      </BootStatusProvider>,
    );
    await expect.element(page.getByTestId('value')).toHaveTextContent('false');
    target.classList.remove('boot');
    await expect.element(page.getByTestId('value')).toHaveTextContent('true');
  });
});
