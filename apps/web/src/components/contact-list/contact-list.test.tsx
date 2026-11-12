import { render } from 'vitest-browser-react';
import { describe, expect, it } from 'vitest';
import { page } from 'vitest/browser';

import { ContactList } from './index';

describe('ContactList', () => {
  it('renders an external link with the handle, href, target and rel', async () => {
    await render(<ContactList items={[{ label: 'github', handle: 'napolab', href: 'https://github.com/napolab' }]} />);

    const link = page.getByRole('link', { name: /napolab/ });
    await expect.element(link).toHaveAttribute('href', 'https://github.com/napolab');
    await expect.element(link).toHaveAttribute('target', '_blank');
    await expect.element(link).toHaveAttribute('rel', 'noopener noreferrer');
  });
});
