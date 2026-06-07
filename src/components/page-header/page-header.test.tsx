import { render } from 'vitest-browser-react';
import { describe, expect, it } from 'vitest';
import { page } from 'vitest/browser';

import { PageHeader } from './index';

const breadcrumbs = [{ href: '/', label: 'home' }, { href: '/works', label: 'works' }, { label: 'archive' }] as const;

describe('PageHeader', () => {
  it('renders the title as the page h1', async () => {
    await render(<PageHeader title="archive" breadcrumbs={breadcrumbs} />);
    await expect.element(page.getByRole('heading', { level: 1, name: 'archive' })).toBeInTheDocument();
  });

  it('renders the breadcrumb trail', async () => {
    await render(<PageHeader title="archive" breadcrumbs={breadcrumbs} />);
    await expect.element(page.getByRole('navigation', { name: 'パンくず' })).toBeInTheDocument();
    // The crumb link renders its label twice (ScrambleText width-reserving ghost + overlay).
    await expect.element(page.getByText('works').first()).toBeInTheDocument();
  });

  it('renders the kicker when provided', async () => {
    await render(<PageHeader title="archive" breadcrumbs={breadcrumbs} kicker="// archive — graphic·vj·flyer" />);
    await expect.element(page.getByText('// archive — graphic·vj·flyer')).toBeInTheDocument();
  });

  it('omits the kicker when not provided', async () => {
    await render(<PageHeader title="archive" breadcrumbs={breadcrumbs} />);
    await expect.element(page.getByText('// archive — graphic·vj·flyer')).not.toBeInTheDocument();
  });

  it('renders the lead when provided', async () => {
    await render(<PageHeader title="archive" breadcrumbs={breadcrumbs} lead="過去の制作物の記録。" />);
    await expect.element(page.getByText('過去の制作物の記録。')).toBeInTheDocument();
  });

  it('omits the lead when not provided', async () => {
    await render(<PageHeader title="archive" breadcrumbs={breadcrumbs} />);
    await expect.element(page.getByText('過去の制作物の記録。')).not.toBeInTheDocument();
  });

  it('renders the annotation when provided', async () => {
    await render(<PageHeader title="archive" breadcrumbs={breadcrumbs} annotation="35.6595 / 139.7006" />);
    await expect.element(page.getByText('35.6595 / 139.7006')).toBeInTheDocument();
  });

  it('omits the annotation when not provided', async () => {
    await render(<PageHeader title="archive" breadcrumbs={breadcrumbs} />);
    await expect.element(page.getByText('35.6595 / 139.7006')).not.toBeInTheDocument();
  });
});
