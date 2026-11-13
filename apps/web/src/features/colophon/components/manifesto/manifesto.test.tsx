import { render } from 'vitest-browser-react';
import { describe, expect, it } from 'vitest';
import { page } from 'vitest/browser';

import { Manifesto } from './index';

const items = [
  { no: '所見 01', term: 'テストを先に書く。', description: 'Red Green Refactor。' },
  { no: '所見 02', term: '状態を書き換えない。', description: 'const だけ。' },
];

describe('Manifesto', () => {
  it('renders each tenet marker, term and description', async () => {
    await render(<Manifesto items={items} />);

    await expect.element(page.getByText('所見 01')).toBeInTheDocument();
    await expect.element(page.getByText('テストを先に書く。')).toBeInTheDocument();
    await expect.element(page.getByText('Red Green Refactor。')).toBeInTheDocument();
    await expect.element(page.getByText('所見 02')).toBeInTheDocument();
    await expect.element(page.getByText('状態を書き換えない。')).toBeInTheDocument();
    await expect.element(page.getByText('const だけ。')).toBeInTheDocument();
  });

  it('renders one row per tenet', async () => {
    const { container } = await render(<Manifesto items={items} />);

    expect(container.querySelectorAll('dt')).toHaveLength(2);
    expect(container.querySelectorAll('dd')).toHaveLength(2);
  });
});
