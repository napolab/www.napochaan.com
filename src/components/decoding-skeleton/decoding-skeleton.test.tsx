import { render } from 'vitest-browser-react';
import { describe, expect, it } from 'vitest';
import { page } from 'vitest/browser';

import { DecodingSkeleton } from './index';

describe('DecodingSkeleton', () => {
  it('exposes a polite status region', async () => {
    await render(<DecodingSkeleton />);
    await expect.element(page.getByRole('status')).toBeInTheDocument();
  });

  it('announces the default label to screen readers', async () => {
    await render(<DecodingSkeleton />);
    await expect.element(page.getByRole('status')).toHaveTextContent('読み込み中…');
  });

  it('announces a custom label when passed', async () => {
    await render(<DecodingSkeleton label="復号しています" />);
    await expect.element(page.getByRole('status')).toHaveTextContent('復号しています');
  });

  it('renders exactly `rows` decorative rows', async () => {
    const { container } = await render(<DecodingSkeleton rows={4} />);
    expect(container.querySelectorAll('[data-testid="decoding-row"]')).toHaveLength(4);
  });

  it('defaults to 6 decorative rows', async () => {
    const { container } = await render(<DecodingSkeleton />);
    expect(container.querySelectorAll('[data-testid="decoding-row"]')).toHaveLength(6);
  });

  it('hides decorative rows from assistive tech', async () => {
    const { container } = await render(<DecodingSkeleton rows={2} />);
    for (const row of container.querySelectorAll('[data-testid="decoding-row"]')) {
      expect(row.closest('[aria-hidden="true"]')).not.toBeNull();
    }
  });
});
