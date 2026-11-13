import { render } from 'vitest-browser-react';
import { describe, expect, it } from 'vitest';
import { page } from 'vitest/browser';

import { Toc } from './index';

describe('Toc', () => {
  it('renders an in-page fragment link per heading', async () => {
    await render(
      <Toc
        headings={[
          { level: 2, text: 'A', slug: 'a' },
          { level: 3, text: 'B', slug: 'b' },
        ]}
      />,
    );

    await expect.element(page.getByRole('link', { name: 'A' })).toHaveAttribute('href', '#a');
    await expect.element(page.getByRole('link', { name: 'B' })).toHaveAttribute('href', '#b');
  });

  it('renders nothing when there are no headings', async () => {
    const { container } = await render(<Toc headings={[]} />);

    expect(container.querySelector('nav')).toBeNull();
  });
});
