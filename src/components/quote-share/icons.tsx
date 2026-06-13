import type { SVGProps } from 'react';

const iconBase = {
  width: 18,
  height: 18,
  viewBox: '0 0 24 24',
  'aria-hidden': true as const,
  focusable: false as const,
};

// Copy — duplicate the quote block to the clipboard.
export const CopyIcon = (props: SVGProps<SVGSVGElement>) => (
  <svg {...iconBase} fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" {...props}>
    <rect width="13" height="13" x="9" y="9" rx="2" ry="2" />
    <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
  </svg>
);

// Check — copy confirmation.
export const CheckIcon = (props: SVGProps<SVGSVGElement>) => (
  <svg {...iconBase} fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" {...props}>
    <path d="M20 6 9 17l-5-5" />
  </svg>
);

// X (formerly Twitter) logo.
export const XIcon = (props: SVGProps<SVGSVGElement>) => (
  <svg {...iconBase} fill="currentColor" {...props}>
    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24h-6.66l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
  </svg>
);
