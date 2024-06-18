import { createVar, style } from "@vanilla-extract/css";
import { calc } from "@vanilla-extract/css-utils";

import { mediaQueries, vars } from "@theme/css";

export const characterLayer = createVar();
export const fixedLayer = createVar();

/**
 * @package
 */
export const section1 = style({
  "@media": {
    [mediaQueries.sm]: {
      minHeight: calc.subtract("100vh", calc.multiply(vars.space.md, 1)),

      "@supports": {
        "(height: 100svh)": {
          minHeight: calc.subtract("100svh", calc.multiply(vars.space.md, 1)),
        },
      },
    },
  },
});

/**
 * @package
 */
export const section2 = style({
  "@media": {
    [mediaQueries.xl]: {
      marginTop: vars.space.xl,
    },
    [mediaQueries.lg]: {
      marginTop: vars.space.xl,
    },
    [mediaQueries.md]: {
      marginTop: vars.space.lg,
    },
    [mediaQueries.sm]: {
      marginTop: vars.space.lg,
    },
  },
});

/**
 * @package
 */
export const section3 = style({
  display: "flex",
  flexDirection: "column",
  gap: vars.space.sm,

  "@media": {
    [mediaQueries.md]: {
      gap: vars.space.xs,
    },
    [mediaQueries.sm]: {
      gap: vars.space.xs,
    },
  },
});

export const tile = style({
  "@media": {
    [mediaQueries.xl]: {
      padding: vars.space.lg,
      background: `rgba(${vars.palettes.rgb.background.main})`,
      boxShadow: `0px ${vars.space.xs} ${vars.space.md} 0px ${vars.palettes.background.secondary}`,
    },
    [mediaQueries.lg]: {
      padding: vars.space.lg,
      background: `rgba(${vars.palettes.rgb.background.secondary}, 0.9)`,
      boxShadow: `${vars.space.xs} ${vars.space.xs} ${vars.space.md} rgba(0, 0, 0, 0.25)`,
      borderRadius: vars.borderRadius.lg,
    },
    [mediaQueries.md]: {
      padding: calc.multiply(vars.space.md, 1.5),
      background: `rgba(${vars.palettes.rgb.background.secondary}, 0.9)`,
      boxShadow: `${vars.space.xs} ${vars.space.xs} ${vars.space.md} rgba(0, 0, 0, 0.25)`,
      borderRadius: vars.borderRadius.md,
    },
    [mediaQueries.sm]: {
      padding: `${vars.space.sm} ${vars.space.md}`,
      background: `rgba(${vars.palettes.rgb.background.secondary}, 0.9)`,
      boxShadow: `${vars.space.xs} ${vars.space.xs} ${vars.space.md} rgba(0, 0, 0, 0.25)`,
      borderRadius: vars.borderRadius.md,
    },
  },
});
