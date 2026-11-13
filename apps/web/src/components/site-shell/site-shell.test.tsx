import { render } from 'vitest-browser-react';
import { describe, expect, it } from 'vitest';
import { page } from 'vitest/browser';

import { ShellBackdrop } from './index';

// The Next SiteShell wrapped the page; on Astro the persisted shell is a set of
// siblings around the swapped page <main>. ShellBackdrop is the server reference
// markup for shell-backdrop.astro. The SysBar and the cursor layer are custom
// elements now: see sys-bar/element*.test.tsx and cursor-presence/element.test.tsx.
describe('shell backdrop', () => {
  it('renders the backdrop: safe-area tint, typography band and the life canvas', async () => {
    const { container } = await render(<ShellBackdrop />);

    await expect.element(page.getByTestId('safe-area-tint')).toBeInTheDocument();
    expect(container.querySelectorAll('[data-testid="typography-band"]')).toHaveLength(4);
    expect(container.querySelector('canvas')).not.toBeNull();
  });
});
