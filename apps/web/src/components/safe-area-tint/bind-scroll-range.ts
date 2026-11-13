// Framework-free core of ScrollRangeSync, shared by the React ScrollRangeSync
// (./scroll-range-sync.tsx) and the `<scroll-range-sync>` custom element (./element.ts).
//
// Publishes --scroll-range (scrollHeight - innerHeight) and --viewport-h (innerHeight)
// onto <html>, so the safeAreaChase / safeAreaChaseBottom scroll-timeline keyframes
// (panda.config.ts) can map timeline progress back to document pixels. Listens to
// visualViewport resize as well: iOS fires it continuously while the Safari toolbar
// collapses/expands, which re-syncs the strips during the transition instead of after
// it. The scroll-timeline range and the viewport height are not expressible in CSS
// units, so they must be measured and published as CSS custom properties.

const AFTER_SWAP_EVENT = 'astro:after-swap';

const publish = (): void => {
  const root = document.documentElement;
  // Measure the body BOX, not scrollHeight: scrollHeight includes the chin strip's own
  // absolute overflow, which would feed back into the range it is positioned by.
  const docHeight = document.body.offsetHeight;
  const range = Math.max(0, docHeight - window.innerHeight);
  root.style.setProperty('--scroll-range', `${range}px`);
  root.style.setProperty('--viewport-h', `${window.innerHeight}px`);
  root.style.setProperty('--doc-h', `${docHeight}px`);
};

// Publishes now and on every window / visualViewport resize and body size change;
// returns the unbind.
export const bindScrollRange = (): (() => void) => {
  publish();

  const observer = new ResizeObserver(publish);
  observer.observe(document.body);
  // Astro ClientRouter replaces <body> on every soft navigation while the tint
  // persists, so move the observer to the new body after each swap.
  const observeSwappedBody = (): void => {
    observer.disconnect();
    observer.observe(document.body);
    publish();
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
