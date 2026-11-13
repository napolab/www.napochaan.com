import { render } from 'vitest-browser-react';
import { describe, expect, it } from 'vitest';
import { page } from 'vitest/browser';

import { SourceLink } from './index';

describe('SourceLink', () => {
  it('opens the repository in a new tab, named by label and handle', async () => {
    await render(<SourceLink href="https://github.com/napolab/www.napochaan.com" label="GitHub" handle="napolab/www.napochaan.com" />);

    const link = page.getByRole('link', { name: /GitHub/ });
    await expect.element(link).toHaveAttribute('href', 'https://github.com/napolab/www.napochaan.com');
    await expect.element(link).toHaveAttribute('target', '_blank');
    await expect.element(link).toHaveAttribute('rel', 'noopener noreferrer');
  });
});
