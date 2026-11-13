import { render } from 'vitest-browser-react';
import { describe, expect, it } from 'vitest';
import { page } from 'vitest/browser';

import { Whoami } from './index';

describe('Whoami', () => {
  it('renders the term and its associated description', async () => {
    const { container } = await render(<Whoami items={[{ term: 'name', description: 'naporitan' }]} />);

    await expect.element(page.getByText('naporitan')).toBeInTheDocument();

    const dt = container.querySelector('dt');
    const dd = container.querySelector('dd');
    expect(dt?.textContent).toBe('name');
    expect(dd?.textContent).toBe('naporitan');
  });
});
