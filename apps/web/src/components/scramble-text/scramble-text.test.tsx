import { act } from 'react';
import { hydrateRoot } from 'react-dom/client';
import { renderToString } from 'react-dom/server';
import { render } from 'vitest-browser-react';
import { describe, expect, it, vi } from 'vitest';
import { page } from 'vitest/browser';

import { MotionProvider } from '@components/motion-provider';
import { write } from '@utils/persistent-store';
import { MOTION_STORAGE_KEY } from '@utils/prefers-reduced-motion';

import { ScrambleText } from './index';

// vi.mock is hoisted above every import, so the spy must be built inside
// vi.hoisted or the factory would read `loadGsap` before initialisation. The spy
// delegates to the real implementation so the existing behaviour tests below
// keep working — only the reduced-motion test cares about call count.
const { loadGsap } = vi.hoisted(() => ({ loadGsap: vi.fn() }));
vi.mock('@utils/gsap', async () => {
  const actual = await vi.importActual<typeof import('@utils/gsap')>('@utils/gsap');
  loadGsap.mockImplementation(actual.loadGsap);
  return { loadGsap };
});

describe('ScrambleText', () => {
  it('renders the text at rest (scramble only fires on hover)', async () => {
    await render(<ScrambleText>hello world</ScrambleText>);
    // The text is rendered twice (width-reserving ghost + animated overlay).
    await expect.element(page.getByText('hello world').first()).toBeInTheDocument();
  });

  it('keeps the text as the accessible name even inside a link', async () => {
    await render(
      <a href="/x" aria-label="archive">
        <ScrambleText>archive</ScrambleText>
      </a>,
    );
    await expect.element(page.getByRole('link', { name: 'archive' })).toBeInTheDocument();
  });

  // `aria-label` is prohibited on a generic (role-less) span — outside a link the
  // text would go silent to AT. Expose the text via a real, non-aria-hidden node
  // (the srOnly copy) instead, and keep the visual ghost/fill aria-hidden.
  it('exposes the text to assistive tech without a prohibited aria-label', async () => {
    const screen = await render(<ScrambleText>archive</ScrambleText>);
    expect(screen.container.querySelector('[aria-label]')).toBeNull();
    const exposed = [...screen.container.querySelectorAll('span')].filter((el) => el.getAttribute('aria-hidden') === null);
    expect(exposed.some((el) => el.textContent === 'archive')).toBe(true);
  });

  // A trailing adornment (e.g. an external-link ↗) renders as an in-flow sibling of
  // the inline ghost so it tucks against the LAST wrapped line instead of orphaning
  // below the atomic inline-block box. Decorative — the caller marks it aria-hidden,
  // so it must not leak into the link's accessible name (which stays the text only).
  it('renders a trailing adornment without leaking into the accessible name', async () => {
    const screen = await render(
      <a href="/x">
        <ScrambleText trailing={<span aria-hidden="true">↗</span>}>archive</ScrambleText>
      </a>,
    );
    await expect.element(page.getByRole('link', { name: 'archive' })).toBeInTheDocument();
    expect(screen.container.textContent).toContain('↗');
  });

  // truncate drives a `data-truncate` hook the styles target so the painted (absolute)
  // fill and the in-flow ghost both clip to a single ellipsised line — a parent's
  // `text-overflow:ellipsis` can't reach the absolute fill on its own.
  it('marks the root for single-line truncation when truncate is set', async () => {
    const screen = await render(<ScrambleText truncate>a very long adjacent work title that overflows</ScrambleText>);
    const root = screen.container.querySelector('[data-truncate]');
    expect(root).not.toBeNull();
  });

  it('does not mark the root for truncation by default', async () => {
    const screen = await render(<ScrambleText>archive</ScrambleText>);
    const root = screen.container.querySelector('[data-truncate]');
    expect(root).toBeNull();
  });

  // Regression: navigating away used to throw "RangeError: Maximum call stack
  // size exceeded at Context.getTweens". The mobile decode then fired via a
  // ScrollTrigger inside a gsap.matchMedia condition, and a decode owned by the
  // outer context cross-linked the two contexts into a cycle that the unmount-time
  // revert() recursed through forever. The in-view trigger is now an
  // IntersectionObserver with one gsap.context per breakpoint branch, so no nested
  // contexts exist — kept to pin that an in-view decode still unmounts cleanly. The
  // mobile branch only runs below 768px, so we force it by stubbing
  // window.matchMedia, and capture window errors across a flush window (the decode
  // and the revert are asynchronous).
  it('unmounts without a getTweens stack overflow on the mobile breakpoint', async () => {
    const original = window.matchMedia.bind(window);
    window.matchMedia = ((query: string) =>
      ({
        matches: query.includes('max-width'),
        media: query,
        onchange: null,
        addListener: () => {},
        removeListener: () => {},
        addEventListener: () => {},
        removeEventListener: () => {},
        dispatchEvent: () => false,
      }) as MediaQueryList) as typeof window.matchMedia;

    const captured: unknown[] = [];
    const onError = (event: ErrorEvent) => captured.push(event.error);
    const onRejection = (event: PromiseRejectionEvent) => captured.push(event.reason);
    window.addEventListener('error', onError);
    window.addEventListener('unhandledrejection', onRejection);

    try {
      const screen = await render(<ScrambleText>archive</ScrambleText>);
      await expect.poll(() => screen.container.querySelector('[data-scrambling]')).not.toBeNull();
      screen.unmount();
      await new Promise((resolve) => setTimeout(resolve, 50));

      const overflow = captured.find((error) => error instanceof RangeError && error.message.includes('call stack'));
      expect(overflow).toBeUndefined();
    } finally {
      window.removeEventListener('error', onError);
      window.removeEventListener('unhandledrejection', onRejection);
      window.matchMedia = original;
    }
  });

  // Spec §4: under reduced motion the gsap import itself must be skipped, not
  // merely no-op'd after loading — the effect returns before bindScramble(), so
  // neither the desktop hover branch nor the mobile in-view branch can bind.
  it('never imports gsap when reduced motion is on', async () => {
    loadGsap.mockClear();
    await render(
      <MotionProvider reduced>
        <ScrambleText>archive</ScrambleText>
      </MotionProvider>,
    );

    await new Promise((resolve) => setTimeout(resolve, 50));
    expect(loadGsap).not.toHaveBeenCalled();
  });

  // A hydrated island (sys-bar) commits its first render with the server snapshot
  // (reduced=false) and runs its effects before re-rendering with the client value: the
  // effect must read the live preference, or every page fetches gsap for a
  // reduced-motion visitor.
  it('never imports gsap while hydrating for a reduced-motion visitor', async () => {
    loadGsap.mockClear();
    write(MOTION_STORAGE_KEY, false);
    const container = document.createElement('div');
    container.innerHTML = renderToString(<ScrambleText>archive</ScrambleText>);
    document.body.appendChild(container);

    const root = await act(async () => hydrateRoot(container, <ScrambleText>archive</ScrambleText>));
    await new Promise((resolve) => setTimeout(resolve, 50));
    expect(loadGsap).not.toHaveBeenCalled();

    act(() => root.unmount());
    container.remove();
    write(MOTION_STORAGE_KEY, null);
  });
});
