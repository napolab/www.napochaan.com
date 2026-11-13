'use client';

import { useEffect } from 'react';

import { bindScrollRange } from './bind-scroll-range';

// Publishes --scroll-range / --viewport-h / --doc-h onto <html> (see
// ./bind-scroll-range, shared with the <scroll-range-sync> element). Renders nothing.
export const ScrollRangeSync = () => {
  useEffect(() => {
    // USEEFFECT_JUSTIFICATION: imperative DOM write — measured values published as CSS
    // custom properties, re-measured on resize and body size changes.
    return bindScrollRange();
  }, []);

  return null;
};
