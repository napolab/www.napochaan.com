import { render } from 'vitest-browser-react';
import { describe, expect, it } from 'vitest';
import { page } from 'vitest/browser';

import { FontRoles } from './index';

const fonts = [
  { family: 'digibop', role: 'display', why: '見出しで殴る役。' },
  { family: 'M PLUS 1', role: 'body', why: '和文の可読性。' },
] as const;

describe('FontRoles', () => {
  it('renders each family, role and why', async () => {
    await render(<FontRoles fonts={fonts} />);

    await expect.element(page.getByText('digibop')).toBeInTheDocument();
    await expect.element(page.getByText('display')).toBeInTheDocument();
    await expect.element(page.getByText('見出しで殴る役。')).toBeInTheDocument();
    await expect.element(page.getByText('M PLUS 1')).toBeInTheDocument();
  });

  it('renders one row per font', async () => {
    const { container } = await render(<FontRoles fonts={fonts} />);

    expect(container.querySelectorAll('dt')).toHaveLength(2);
    expect(container.querySelectorAll('dd')).toHaveLength(2);
  });

  it('tags each family specimen with its font token', async () => {
    const { container } = await render(<FontRoles fonts={fonts} />);

    expect(container.querySelector('[data-font="display"]')).not.toBeNull();
    expect(container.querySelector('[data-font="body"]')).not.toBeNull();
  });
});
