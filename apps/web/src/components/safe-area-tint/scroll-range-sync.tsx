'use client';

import { useEffect } from 'react';

import { SCROLL_RANGE_HOST_ATTRIBUTE, bindScrollRange } from './bind-scroll-range';

// Publishes --scroll-range / --viewport-h / --doc-h onto the tint root marked with
// SCROLL_RANGE_HOST_ATTRIBUTE (see ./bind-scroll-range, shared with the
// <scroll-range-sync> element). Renders nothing, so it has no DOM node of its own to
// start from: it binds the single marked host in the document (SafeAreaTint renders
// exactly one).
export const ScrollRangeSync = () => {
  useEffect(() => {
    // USEEFFECT_JUSTIFICATION: imperative DOM write — measured values published as CSS
    // custom properties, re-measured on resize and body size changes.
    const host = document.querySelector<HTMLElement>(`[${SCROLL_RANGE_HOST_ATTRIBUTE}]`);
    if (host === null) return;

    return bindScrollRange(host);
  }, []);

  return null;
};
