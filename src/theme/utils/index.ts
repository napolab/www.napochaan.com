export * from "./convert-hex-2-rgb";
export * from "./vanilla-extract";

const large = 1024;
const medium = 700;
export const mediaQueries = {
  large: `screen and (min-width: ${large}px)`,
  medium: `screen and (min-width: ${medium}px) and (max-width: ${large - 1}px)`,
  small: `screen and (max-width: ${medium - 1}px)`,
};
