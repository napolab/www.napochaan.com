import { createContainer, createVar, globalStyle, style } from "@vanilla-extract/css";
import { calc } from "@vanilla-extract/css-utils";

import { link as commonLink, mediaQueries, vars } from "@theme/css";

const characterLayer = createVar();
const firstViewContainer = createContainer();

/**
 * @package
 */
export const pageRoot = style({
  vars: {
    [characterLayer]: "2",
  },
  position: "relative",
  isolation: "isolate",

  "@media": {
    [mediaQueries.xl]: {
      maxWidth: 1920,
      margin: "0 auto",
      background: vars.pallets.background.tertiary,
      borderRadius: vars.borderRadius.lg,
    },
  },
});

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
  background: vars.pallets.accent1,
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
      top: 1855,
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
      background: vars.pallets.accent1,
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
export const characterImageRoot = style({
  position: "absolute",
  userSelect: "none",
  pointerEvents: "none",
  zIndex: characterLayer,
  transformOrigin: "top left",

  "@media": {
    [mediaQueries.xl]: {
      top: 108,
      left: -418,
      width: "78.5rem",
      transform: `rotate(-19deg)`,
    },
    [mediaQueries.lg]: {
      top: 208,
      left: -483,
      width: "81.25rem",
      transform: `rotate(-19deg)`,
    },
    [mediaQueries.md]: {
      top: 70,
      left: -376,
      width: "54.25rem",
      transform: `rotate(-19deg)`,
    },
    [mediaQueries.sm]: {
      top: 165,
      left: -250,
      width: "41rem",
      transform: `rotate(-19deg)`,
    },
  },
});

/**
 * @package
 */
export const characterImage = style({
  objectFit: "contain",
  width: "100%",
});

/**
 * @package
 */
export const firstView = style({
  containerName: firstViewContainer,
  containerType: "inline-size",
  position: "relative",
  width: "100%",
  isolation: "isolate",

  "@media": {
    [mediaQueries.xl]: {
      display: "flex",
      flexDirection: "column",
      justifyContent: "space-between",
      alignItems: "flex-end",
      aspectRatio: "1376 / 1043", // 1440 x 1080 から padding を引いたもの
      maxHeight: calc.subtract("100vh", calc.multiply(vars.space.lg, 2)),

      "@supports": {
        "(height: 100svh)": {
          maxHeight: calc.subtract("100svh", calc.multiply(vars.space.lg, 2)),
        },
      },
    },
    [mediaQueries.lg]: {
      minHeight: calc.subtract("100vh", calc.multiply(vars.space.lg, 2)),

      "@supports": {
        "(height: 100svh)": {
          minHeight: calc.subtract("100svh", calc.multiply(vars.space.lg, 2)),
        },
      },
    },
    [mediaQueries.md]: {
      display: "flex",
      flexDirection: "column",
      justifyContent: "space-between",
      minHeight: calc.subtract("100vh", calc.multiply(vars.space.lg, 2)),

      "@supports": {
        "(height: 100svh)": {
          minHeight: calc.subtract("100svh", calc.multiply(vars.space.lg, 2)),
        },
      },
    },
  },
});

/**
 * @package
 */
export const heading1 = style({
  position: "relative",
  zIndex: calc.add(characterLayer, 1),

  "@media": {
    [mediaQueries.xl]: {
      marginTop: "17.5rem",
      marginRight: "2rem",
    },
    [mediaQueries.lg]: {
      justifyContent: "flex-end",
    },
    [mediaQueries.md]: {
      marginTop: "12rem",
      justifyContent: "flex-end",
    },
    [mediaQueries.sm]: {
      justifyContent: "flex-end",
    },
  },
});

/**
 * @package
 */
export const link = style([
  commonLink,
  {
    color: vars.pallets.text.main,
  },
]);

globalStyle(`${link} > *`, {
  display: "inline-block",
});

/**
 * @package
 */
export const section1 = style({
  "@media": {
    [mediaQueries.sm]: {
      minHeight: calc.subtract("100vh", calc.multiply(vars.space.md, 2)),

      "@supports": {
        "(height: 100svh)": {
          minHeight: calc.subtract("100svh", calc.multiply(vars.space.md, 2)),
        },
      },
    },
  },
});

/**
 * @package
 */
export const sectionRoot = style({
  "@media": {
    [mediaQueries.xl]: {
      overflowX: "hidden",
    },
  },
});

export const tileRoot = style({
  "@media": {
    [mediaQueries.xl]: {
      padding: vars.space.lg,
      background: `rgba(${vars.pallets.rgb.background.main})`,
      boxShadow: `0px ${vars.space.sx} ${vars.space.md} 0px ${vars.pallets.background.secondary}`,
    },
    [mediaQueries.lg]: {
      padding: vars.space.lg,
      background: `rgba(${vars.pallets.rgb.background.secondary}, 0.9)`,
      boxShadow: `${vars.space.sx} ${vars.space.sx} ${vars.space.md} rgba(0, 0, 0, 0.25)`,
      borderRadius: vars.borderRadius.lg,
    },
    [mediaQueries.md]: {
      padding: calc.multiply(vars.space.md, 1.5),
      background: `rgba(${vars.pallets.rgb.background.secondary}, 0.9)`,
      boxShadow: `${vars.space.sx} ${vars.space.sx} ${vars.space.md} rgba(0, 0, 0, 0.25)`,
      borderRadius: vars.borderRadius.md,
    },
    [mediaQueries.sm]: {
      padding: `${vars.space.sm} ${vars.space.md}`,
      background: `rgba(${vars.pallets.rgb.background.secondary}, 0.9)`,
      boxShadow: `${vars.space.sx} ${vars.space.sx} ${vars.space.md} rgba(0, 0, 0, 0.25)`,
      borderRadius: vars.borderRadius.md,
    },
  },
});

/**
 * @package
 */
export const aboutMeWrapper = style({
  "@media": {
    [mediaQueries.lg]: {
      display: "flex",
      justifyContent: "flex-end",
    },
  },
});

/**
 * @package
 */
export const aboutMeRoot = style([
  tileRoot,
  {
    position: "relative",
    zIndex: calc.add(characterLayer, 1),

    "@media": {
      [mediaQueries.xl]: {
        width: "40rem",
        borderRadius: `${vars.borderRadius.md} 0px 0px ${vars.borderRadius.md}`,
      },
      [mediaQueries.lg]: {
        marginTop: "23.75rem",
        width: "36.5625rem",
        borderRadius: vars.borderRadius.md,
      },
    },
  },
]);

/**
 * @package
 */
export const aboutMe = style({
  display: "flex",
  flexDirection: "column",
  fontSize: vars.typography.body,

  "@media": {
    [mediaQueries.xl]: {
      marginTop: calc.multiply(vars.space.md, 1.5),
      gap: vars.space.md,
    },
    [mediaQueries.lg]: {
      marginTop: calc.multiply(vars.space.md, 1.5),
      gap: vars.space.md,
    },
    [mediaQueries.md]: {
      marginTop: vars.space.md,
      gap: vars.space.sm,
    },
    [mediaQueries.sm]: {
      marginTop: vars.space.md,
      gap: vars.space.sm,
    },
  },
});
