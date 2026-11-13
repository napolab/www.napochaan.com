import { render } from 'vitest-browser-react';
import { describe, expect, it } from 'vitest';
import { page } from 'vitest/browser';

import { AboutMasthead } from './index';

describe('AboutMasthead', () => {
  it('renders the name as the page h1', async () => {
    await render(<AboutMasthead name="naporitan" kicker="// programmer" lead="tagline" />);

    await expect.element(page.getByRole('heading', { level: 1, name: 'naporitan' })).toBeInTheDocument();
  });

  it('renders the kicker and lead text', async () => {
    await render(<AboutMasthead name="naporitan" kicker="// programmer · since 2020" lead="ReactとTypeScriptのオタク" />);

    await expect.element(page.getByText('// programmer · since 2020')).toBeInTheDocument();
    // TypewriterText keeps an srOnly copy plus the typed overlay, so scope to the first match.
    await expect.element(page.getByText('ReactとTypeScriptのオタク').first()).toBeInTheDocument();
  });
});
