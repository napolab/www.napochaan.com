export const breakpoints = {
  mobile: '0px',
  tablet: '768px',
  desktop: '1024px',
  fulldesktop: '1440px',
} as const;

export type Viewport = keyof typeof breakpoints;

/** min-width media query strings for each breakpoint above mobile */
export const breakpointMediaQueries = Object.fromEntries(
  Object.entries(breakpoints)
    .filter(([, v]) => v !== '0px')
    .map(([k, v]) => [k, `(min-width: ${v})`]),
) as { [K in Exclude<Viewport, 'mobile'>]: string };
