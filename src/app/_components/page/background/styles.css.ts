import { style } from "@vanilla-extract/css";
import { calc } from "@vanilla-extract/css-utils";

import { mediaQueries, vars, fillImage } from "@theme/css";
export { anchorLink, textLink, fillImage, link } from "@theme/css";

/**
 * @package
 */
export const decorationRoot = style({
  position: "absolute",
  top: calc.multiply(vars.space.lg, -2),
  left: calc.multiply(vars.space.lg, -2),
  margin: vars.space.lg,
  width: calc.add("100%", calc.multiply(vars.space.lg, 2)),
  height: calc.add("100%", calc.multiply(vars.space.lg, 2)),
  zIndex: -1,
  overflow: "hidden",

  "@media": {
    [mediaQueries.xl]: {
      margin: "auto",
      top: 0,
      left: 0,
      width: "100%",
      height: "100%",
      borderRadius: vars.borderRadius.lg,
    },
    [mediaQueries.sm]: {
      top: calc.multiply(vars.space.md, -2),
      left: calc.multiply(vars.space.md, -2),
      margin: vars.space.md,
      width: calc.add("100%", calc.multiply(vars.space.md, 2)),
      height: calc.add("100%", calc.multiply(vars.space.md, 2)),
    },
  },
});

/**
 * @package
 */
export const decoration1 = style({
  position: "absolute",
  height: "32.8rem",
  width: "10000px",
  background: vars.palettes.accent1,
  transform: "rotate(-50deg)",
  transformOrigin: "top left",

  "@media": {
    [mediaQueries.xl]: {
      top: 700,
      left: -515,
      transform: "rotate(-42deg)",
    },
    [mediaQueries.lg]: {
      top: 2079,
      left: -515,
      transform: "rotate(-50deg)",
    },
    [mediaQueries.md]: {
      top: 1859,
      left: -565,
      transform: "rotate(-50deg)",
    },
    [mediaQueries.sm]: {
      top: 1826,
      left: -533,
      height: "12.8125rem",
      transform: "rotate(-53deg)",
    },
  },
});
/**
 * @package
 */
export const decoration2 = style({
  position: "absolute",
  "@media": {
    [mediaQueries.xl]: {
      top: 2865,
      left: 2360,
      height: "32.8rem",
      width: "10000px",
      background: vars.palettes.accent1,
      transform: "rotate(-147deg)",
      transformOrigin: "top left",
    },
    [mediaQueries.lg]: {
      display: "none",
    },
    [mediaQueries.md]: {
      display: "none",
    },
    [mediaQueries.sm]: {
      display: "none",
    },
  },
});

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
/**
 * @package
 */
export const decorationImage = style([
  fillImage,
  {
    "@media": {
      [mediaQueries.xl]: {
        transform: "rotate(-144deg)",
      },
      [mediaQueries.lg]: {
        transform: "rotate(-97deg)",
      },
      [mediaQueries.md]: {
        transform: "rotate(-97deg)",
      },
      [mediaQueries.sm]: {
        transform: "rotate(-128deg)",
      },
    },
  },
]);
