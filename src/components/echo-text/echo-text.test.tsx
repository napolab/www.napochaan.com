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
});
