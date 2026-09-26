import { render } from 'vitest-browser-react';
import { describe, expect, it, vi } from 'vitest';
import { page } from 'vitest/browser';

import { PageHeader } from './index';
import { TightPageHeader } from './tight';

// next/font/google's package entry is a build-time-only stub outside Next's own
// compiler pipeline (calling it under plain vitest throws "... is not a
// function" — see themes/font-vars.test.ts), so @themes/fonts-title cannot run
// as-is here. Stub it with a fixed class name and assert TightPageHeader wires
// it onto the h1 — that wiring, not the real font CSS, is what this test covers.
vi.mock('@themes/fonts-title', () => ({ titleFontVariable: 'test-title-font' }));

const breadcrumbs = [{ href: '/', label: 'home' }, { href: '/works', label: 'works' }, { label: 'archive' }] as const;

describe('TightPageHeader', () => {
  it('renders the title as the page h1 with tight tracking', async () => {
    await render(<TightPageHeader title="archive" breadcrumbs={breadcrumbs} />);
    const heading = page.getByRole('heading', { level: 1, name: 'archive' });
    await expect.element(heading).toBeInTheDocument();
    await expect.element(heading).toHaveAttribute('data-tracking', 'tight');
  });

  it('applies the Zen Kaku Gothic New font variable class to the h1', async () => {
    await render(<TightPageHeader title="archive" breadcrumbs={breadcrumbs} />);
    const heading = page.getByRole('heading', { level: 1, name: 'archive' });
    await expect.element(heading).toHaveClass('test-title-font');
  });
});

describe('PageHeader type guard', () => {
  it('does not accept titleTracking="tight" (compile-time only — never rendered)', () => {
    const buildRejectedElement = () => {
      // @ts-expect-error -- 'tight' is not part of PageHeader's public Props; only TightPageHeader (which also supplies the font) accepts it.
      return <PageHeader title="archive" breadcrumbs={breadcrumbs} titleTracking="tight" />;
    };
    expect(typeof buildRejectedElement).toBe('function');
  });
});
