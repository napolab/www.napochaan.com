import { navigate } from 'astro:transitions/client';
import { render } from 'vitest-browser-react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { page } from 'vitest/browser';

import { sharedLifeEngine } from '@components/game-of-life/provider';

import { CursorPresenceIsland, ShellBackdrop, SysBarIsland } from './index';

// The Next SiteShell wrapped the page; on Astro the persisted shell is a set of
// siblings around the swapped page <main>. SysBar and the cursor layer are islands;
// ShellBackdrop is the server reference markup for shell-backdrop.astro.

afterEach(() => {
  vi.mocked(navigate).mockClear();
});

describe('shell islands', () => {
  it('renders the backdrop: safe-area tint, typography band and the life canvas', async () => {
    const { container } = await render(<ShellBackdrop />);

    await expect.element(page.getByTestId('safe-area-tint')).toBeInTheDocument();
    expect(container.querySelectorAll('[data-testid="typography-band"]')).toHaveLength(4);
    expect(container.querySelector('canvas')).not.toBeNull();
  });

  it('renders the SysBar with the active nav item from the page pathname', async () => {
    await render(<SysBarIsland pathname="/works/alpha" props={{ initialTime: '12:34:56' }} />);

    const nav = page.getByRole('navigation', { name: 'グローバルナビゲーション' });
    await expect.element(nav.getByRole('link', { name: 'works' })).toHaveAttribute('data-active', 'true');
  });

  it('shows the generation of the shared life engine (fed by the backdrop island)', async () => {
    await render(<SysBarIsland pathname="/" props={{ initialTime: '12:34:56' }} />);
    sharedLifeEngine.tick();

    await expect.element(page.getByText(`gen ${`${sharedLifeEngine.getState().generation}`.padStart(4, '0')}`)).toBeInTheDocument();
  });

  it('routes SysBar links through Astro navigate', async () => {
    await render(<SysBarIsland pathname="/" props={{ initialTime: '12:34:56' }} />);

    await page.getByRole('navigation', { name: 'グローバルナビゲーション' }).getByRole('link', { name: 'blog' }).click();

    expect(navigate).toHaveBeenCalledWith('/blog');
  });

  it('mounts the cursor presence layer without wrapping page content', async () => {
    const { container } = await render(<CursorPresenceIsland pathname="/" props={{}} />);

    expect(container.querySelector('canvas')).not.toBeNull();
    expect(container.querySelector('[data-cursor-surface]')).toBeNull();
  });
});
