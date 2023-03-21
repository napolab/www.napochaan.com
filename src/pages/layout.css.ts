import { style } from "@vanilla-extract/css";

import { vars, mediaQueries } from "@theme/css";

/**
 * @package
 */
export const mainRoot = style({
  "@media": {
    [mediaQueries.xl]: {
      padding: vars.space.lg,
    },
    [mediaQueries.lg]: {
      padding: vars.space.lg,
    },
    [mediaQueries.md]: {
      padding: vars.space.lg,
    },
    [mediaQueries.sm]: {
      padding: vars.space.md,
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
    [mediaQueries.xl]: {
      fontSize: "1.5rem",
    },
    [mediaQueries.lg]: {
      fontSize: "1.5rem",
    },
    [mediaQueries.md]: {
      fontSize: "1.5rem",
    },
  },
});
