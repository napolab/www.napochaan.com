import { navigate } from 'astro:transitions/client';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { render, renderHook } from 'vitest-browser-react';
import { page } from 'vitest/browser';

import { PathnameProvider, usePathname, useRouter } from './index';

import type { ReactNode } from 'react';

const PathnameProbe = () => <p data-testid="pathname">{usePathname()}</p>;

describe('usePathname', () => {
  const initialPath = `${location.pathname}${location.search}`;

  afterEach(() => {
    history.replaceState(null, '', initialPath);
  });

  it('returns the provider pathname on first render', async () => {
    await render(
      <PathnameProvider pathname="/works/alpha">
        <PathnameProbe />
      </PathnameProvider>,
    );

    await expect.element(page.getByTestId('pathname')).toHaveTextContent('/works/alpha');
  });

  it('follows location.pathname after astro:page-load', async () => {
    await render(
      <PathnameProvider pathname="/works/alpha">
        <PathnameProbe />
      </PathnameProvider>,
    );
    await expect.element(page.getByTestId('pathname')).toHaveTextContent('/works/alpha');

    history.pushState(null, '', '/blog/hello');
    document.dispatchEvent(new Event('astro:page-load'));

    await expect.element(page.getByTestId('pathname')).toHaveTextContent('/blog/hello');
  });
});

describe('useRouter', () => {
  const wrapper = ({ children }: { children: ReactNode }) => <PathnameProvider pathname="/">{children}</PathnameProvider>;

  beforeEach(() => {
    vi.mocked(navigate).mockClear();
  });

  it('push navigates to the href', async () => {
    const { result } = await renderHook(() => useRouter(), { wrapper });
    result.current.push('/blog');
    expect(navigate).toHaveBeenCalledWith('/blog');
  });

  it('replace navigates with history: replace', async () => {
    const { result } = await renderHook(() => useRouter(), { wrapper });
    result.current.replace('/about');
    expect(navigate).toHaveBeenCalledWith('/about', { history: 'replace' });
  });

  it('refresh re-navigates to the current URL with history: replace', async () => {
    const { result } = await renderHook(() => useRouter(), { wrapper });
    result.current.refresh();
    expect(navigate).toHaveBeenCalledWith(`${location.pathname}${location.search}`, { history: 'replace' });
  });

  // Next's router.refresh() kept the scroll position; Astro's same-page navigation
  // scrolls to the top. Live Preview refreshes on every autosave, so the editor's
  // viewport must not jump.
  it('refresh restores the scroll position after the swap', async () => {
    const scrollTo = vi.spyOn(window, 'scrollTo').mockImplementation(() => {});
    vi.spyOn(window, 'scrollY', 'get').mockReturnValue(640);
    vi.spyOn(window, 'scrollX', 'get').mockReturnValue(0);
    const { result } = await renderHook(() => useRouter(), { wrapper });
    result.current.refresh();
    await vi.waitFor(() => expect(scrollTo).toHaveBeenCalledWith({ left: 0, top: 640, behavior: 'instant' }));
    vi.restoreAllMocks();
  });
});
