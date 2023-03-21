import { style } from "@vanilla-extract/css";

import { vars, mediaQueries } from "@theme/css";

/**
 * @package
 */
export const mainRoot = style({
  "@media": {
    [mediaQueries.large]: {
      padding: vars.space.lg,
    },
    [mediaQueries.medium]: {
      padding: vars.space.lg,
    },
    [mediaQueries.small]: {
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
    [mediaQueries.large]: {
      fontSize: "1.5rem",
    },
    [mediaQueries.medium]: {
      fontSize: "1.5rem",
    },
  },
});
