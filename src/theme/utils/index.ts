export * from "./convert-hex-2-rgb";
export * from "./vanilla-extract";

const breakpoint = 1080;
export const mediaQueries = {
  pc: `screen and (min-width: ${breakpoint}px)`,
  sp: `screen and (max-width: ${breakpoint - 1}px)`,
};
