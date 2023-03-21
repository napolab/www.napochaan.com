import { style, styleVariants } from "@vanilla-extract/css";
import { calc } from "@vanilla-extract/css-utils";

import { mediaQueries, vars } from "@theme/css";

const baseHeadingRoot = style({
  display: "flex",
  gap: vars.space.sm,
  alignItems: "center",
  fontFamily: vars.font.poppins,
  lineHeight: 1,
  fontSize: vars.typography.body,
});

/**
 * @package
 */
export const headingRoot = styleVariants(
  {
    h1: {
      fontWeight: 700,
      padding: `${vars.space.sm} 0`,
      letterSpacing: "0.03em",
      "@media": {
        [mediaQueries.xl]: {
          fontSize: calc.multiply(vars.typography.body, 3),
          letterSpacing: "0.1em",
        },
        [mediaQueries.lg]: {
          fontSize: calc.multiply(vars.typography.body, 3),
          letterSpacing: "0.1em",
        },
        [mediaQueries.md]: {
          fontSize: calc.multiply(vars.typography.body, 2.25),
        },
        [mediaQueries.sm]: {
          fontSize: calc.multiply(vars.typography.body, 2),
        },
      },
    },
    h2: {
      fontWeight: 600,
      padding: `${vars.space.sm} 0`,
      letterSpacing: "0.03em",
      "@media": {
        [mediaQueries.xl]: {
          fontSize: calc.multiply(vars.typography.body, 2),
        },
        [mediaQueries.lg]: {
          fontSize: calc.multiply(vars.typography.body, 2),
        },
        [mediaQueries.md]: {
          fontSize: calc.multiply(vars.typography.body, 1.75),
        },
        [mediaQueries.sm]: {
          fontSize: calc.multiply(vars.typography.body, 1.5),
        },
      },
    },
    h3: {
      fontWeight: 500,
      padding: `${vars.space.sx} 0`,
      letterSpacing: "0.03em",
      "@media": {
        [mediaQueries.xl]: {
          fontSize: calc.multiply(vars.typography.body, 1.5),
        },
        [mediaQueries.lg]: {
          fontSize: calc.multiply(vars.typography.body, 1.5),
        },
        [mediaQueries.md]: {
          fontSize: calc.multiply(vars.typography.body, 1.25),
        },
        [mediaQueries.sm]: {
          fontSize: calc.multiply(vars.typography.body, 1),
        },
      },
    },
    h4: {
      fontWeight: 400,
      padding: `${vars.space.sx} 0`,
      letterSpacing: "0.03em",
    },
    h5: {
      fontWeight: 400,
      padding: `${vars.space.sx} 0`,
      letterSpacing: "0.03em",
    },
    h6: {
      fontWeight: 400,
      padding: `${vars.space.sx} 0`,
      letterSpacing: "0.03em",
    },
  },
  (override) => [baseHeadingRoot, override],
);
