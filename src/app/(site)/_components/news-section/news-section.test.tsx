import { render } from 'vitest-browser-react';
import { describe, expect, it } from 'vitest';
import { page } from 'vitest/browser';

import { NewsSection } from './index';

const items = [{ id: '1', date: '2026.06.05', category: 'site', title: 'サイトを rebuild 中', href: '/news/1' }];

describe('NewsSection', () => {
  it('renders a news heading and entries', async () => {
    await render(<NewsSection items={items} />);
    await expect.element(page.getByRole('heading', { name: /news/ })).toBeInTheDocument();
    await expect.element(page.getByText('サイトを rebuild 中')).toBeInTheDocument();
    await expect.element(page.getByText('2026.06.05')).toBeInTheDocument();
  });
});
