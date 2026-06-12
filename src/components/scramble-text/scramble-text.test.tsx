import { render } from 'vitest-browser-react';
import { describe, expect, it } from 'vitest';
import { page } from 'vitest/browser';

import { ScrambleText } from './index';

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
  // size exceeded at Context.getTweens". On the MOBILE breakpoint the decode
  // tween fires via a ScrollTrigger created inside a gsap.matchMedia condition;
  // when decode was owned by the outer useGSAP context, invoking it while the
  // conditional context was active cross-linked the two contexts into a cycle,
  // and the unmount-time context.revert() recursed forever. The matchMedia branch
  // only runs below 768px, so we force it by stubbing window.matchMedia. The
  // overflow surfaces asynchronously (deferred ScrollTrigger refresh + revert),
  // so we capture window errors across a flush window instead of asserting sync.
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
      await new Promise((resolve) => setTimeout(resolve, 50));
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
});
