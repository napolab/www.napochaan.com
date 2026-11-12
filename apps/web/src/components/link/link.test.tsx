import { render } from 'vitest-browser-react';
import { describe, expect, it } from 'vitest';
import { page } from 'vitest/browser';

import { Link } from './index';

describe('Link', () => {
  it('renders an anchor with href and label', async () => {
    render(<Link href="/works">作品</Link>);
    const link = page.getByRole('link', { name: '作品' });
    await expect.element(link).toBeInTheDocument();
    await expect.element(link).toHaveAttribute('href', '/works');
  });
  it('passes through target/rel', async () => {
    render(
      <Link href="https://example.com" target="_blank" rel="noreferrer">
        外部
      </Link>,
    );
    const link = page.getByRole('link', { name: '外部' });
    await expect.element(link).toHaveAttribute('target', '_blank');
    await expect.element(link).toHaveAttribute('rel', 'noreferrer');
  });
});
