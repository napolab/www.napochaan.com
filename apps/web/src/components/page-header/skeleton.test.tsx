import { render } from 'vitest-browser-react';
import { describe, expect, it } from 'vitest';
import { page } from 'vitest/browser';

import { PageHeaderSkeleton } from './skeleton';

describe('PageHeaderSkeleton', () => {
  it('renders a decorative placeholder marked aria-hidden', async () => {
    const screen = await render(<PageHeaderSkeleton />);
    const root = screen.container.querySelector('[aria-hidden="true"]');
    expect(root).not.toBeNull();
  });

  it('exposes no heading to the accessibility tree', async () => {
    await render(<PageHeaderSkeleton />);
    await expect.element(page.getByRole('heading')).not.toBeInTheDocument();
  });

  it('exposes no interactive controls', async () => {
    await render(<PageHeaderSkeleton />);
    await expect.element(page.getByRole('link')).not.toBeInTheDocument();
    await expect.element(page.getByRole('button')).not.toBeInTheDocument();
  });

  it('reserves exact width by rendering the known title text masked in the DOM', async () => {
    const screen = await render(<PageHeaderSkeleton title="archive" />);
    expect(screen.container.textContent).toContain('archive');
  });

  it('renders the title slot as a bar without the text when title is omitted', async () => {
    const screen = await render(<PageHeaderSkeleton kicker="// who · what · why" />);
    expect(screen.container.textContent).not.toContain('archive');
    expect(screen.container.textContent).toContain('// who · what · why');
  });
});
