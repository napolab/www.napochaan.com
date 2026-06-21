import type { SVGProps } from 'react';

const iconBase = {
  width: 12,
  height: 12,
  viewBox: '0 0 24 24',
  'aria-hidden': true as const,
  focusable: false as const,
};

// Chevron — marks the release-note row as an expand/collapse toggle. Points right
// when collapsed; the consumer rotates it to point down when expanded (CSS, via the
// `data-expanded` attribute).
export const ChevronIcon = (props: SVGProps<SVGSVGElement>) => (
  <svg {...iconBase} fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" {...props}>
    <path d="m9 18 6-6-6-6" />
  </svg>
);
