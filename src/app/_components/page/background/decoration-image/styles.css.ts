import { style } from "@vanilla-extract/css";

import { mediaQueries } from "@theme/css";

/**
 * @package
 */
export const decorationImageRoot = style({
  position: "absolute",
  zIndex: 0,
  userSelect: "none",
  pointerEvents: "none",

  "@media": {
    [mediaQueries.xl]: {
      bottom: 195,
      right: -540,
      width: "56.25rem",
    },
    [mediaQueries.lg]: {
      left: 18,
      bottom: -516,
      width: "68.25rem",
    },
    [mediaQueries.md]: {
      left: 40,
      bottom: -417,
      width: "72.25rem",
    },
    [mediaQueries.sm]: {
      left: -32,
      bottom: -147,
      width: "54.75rem",
    },
  },
});
