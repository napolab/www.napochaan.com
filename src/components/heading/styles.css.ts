import { style, styleVariants } from "@vanilla-extract/css";

import { mediaQueries, vars } from "@theme/css";

const baseHeadingRoot = style({
  display: "inline-flex",
  gap: vars.space.sm,
  alignItems: "center",
  fontFamily: vars.font.poppins,
  letterSpacing: "0.03em",
  lineHeight: 1,
  fontSize: vars.typography.body,
});

/**
 * @package
 */
export const headingRoot = styleVariants(
  {
    h1: {
      fontSize: vars.typography.heading1,
      fontWeight: 700,
      padding: `${vars.space.sm} 0`,
      "@media": {
        [mediaQueries.pc]: {
          letterSpacing: "0.1em",
        },
      },
    },
    h2: {
      fontSize: vars.typography.heading2,
      fontWeight: 600,
      padding: `${vars.space.sm} 0`,
    },
    h3: {
      fontSize: vars.typography.heading3,
      fontWeight: 500,
      padding: `${vars.space.sx} 0`,
    },
    h4: {
      fontWeight: 400,
      padding: `${vars.space.sx} 0`,
    },
    h5: {
      fontWeight: 400,
      padding: `${vars.space.sx} 0`,
    },
    h6: {
      fontWeight: 400,
      padding: `${vars.space.sx} 0`,
    },
  },
  (override) => [baseHeadingRoot, override],
);
