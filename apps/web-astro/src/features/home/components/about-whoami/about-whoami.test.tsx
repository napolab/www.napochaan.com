import { render } from 'vitest-browser-react';
import { describe, expect, it } from 'vitest';
import { page } from 'vitest/browser';

import { AboutWhoami } from './index';

describe('AboutWhoami', () => {
  it('renders a whoami block with skills', async () => {
    await render(<AboutWhoami skills={['TypeScript', 'React']} now="DJ / VJ" likes="dubstep" wants="…" />);
    await expect.element(page.getByText('$ whoami').first()).toBeInTheDocument();
    await expect.element(page.getByText('TypeScript · React')).toBeInTheDocument();
  });
});
