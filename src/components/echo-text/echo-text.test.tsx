import { render } from 'vitest-browser-react';
import { describe, expect, it } from 'vitest';
import { page } from 'vitest/browser';

import { EchoText } from './index';

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
});
