import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { page, userEvent } from 'vitest/browser';

import { RETRY_BUTTON_TAG, RetryButtonElement, defineRetryButtonElement } from './element';

const mount = () => {
  const container = document.createElement('div');
  container.innerHTML = `<${RETRY_BUTTON_TAG}><button type="button">retry</button></${RETRY_BUTTON_TAG}>`;
  document.body.appendChild(container);
  const element = container.querySelector(RETRY_BUTTON_TAG);
  if (!(element instanceof RetryButtonElement)) throw new Error('not upgraded');
  const reload = vi.fn();
  element.reload = reload;
  return reload;
};

describe('<retry-button>', () => {
  beforeEach(() => {
    defineRetryButtonElement();
  });

  afterEach(() => {
    document.body.replaceChildren();
  });

  it('reloads the page when the button is pressed', async () => {
    const reload = mount();
    await page.getByRole('button', { name: 'retry' }).click();
    expect(reload).toHaveBeenCalledOnce();
  });

  it('reloads from the keyboard (Enter on the focused button)', async () => {
    const reload = mount();
    page.getByRole('button', { name: 'retry' }).element().focus();
    await userEvent.keyboard('{Enter}');
    expect(reload).toHaveBeenCalledOnce();
  });

  it('stops listening once disconnected', async () => {
    const reload = mount();
    const button = page.getByRole('button', { name: 'retry' }).element();
    button.closest(RETRY_BUTTON_TAG)?.remove();
    button.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    expect(reload).not.toHaveBeenCalled();
  });
});
