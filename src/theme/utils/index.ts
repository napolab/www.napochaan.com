export * from "./convert-hex-2-rgb";
export * from "./vanilla-extract";

const xl = 1440;
const lg = 1024;
const md = 700;
export const mediaQueries = {
  xl: `screen and (min-width: ${xl}px)`,
  lg: `screen and (min-width: ${lg}px) and (max-width: ${xl - 1}px)`,
  md: `screen and (min-width: ${md}px) and (max-width: ${lg - 1}px)`,
  sm: `screen and (max-width: ${md - 1}px)`,
} as const;
