import { render } from 'vitest-browser-react';
import { describe, expect, it } from 'vitest';
import { page } from 'vitest/browser';

import { TagCloud } from './index';

describe('TagCloud', () => {
  it('renders a tag for each item', async () => {
    await render(<TagCloud items={['React', 'TypeScript']} />);

    await expect.element(page.getByText('React')).toBeInTheDocument();
    await expect.element(page.getByText('TypeScript')).toBeInTheDocument();
  });

  it('renders one list item per entry', async () => {
    const { container } = await render(<TagCloud items={['a', 'b', 'c']} />);

    expect(container.querySelectorAll('li')).toHaveLength(3);
  });
});
