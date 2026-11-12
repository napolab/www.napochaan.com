import { render } from 'vitest-browser-react';
import { describe, expect, it } from 'vitest';
import { page } from 'vitest/browser';

import { LogTimeline } from './index';

import type { LogYearGroup } from '../../_lib/build-log-timeline';

const groups: LogYearGroup[] = [
  {
    year: 2026,
    items: [{ id: 'news-1', year: 2026, date: '06.01', meta: 'live', title: 'gig at the club', upcoming: false, href: '/news/1' }],
  },
  {
    year: 2025,
    items: [{ id: 'work-1', year: 2025, date: '—', meta: 'graphic', title: 'old key visual', upcoming: false, href: '/works/1' }],
  },
];

describe('LogTimeline', () => {
  it('renders each year as a level-2 heading and lists its entry titles', async () => {
    await render(<LogTimeline groups={groups} />);

    await expect.element(page.getByRole('heading', { level: 2, name: '2026' })).toBeInTheDocument();
    await expect.element(page.getByRole('heading', { level: 2, name: '2025' })).toBeInTheDocument();
    await expect.element(page.getByText('gig at the club')).toBeInTheDocument();
    await expect.element(page.getByText('old key visual')).toBeInTheDocument();
  });

  it('links each entry title to its href', async () => {
    await render(<LogTimeline groups={groups} />);

    await expect.element(page.getByRole('link', { name: 'gig at the club' })).toHaveAttribute('href', '/news/1');
    await expect.element(page.getByRole('link', { name: 'old key visual' })).toHaveAttribute('href', '/works/1');
  });
});
