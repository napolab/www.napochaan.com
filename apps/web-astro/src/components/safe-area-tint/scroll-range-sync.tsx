'use client';

import { useEffect } from 'react';

// Publishes --scroll-range (scrollHeight - innerHeight) and --viewport-h
// (innerHeight) onto <html>, so the safeAreaChase / safeAreaChaseBottom
// scroll-timeline keyframes (panda.config.ts) can map timeline progress back to
// document pixels. Listens to visualViewport resize as well: iOS fires it
// continuously while the Safari toolbar collapses/expands, which re-syncs the
// strips during the transition instead of after it. Renders nothing.
export const ScrollRangeSync = () => {
  useEffect(() => {
    // USEEFFECT_JUSTIFICATION: imperative DOM write — the scroll-timeline range
    // (scrollHeight - innerHeight) and the viewport height are not expressible
    // in CSS units, so they must be measured and published as CSS custom
    // properties; re-measured on window/visualViewport resize and body size
    // changes.
    const publish = (): void => {
      const root = document.documentElement;
      // Measure the body BOX, not scrollHeight: scrollHeight includes the chin
      // strip's own absolute overflow, which would feed back into the range it
      // is positioned by.
      const docHeight = document.body.offsetHeight;
      const range = Math.max(0, docHeight - window.innerHeight);
      root.style.setProperty('--scroll-range', `${range}px`);
      root.style.setProperty('--viewport-h', `${window.innerHeight}px`);
      root.style.setProperty('--doc-h', `${docHeight}px`);
    };
    publish();

    const observer = new ResizeObserver(publish);
    observer.observe(document.body);
    window.addEventListener('resize', publish);
    window.visualViewport?.addEventListener('resize', publish);

    return () => {
      window.visualViewport?.removeEventListener('resize', publish);
      window.removeEventListener('resize', publish);
      observer.disconnect();
    };
  }, []);

  return null;
};
