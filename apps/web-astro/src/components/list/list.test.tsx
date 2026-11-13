import { render } from 'vitest-browser-react';
import { describe, expect, it } from 'vitest';
import { page } from 'vitest/browser';

import { DescriptionList, List } from './index';

describe('List', () => {
  it('renders an unordered list by default', async () => {
    render(<List items={['a', 'b']} />);
    await expect.element(page.getByRole('list')).toBeInTheDocument();
    await expect.element(page.getByText('a')).toBeInTheDocument();
  });

  it('renders an ordered list when ordered', async () => {
    render(<List ordered items={['x']} />);
    await expect.element(page.getByRole('list')).toBeInTheDocument();
    const list = page.getByRole('list').element();
    expect(list.tagName.toLowerCase()).toBe('ol');
  });
});

describe('DescriptionList', () => {
  it('renders terms and descriptions', async () => {
    render(<DescriptionList items={[{ term: 'role', description: 'DJ / VJ' }]} />);
    await expect.element(page.getByText('role')).toBeInTheDocument();
    await expect.element(page.getByText('DJ / VJ')).toBeInTheDocument();
  });
});
