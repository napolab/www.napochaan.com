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

// Share — hand the payload to the OS share sheet (Web Share API).
export const ShareIcon = (props: SVGProps<SVGSVGElement>) => (
  <svg {...iconBase} fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" {...props}>
    <circle cx="18" cy="5" r="3" />
    <circle cx="6" cy="12" r="3" />
    <circle cx="18" cy="19" r="3" />
    <path d="m8.59 13.51 6.83 3.98" />
    <path d="m15.41 6.51-6.82 3.98" />
  </svg>
);

// Twitter (now X) bird logo — kept as the classic bird to match the "Twitter(X)" label.
export const TwitterIcon = (props: SVGProps<SVGSVGElement>) => (
  <svg {...iconBase} fill="currentColor" {...props}>
    <path d="M23.954 4.569a10 10 0 0 1-2.825.775 4.958 4.958 0 0 0 2.163-2.723 9.99 9.99 0 0 1-3.127 1.195 4.92 4.92 0 0 0-8.384 4.482A13.96 13.96 0 0 1 1.64 3.162a4.822 4.822 0 0 0-.666 2.475 4.92 4.92 0 0 0 2.188 4.096 4.904 4.904 0 0 1-2.228-.616v.061a4.924 4.924 0 0 0 3.946 4.827 4.996 4.996 0 0 1-2.212.085 4.936 4.936 0 0 0 4.604 3.417A9.868 9.868 0 0 1 0 19.54a13.94 13.94 0 0 0 7.548 2.212c9.057 0 14.01-7.504 14.01-14.01 0-.213-.005-.426-.014-.637A10.012 10.012 0 0 0 24 4.59z" />
  </svg>
);
