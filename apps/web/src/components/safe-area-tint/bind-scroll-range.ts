// Framework-free core of ScrollRangeSync, shared by the React ScrollRangeSync
// (./scroll-range-sync.tsx) and the `<scroll-range-sync>` custom element (./element.ts).
//
// Publishes --scroll-range (body height - innerHeight), --viewport-h (innerHeight) and
// --doc-h (body height) onto the tint root (the element marked with
// SCROLL_RANGE_HOST_ATTRIBUTE), so the safeAreaChase / safeAreaChaseBottom
// scroll-timeline keyframes (panda.config.ts) can map timeline progress back to
// document pixels. The scroll-timeline range and the viewport height are not
// expressible in CSS units, so they must be measured and published as custom
// properties.
//
// Cost model (this runs on every page):
// - The variables live on the tint root, the only consumer (its strips inherit them).
//   On <html> every write restyled the whole document.
// - No layout is read at bind: the body height comes from the ResizeObserver entry
//   (delivered right after a layout, so reading innerHeight there is free), and the
//   first entry arrives with the first frame.
// - A write happens only when a value actually changed, so body resizes that keep the
//   height (width-only changes, a persist move) and repeated resize events are free.
//
// visualViewport resize is listened to as well: iOS fires it continuously while the
// Safari toolbar collapses/expands, which re-syncs the strips during the transition
// instead of after it.

export const SCROLL_RANGE_HOST_ATTRIBUTE = 'data-scroll-range-host';

const AFTER_SWAP_EVENT = 'astro:after-swap';

type Published = { docHeight: number; viewportHeight: number };

// The body BOX height, not scrollHeight: scrollHeight includes the chin strip's own
// absolute overflow, which would feed back into the range it is positioned by.
// borderBoxSize is fractional; offsetHeight (what this published before) rounds.
const bodyHeightOf = (entry: ResizeObserverEntry): number => Math.round(entry.borderBoxSize[0]?.blockSize ?? entry.contentRect.height);

const write = (host: HTMLElement, { docHeight, viewportHeight }: Published): void => {
  host.style.setProperty('--scroll-range', `${Math.max(0, docHeight - viewportHeight)}px`);
  host.style.setProperty('--viewport-h', `${viewportHeight}px`);
  host.style.setProperty('--doc-h', `${docHeight}px`);
};

// Publishes on the first body measurement and on every window / visualViewport resize
// and body size change; returns the unbind.
export const bindScrollRange = (host: HTMLElement): (() => void) => {
  const state: { docHeight: number | undefined; last: Published | undefined } = { docHeight: undefined, last: undefined };

  const publish = (): void => {
    if (state.docHeight === undefined) return; // not measured yet: the first entry publishes
    const next = { docHeight: state.docHeight, viewportHeight: window.innerHeight };
    if (state.last?.docHeight === next.docHeight && state.last.viewportHeight === next.viewportHeight) return;
    state.last = next;
    write(host, next);
  };

  const observer = new ResizeObserver((entries) => {
    const entry = entries.at(-1);
    if (entry === undefined) return;
    state.docHeight = bodyHeightOf(entry);
    publish();
  });
  observer.observe(document.body);
  // Astro ClientRouter replaces <body> on every soft navigation while the tint
  // persists, so move the observer to the new body after each swap (observing
  // delivers a fresh initial entry, which re-measures).
  const observeSwappedBody = (): void => {
    observer.disconnect();
    observer.observe(document.body);
  };
  document.addEventListener(AFTER_SWAP_EVENT, observeSwappedBody);
  window.addEventListener('resize', publish);
  window.visualViewport?.addEventListener('resize', publish);

  return () => {
    window.visualViewport?.removeEventListener('resize', publish);
    window.removeEventListener('resize', publish);
    document.removeEventListener(AFTER_SWAP_EVENT, observeSwappedBody);
    observer.disconnect();
  };
};
