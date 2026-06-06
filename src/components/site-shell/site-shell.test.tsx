import { render } from 'vitest-browser-react';
import { describe, expect, it } from 'vitest';
import { page } from 'vitest/browser';

import { SiteShell } from './index';

describe('SiteShell', () => {
  it('renders children inside the content stage', async () => {
    await render(
      <SiteShell>
        <p>hello</p>
      </SiteShell>,
    );
    await expect.element(page.getByText('hello')).toBeInTheDocument();
  });

  it('renders the site footer', async () => {
    await render(
      <SiteShell>
        <p>hello</p>
      </SiteShell>,
    );
    await expect.element(page.getByRole('contentinfo')).toBeInTheDocument();
  });
});
