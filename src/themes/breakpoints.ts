export const breakpoints = {
  mobile: '0px', // 0–479 (target down to 375)
  tablet: '480px', // 480–767
  desktop: '768px', // 768–1919
  fulldesktop: '1920px', // 1920+
} as const;

export type Viewport = keyof typeof breakpoints;

/** min-width media query strings for each breakpoint above mobile */
export const breakpointMediaQueries = Object.fromEntries(
  Object.entries(breakpoints)
    .filter(([, v]) => v !== '0px')
    .map(([k, v]) => [k, `(min-width: ${v})`]),
) as { [K in Exclude<Viewport, 'mobile'>]: string };
