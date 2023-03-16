import { style } from "@vanilla-extract/css";

import { vars, mediaQueries } from "@theme/css";

/**
 * @package
 */
export const mainRoot = style({
  "@media": {
    [mediaQueries.sp]: {
      padding: vars.space.md,
    },
    [mediaQueries.pc]: {
      padding: vars.space.lg,
    },
  },
});

/**
 * @package
 */
export const footerRoot = style({
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  lineHeight: 1.5,
  letterSpacing: "0.05em",
  padding: vars.space.md,

  "@media": {
    [mediaQueries.pc]: {
      fontSize: "1.5rem",
    },
  },
});
