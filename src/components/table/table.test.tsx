import { render } from 'vitest-browser-react';
import { describe, expect, it } from 'vitest';
import { page } from 'vitest/browser';

import { Table } from './index';

describe('Table', () => {
  const columns = [
    { key: 'no', label: 'no' },
    { key: 'title', label: 'title' },
  ];
  const rows = [
    { no: '01', title: 'night vol.13' },
    { no: '02', title: 'techno set' },
  ];

  it('renders a table with column headers', async () => {
    render(<Table columns={columns} rows={rows} />);
    await expect.element(page.getByRole('table')).toBeInTheDocument();
    await expect.element(page.getByRole('columnheader', { name: 'title' })).toBeInTheDocument();
  });

  it('renders cell values', async () => {
    render(<Table columns={columns} rows={rows} />);
    await expect.element(page.getByRole('cell', { name: 'night vol.13' })).toBeInTheDocument();
  });
});
